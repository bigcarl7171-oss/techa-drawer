"""테차 블로그 → 세로 쇼츠 일괄 렌더러.

python3 render.py            # 11편 전부
python3 render.py <slug> ... # 일부만

vo/<slug>/<번호>.wav 가 있으면 내레이션으로 넣고 장면 길이를 음성에 맞춘다.
없으면 내레이션 문장을 화면 아래 작은 자막으로 띄운 '자막판'으로 만든다.
"""
import math, os, re, subprocess, sys, json
from multiprocessing import Pool
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCR = os.environ.get("TECHA_SHORTS_WORK", "D:/techa-shorts/build/work")  # 음성·결과물 작업 폴더 (저장소 밖)
os.makedirs(SCR, exist_ok=True)
sys.path.insert(0, HERE)
# 편 묶음 데이터(plan_data · plan_revised · reading_script · scenes)가 있는 폴더
PROJ = os.environ.get("TECHA_SHORTS_PROJECT", os.path.join(os.path.dirname(HERE), "projects", "2026-10-04-11편-v3"))
sys.path.insert(0, PROJ)
from plan_revised import VIDEOS  # noqa  (2026-10-04 원고 수정판)
try:
    from scenes import SHOTS  # 장면별 배경 사진 지정
except ImportError:
    SHOTS = {}
import audio  # noqa
import motion  # noqa  사진에 입체감·미세한 흔들림·조명 숨쉬기 (무료, CPU)

SRC = os.environ.get("TECHA_SHORTS_SRC", "D:/techa-shorts/src/techa-11편-원본")  # 원본 사진·폰트·로고
OUT = os.path.join(SCR, "videos")
VO = os.path.join(SCR, "vo")
FONT = os.path.join(SRC, "공통", "폰트")
W, H, FPS = 1080, 1920, 30

# ---- 세이프존 (brand-rules §5-5): 위 220 · 아래 430 · 오른쪽 130 · 왼쪽 60 → 890×1270
SAFE_L, SAFE_R, SAFE_T, SAFE_B = 60, 950, 220, 1490
CX = (SAFE_L + SAFE_R) / 2   # 글자는 화면 가운데(540)가 아니라 안전 영역 가운데(505)에 맞춘다
MAXW = 840                   # 글자 블록 최대 폭 (좌우 25px 여유)
VO_TOP = 1130                # 설명 자막 블록 위쪽 — 자막 자리 1100~1420 (바닥에서 500~820px)
STACK_BOTTOM = VO_TOP - 34   # 자막 박스·칩은 설명 자막 위에서부터 위로 쌓는다
GAP_Y = 30                   # 겹치지 않게 블록 사이에 두는 간격
TOPIC_Y = 300                # 주제 표시(로고 아래) 위쪽 — 영상 내내 '무엇에 대한 영상인지' 보이게
HOOK_Y = 392                 # 첫 화면 큰 문구 위쪽 (주제 표시 아래)
TOP_LIMIT = 378              # 주제 표시(300~356) 아래부터 연출 자리

CREAM = (250, 243, 234)
BROWN = (58, 50, 43)
INK = (38, 32, 28)
GOLD = (201, 169, 97)
GOLD_HI = (233, 201, 128)  # 어두운 띠 위 강조 글자
PINK = (245, 217, 211)
SAGE = (168, 184, 154)
STAMP = (178, 64, 52)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT, name), size)


F_HOOK = lambda s=104: font("GowunBatang-Bold.ttf", s)
_HANJA = re.compile(r"[\u4e00-\u9fff]")


def F_HANJA(s):
    f = ImageFont.truetype(os.path.join(FONT, "NotoSerifKR.ttf"), s)
    try:
        f.set_variation_by_name("Bold")
    except Exception:
        pass
    return f


def serif_for(txt):
    return F_HANJA if _HANJA.search(txt) else F_HOOK
F_CAP = lambda s=62: font("Pretendard-Bold.otf", s)
F_VO = lambda s=40: font("Pretendard-Medium.otf", s)
F_CHIP = lambda s=40: font("Pretendard-SemiBold.otf", s)


# ------------------------------------------------------------ easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(t):
    return 1 - (1 - clamp(t)) ** 3


def ease_back(t, s=1.9):
    t = clamp(t) - 1
    return t * t * ((s + 1) * t + s) + 1


def ease_in(t):
    return clamp(t) ** 3


# ------------------------------------------------------------ drawing helpers
def text_size(d, txt, f):
    b = d.textbbox((0, 0), txt, font=f)
    return b[2] - b[0], b[3] - b[1], b


def fit_font(txt, maker, size, maxw):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    while size > 24:
        f = maker(size)
        if text_size(d, txt, f)[0] <= maxw:
            return f
        size -= 2
    return maker(size)


def wrap(txt, f, maxw):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    words, lines, cur = txt.split(" "), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if text_size(d, t, f)[0] <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def rounded(size, r, fill):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=fill)
    return im


def shadow(im, blur=18, alpha=110, off=(0, 8)):
    a = im.split()[-1].point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", (im.width + blur * 4, im.height + blur * 4), (0, 0, 0, 0))
    base = Image.new("RGBA", im.size, INK + (255,))
    base.putalpha(a)
    sh.alpha_composite(base, (blur * 2 + off[0], blur * 2 + off[1]))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(im, (blur * 2, blur * 2))
    return sh, blur * 2


# ---- 검수: 글자 레이어가 그려진 자리를 프레임마다 모아 세이프존 이탈·겹침을 센다 (TECHA_QA=1)
QA = os.environ.get("TECHA_QA", "1") == "1"
MOTION = os.environ.get("TECHA_MOTION", "1") == "1"  # 0 이면 사진 움직임 끄기
_RECTS = []


def qa_reset():
    _RECTS.clear()


def paste_center(canvas, im, cx, cy, scale=1.0, alpha=1.0, angle=0, kind=None):
    if scale <= 0.01 or alpha <= 0.01:
        return
    if QA and kind and alpha > 0.6 and scale <= 1.02:
        bb = im.split()[-1].getbbox()
        if bb:
            s = scale
            x0 = cx - im.width * s / 2 + bb[0] * s
            y0 = cy - im.height * s / 2 + bb[1] * s
            _RECTS.append((kind, x0, y0, x0 + (bb[2] - bb[0]) * s, y0 + (bb[3] - bb[1]) * s))
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if angle:
        im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = im.split()[-1].point(lambda v: int(v * alpha))
        im = im.copy()
        im.putalpha(a)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def gradient(h, top_alpha, bottom_alpha, color=INK):
    g = np.linspace(top_alpha, bottom_alpha, h).astype(np.uint8)
    a = np.repeat(g[:, None], W, axis=1)
    im = Image.new("RGBA", (W, h), color + (0,))
    im.putalpha(Image.fromarray(a, "L"))
    return im


SCRIM_TOP = gradient(int(H * 0.36), 200, 0)
SCRIM_BOT = gradient(int(H * 0.55), 0, 225)


# ------------------------------------------------------------ assets per video
def src_dir(slug):
    return next(os.path.join(SRC, n) for n in os.listdir(SRC) if n.endswith(slug) and n[:2].isdigit())


def load_images(slug):
    d = os.path.join(src_dir(slug), "원본사진")
    names = ["cover.jpg"] + sorted(n for n in os.listdir(d) if re.match(r"img-\d+\.jpg", n))
    out = []
    for n in names:
        im = Image.open(os.path.join(d, n)).convert("RGB")
        s = (H * 1.06) / im.height
        im = im.resize((int(im.width * s), int(H * 1.06)), Image.LANCZOS)
        im = ImageEnhance.Contrast(im).enhance(1.04)
        out.append(im)
    return out


_SHOT_CACHE = {}


def load_shot(spec, slug):
    """'img-2.jpg' · '03/img-2.jpg' · 'img-2.jpg@0.8' → (사진, 가로 초점 0~1). 높이를 1920x1.06에 맞춘다."""
    path, _, f = spec.partition("@")
    focus = float(f) if f else 0.5
    if "/" in path:
        num, name = path.split("/", 1)
        d = next(os.path.join(SRC, n) for n in os.listdir(SRC) if n.startswith(num + "-"))
    else:
        d, name = src_dir(slug), path
    key = os.path.join(d, "원본사진", name)
    if key not in _SHOT_CACHE:
        im = Image.open(key).convert("RGB")
        sc = (H * 1.06) / im.height
        im = im.resize((int(im.width * sc), int(H * 1.06)), Image.LANCZOS)
        im = ImageEnhance.Contrast(im).enhance(1.04)
        im.depth = motion.depth_of(np.array(im), os.path.relpath(key, SRC))  # 사진마다 한 번 계산해 저장
        _SHOT_CACHE[key] = im
    return _SHOT_CACHE[key], focus


LOGO = None


def logo(color, height):
    global LOGO
    if LOGO is None:
        LOGO = Image.open(os.path.join(SRC, "공통", "로고", "techa-logo.png")).convert("RGBA")
    a = LOGO.split()[-1]
    w = int(LOGO.width * height / LOGO.height)
    a = a.resize((w, height), Image.LANCZOS)
    im = Image.new("RGBA", (w, height), color + (0,))
    im.putalpha(a)
    return im


# ------------------------------------------------------------ layer builders
def make_hook(lines, bhard):
    f = F_HOOK(112)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    mk = serif_for("".join(lines))
    f = min((fit_font(l, mk, 112, MAXW) for l in lines), key=lambda x: x.size)
    lh = int(f.size * 1.22)
    im = Image.new("RGBA", (W, lh * len(lines) + 40), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        tw, th, b = text_size(dr, l, f)
        x = int(CX - tw / 2) - b[0]
        y = i * lh
        dr.text((x + 3, y + 5), l, font=f, fill=INK + (150,))
        dr.text((x, y), l, font=f, fill=CREAM + (255,))
    # 마지막 줄 밑에 골드 밑줄 면
    tw, th, b = text_size(dr, lines[-1], f)
    return im, int(CX - tw / 2), lh * (len(lines) - 1) + int(f.size * 1.08), tw


CIRC = str.maketrans({"①": "1. ", "②": "2. ", "③": "3. ", "④": "4. "})


def make_caption(lines):
    lines = [l.translate(CIRC).replace("  ", " ") for l in lines]
    mk = F_HANJA if _HANJA.search("".join(lines)) else F_CAP
    f = min((fit_font(l, mk, 64, MAXW - 80) for l in lines), key=lambda x: x.size)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    lh = int(f.size * 1.32)
    tws = [text_size(d, l, f)[0] for l in lines]
    bw = max(tws) + 72
    bh = lh * len(lines) + 44
    im = rounded((bw, bh), 26, INK + (222,))
    dr = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        b = d.textbbox((0, 0), l, font=f)
        dr.text(((bw - tws[i]) // 2 - b[0], 22 + i * lh - b[1] + 6), l, font=f, fill=CREAM + (255,))
    return im


def make_vo_text(txt):
    f = F_VO(42)
    lines = wrap(txt, f, 880)[:4]
    lh = int(f.size * 1.42)
    im = Image.new("RGBA", (W, lh * len(lines) + 10), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, W, im.height], fill=INK + (120,))
    for i, l in enumerate(lines):
        tw, th, b = text_size(dr, l, f)
        x = (W - tw) // 2 - b[0]
        dr.text((x + 2, i * lh + 3), l, font=f, fill=(0, 0, 0, 160))
        dr.text((x, i * lh), l, font=f, fill=CREAM + (240,))
    return im


# ------------------------------------------------------------ 설명 자막 (문장 단위 · 강조어 팝)
KEYWORDS = ["테차", "프리저브드", "비누꽃", "돈꽃다발", "용돈케이크", "용돈박스", "무드등", "해바라기", "꽃가루", "생화",
            "고희", "희수", "미수", "환갑", "진갑", "지혼식", "회혼례", "축의금", "범인", "무죄", "백합", "고양이",
            "종이", "시들지", "그대로", "공방", "한 송이", "맞춤", "균형", "향을", "편지", "카드", "취향", "국화", "코스모스",
            "금잔화", "메리골드", "돼지풀", "골든로드", "병동", "전화", "액자", "이오난사", "반지", "지폐", "칠순", "만 69세"]
STOP = {"그래서", "그리고", "하지만", "그래도", "진짜", "정말", "그런데", "근데", "보통", "이건", "여기", "이렇게", "같은"}
JOSA = "은는이가을를도에의와과로요죠"
VO_N, VO_E = 50, 56  # 일반 / 강조 글자 크기


def _bare(w):
    w = re.sub(r"[.,?!'\"“”‘’…]", "", w)
    return w


def _stem(w):
    w = _bare(w)
    return w[:-1] if len(w) > 2 and w[-1] in JOSA else w


def vo_chunks(text, caption):
    """문장 → 화면 단위(최대 2줄) 조각. 각 조각은 [(단어, 강조?)] 줄 목록."""
    fN, fE = F_VO(VO_N), F_CAP(VO_E)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    maxw = MAXW - 30

    def width(words):
        return sum(text_size(d, w, fE if e else fN)[0] for w, e in words) + 14 * max(0, len(words) - 1)

    cap_tokens = {_stem(t) for t in re.split(r"[\s/·:=+,]+", caption) if len(_stem(t)) >= 2 and _stem(t) not in STOP}
    VERB_END = tuple("요다면고서게지며는던까죠네려니라야")
    GOOD_END = tuple("고서면며는은을를에의도게지데니로요다죠과와이가")

    def pick_emph(words, ch):
        score = [0] * len(words)
        inq = False
        for i, w in enumerate(words):
            if w.startswith("'") or w.startswith("‘"):
                inq = True
            if inq:
                score[i] = 3
            if inq and ("'" in w[1:] or "’" in w):
                inq = False
            if re.search(r"\d", w):
                score[i] = max(score[i], 4)
            b = _bare(w)
            if any(b.startswith(k) for k in KEYWORDS if " " not in k) or any(
                    " " in k and k in ch and k.split()[0] == b for k in KEYWORDS):
                score[i] = max(score[i], 2)
            st = _stem(w)
            if (len(st) >= 2 and st not in STOP and not b.endswith(VERB_END)
                    and any(st.startswith(t) or t.startswith(st) for t in cap_tokens)):
                score[i] = max(score[i], 1)
        if sum(1 for x in score if x == 3) > 5:  # 너무 긴 인용은 강조하지 않는다
            score = [0 if x == 3 else x for x in score]
        emph = {i for i, x in enumerate(score) if x == 3}
        for i in sorted([i for i, x in enumerate(score) if 0 < x != 3], key=lambda i: -score[i]):
            if len(emph - {j for j, x in enumerate(score) if x == 3}) < 3:
                emph.add(i)
        return emph

    def split_balanced(toks):
        if width(toks) <= maxw:
            return [toks]
        best, bi = None, 1
        for i in range(1, len(toks)):
            m = max(width(toks[:i]), width(toks[i:]))
            last = _bare(toks[i - 1][0])
            if not (toks[i - 1][0].endswith(",") or last.endswith(GOOD_END)):
                m += 260  # 꾸미는 말 뒤(한, 진짜, 작은 …)에서는 자르지 않는다
            if toks[i - 1][0].endswith(","):
                m -= 150  # 쉼표 자리를 먼저
            if best is None or m < best:
                best, bi = m, i
        a, b = toks[:bi], toks[bi:]
        return split_balanced(a) + split_balanced(b)

    out, sent_of = [], []
    sentences = [x for x in re.split(r"(?<=[.?!])\s+", text.strip()) if x]
    for si, sent in enumerate(sentences):
        sent_of.extend([si - 1] * (len(out) - len(sent_of)))  # 앞 문장 조각 표시
        words = sent.split()
        emph = pick_emph(words, sent)
        toks = [(w, i in emph) for i, w in enumerate(words)]
        # 쉼표 구절 단위로 자르고, 한 줄에 안 들어가는 구절만 양쪽 길이를 맞춰 다시 자른다
        parts, cur = [], []
        for t in toks:
            cur.append(t)
            if t[0].endswith(","):
                parts.append(cur)
                cur = []
        if cur:
            parts.append(cur)
        # 짧은 구절은 이웃 구절과 합친다
        merged = []
        for p_ in parts:
            if merged and (width(p_) < maxw * 0.35 or width(merged[-1]) < maxw * 0.35) and width(merged[-1] + p_) <= maxw * 2:
                merged[-1] = merged[-1] + p_
            else:
                merged.append(p_)
        # 구절 단위로 화면 조각을 채운다 (한 구절이 두 조각에 걸치지 않게)
        cur = []
        for p_ in merged:
            pl = split_balanced(p_) if width(p_) > maxw else [p_]
            if len(pl) > 2:
                if cur:
                    out.append(cur)
                    cur = []
                for k in range(0, len(pl), 2):
                    out.append(pl[k:k + 2])
                continue
            if cur and len(cur) + len(pl) > 2:
                out.append(cur)
                cur = []
            cur = cur + pl
        if cur:
            out.append(cur)
    sent_of.extend([len(sentences) - 1] * (len(out) - len(sent_of)))
    return [{"lines": c, "s": s} for c, s in zip(out, sent_of)]


_WORD_CACHE = {}


def word_img(w, emph):
    key = (w, emph)
    if key not in _WORD_CACHE:
        f = F_CAP(VO_E) if emph else F_VO(VO_N)
        fN = F_VO(VO_N)
        m = re.match(r"^(.*?)([.,?!]*)$", w)
        core, punct = (m.group(1), m.group(2)) if emph else (w, "")
        d = ImageDraw.Draw(Image.new("L", (1, 1)))
        tw, th, b = text_size(d, core, f)
        pw = text_size(d, punct, fN)[0] if punct else 0
        im = Image.new("RGBA", (tw + pw + 8, int(VO_E * 1.45)), (0, 0, 0, 0))
        dr = ImageDraw.Draw(im)
        y = int(VO_E * 0.28) - b[1]
        dr.text((2 - b[0] + 2, y + 3), core, font=f, fill=(0, 0, 0, 170))
        dr.text((2 - b[0], y), core, font=f, fill=(GOLD_HI if emph else CREAM) + (255,))
        if emph:
            dr.rectangle([2, im.height - 9, 2 + tw, im.height - 4], fill=GOLD + (230,))
            if punct:
                bb = fN.getbbox(punct)
                dr.text((2 + tw + 1 - bb[0], y + (f.size - fN.size)), punct, font=fN, fill=CREAM + (255,))
        _WORD_CACHE[key] = im
    return _WORD_CACHE[key]


def layout_chunk(lines):
    """조각 → [(이미지, x, y, 강조?, 순번, 줄 번호, 줄 안 순번)], 블록 높이"""
    items, idx = [], 0
    lh = int(VO_E * 1.5)
    for li, line in enumerate(lines):
        ims = [word_img(w, e) for w, e in line]
        tw = sum(i.width for i in ims) + 10 * (len(ims) - 1)
        x = CX - tw / 2
        for kin, ((w, e), im) in enumerate(zip(line, ims)):
            items.append((im, x, li * lh + (lh - im.height) / 2, e, idx, li, kin))
            x += im.width + 10
            idx += 1
    return items, lh * len(lines)


def vo_segments(text, caption):
    """내레이션을 '말 토막'으로 나눈다 — 자막 한 줄이 한 토막, 줄 안에 쉼표가 있으면 거기서도 끊는다.
    TTS는 토막마다 따로 만들고 사이에 쉼을 넣는다 → 쉼표·줄바꿈마다 한 템포 쉬고, 자막 줄이 말과 맞는다."""
    chunks = vo_chunks(text, caption)
    segs = []
    for ci, c in enumerate(chunks):
        for li, line in enumerate(c["lines"]):
            cur = []
            for w, _ in line:
                cur.append(w)
                if w.endswith(","):
                    segs.append((ci, li, " ".join(cur)))
                    cur = []
            if cur:
                segs.append((ci, li, " ".join(cur)))
    return chunks, segs


def phrase_chunks(read_line, caption):
    """낭독 대본 한 장면 → 자막 화면(조각)과 말 토막.
    말 토막(쉼과 쉼 사이)이 자막 한 줄이 된다. 한 화면은 최대 2줄, 문장이 끝나거나 긴 뜸(///)이면 화면을 넘긴다.
    토막이 한 줄에 안 들어가면 그 토막만 폭에 맞춰 줄을 나눈다(그 안에서는 쉬지 않는다)."""
    import reading_script as RS
    chunks, segs, cur = [], [], None
    for txt, mark in RS.parse(read_line):
        shown = RS.show(txt)
        plines = [ln for c in vo_chunks(shown, caption) for ln in c["lines"]]
        if cur is None or len(cur["lines"]) + len(plines) > 2:
            cur = {"lines": [], "s": 0}
            chunks.append(cur)
        segs.append((len(chunks) - 1, len(cur["lines"]), shown, RS.say(txt), mark))
        cur["lines"].extend(plines)
        if re.search(r"[.?!…]['’”]?$", shown) or mark == "///":
            cur = None
    return chunks, segs


def seg_times(chunks, segs, dur, lead=0.15):
    """토막 시각(segs: [{c,l,a,b}])으로 조각 [시작, 끝]과 조각 안 줄별 시작(조각 기준)을 정한다."""
    starts, line_off = [], []
    for ci, c in enumerate(chunks):
        mine = [g for g in segs if g["c"] == ci]
        t0 = lead + min(g["a"] for g in mine)
        starts.append(t0)
        nch = [sum(len(w) for w, _ in ln) for ln in c["lines"]]
        offs = []
        for li in range(len(c["lines"])):
            own = [g for g in mine if g["l"] == li]
            if own:
                offs.append(lead + min(g["a"] for g in own) - t0)
                continue
            # 긴 토막이 폭 때문에 두 줄로 나뉜 경우 — 그 토막(g) 안에서 글자 수 비율로 잡는다
            g = max((x for x in mine if x["l"] < li), key=lambda x: x["l"])
            nxt = min([x["l"] for x in mine if x["l"] > g["l"]] + [len(c["lines"])])
            frac = sum(nch[g["l"]:li]) / max(sum(nch[g["l"]:nxt]), 1)
            offs.append(lead + g["a"] + (g["b"] - g["a"]) * frac - t0)
        line_off.append(offs)
    ends = starts[1:] + [dur]
    return list(zip(starts, ends)), line_off


def chunk_times(chunks, dur, times=None, lead=0.15):
    """조각마다 [시작, 끝]. 음성 문장 시각(times)이 있으면 그 문장 안에서 글자 수 비율로 나누고,
    없으면 장면 전체를 글자 수 비율로 나눈다. 조각은 다음 조각이 시작될 때까지 화면에 남는다."""
    n = [sum(len(w) for line in c["lines"] for w, _ in line) + 6 for c in chunks]
    starts = []
    if times:
        for si, (a, b) in enumerate(times):
            ids = [k for k, c in enumerate(chunks) if c["s"] == si]
            tot = sum(n[k] for k in ids) or 1
            t = lead + a
            for k in ids:
                starts.append((k, t))
                t += (b - a) * n[k] / tot
        starts = [t for _, t in sorted(starts)]
    else:
        span, t, tot = max(dur - lead - 0.1, 0.5), lead, sum(n)
        for k in range(len(chunks)):
            starts.append(t)
            t += span * n[k] / tot
    ends = starts[1:] + [dur]
    return list(zip(starts, ends))


def draw_vo(frame, chunks, lt, dur):
    """설명 자막을 문장 조각 단위로 한 조각씩 띄운다. 단어는 차례로 떠오르고 강조어는 골드로 튀어나온다."""
    for ci, c in enumerate(chunks):
        t0, t1 = c["_t"]
        cd = t1 - t0
        if t0 <= lt < t1 or (ci == len(chunks) - 1 and lt >= t0):
            ct = lt - t0
            items, bh = c["_layout"]
            # 띠 배경
            band_a = ease_out(ct / 0.15) * (1 - clamp((ct - (cd - 0.12)) / 0.12) if ci < len(chunks) - 1 else 1)
            if band_a > 0:
                band = Image.new("RGBA", (W, bh + 36), INK + (int(150 * band_a),))
                frame.alpha_composite(band, (0, VO_TOP - 18))
            out_a = 1 - clamp((ct - (cd - 0.12)) / 0.12) if ci < len(chunks) - 1 else 1
            nw = len(items)
            stagger = min(0.06, max(0.025, (cd * 0.45) / max(nw, 1)))
            loff = c.get("_lt")
            for im, x, y, e, k, li, kin in items:
                wt = (ct - loff[li] - kin * stagger) if loff else (ct - k * stagger)
                if wt <= 0:
                    continue
                if e:
                    a = ease_out(wt / 0.12)
                    s = 1.0 + 0.45 * (1 - ease_back(wt / 0.3)) if wt < 0.3 else 1.0
                    s = max(s, 0.6)
                    paste_center(frame, im, x + im.width / 2, VO_TOP + y + im.height / 2, s, a * out_a, kind="vo")
                else:
                    a = ease_out(wt / 0.14)
                    dy = (1 - a) * 18
                    paste_center(frame, im, x + im.width / 2, VO_TOP + y + im.height / 2 + dy, 1.0, a * out_a, kind="vo")
            return
        t0 += cd


def make_chip(txt, check=False, size=58):
    txt = txt.translate(CIRC).strip()
    pad = 40 + (70 if check else 0)
    f = fit_font(txt, F_HANJA if _HANJA.search(txt) else F_CAP, size, MAXW - pad - 40)  # 칩도 안전 폭 안에서
    size = f.size
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    tw, th, b = text_size(d, txt, f)
    w, h = tw + pad + 40, int(size * 1.75)
    im = rounded((w, h), h // 2, CREAM + (250,))
    dr = ImageDraw.Draw(im)
    x0 = 40
    if check:
        cx, cy, r = 40 + 26, h // 2, 26
        dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD + (255,))
        dr.line([(cx - 12, cy + 1), (cx - 3, cy + 11), (cx + 14, cy - 10)], fill=INK + (255,), width=7)
        x0 = 40 + 70
    dr.text((x0 - b[0], (h - th) // 2 - b[1]), txt, font=f, fill=INK + (255,))
    return im


def make_stamp(txt):
    f = fit_font(txt, serif_for(txt), 190, 620)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    tw, th, b = text_size(d, txt, f)
    w, h = tw + 120, th + 110
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    dr.rounded_rectangle([6, 6, w - 7, h - 7], 24, outline=STAMP + (240,), width=12)
    dr.rounded_rectangle([22, 22, w - 23, h - 23], 16, outline=STAMP + (200,), width=4)
    dr.text(((w - tw) // 2 - b[0], (h - th) // 2 - b[1]), txt, font=f, fill=STAMP + (245,))
    # 잉크 번짐 질감
    a = np.array(im.split()[-1]).astype(np.float32)
    noise = np.random.default_rng(len(txt)).random(a.shape)
    a[noise < 0.12] *= 0.35
    im.putalpha(Image.fromarray(a.astype(np.uint8)))
    return im


def make_big_text(txt, size=300, color=CREAM):
    f = serif_for(txt)(size)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    tw, th, b = text_size(d, txt, f)
    im = Image.new("RGBA", (tw + 40, th + 60), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    dr.text((20 - b[0] + 5, 30 - b[1] + 8), txt, font=f, fill=INK + (170,))
    dr.text((20 - b[0], 30 - b[1]), txt, font=f, fill=color + (255,))
    return im


def make_topic(txt):
    """로고 아래 작은 주제 표시 — 짙은 반투명 바탕에 크림 글자, 골드 점 하나."""
    f = fit_font(txt, F_CHIP, 38, MAXW - 80)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    tw, th, b = text_size(d, txt, f)
    h = 62
    im = rounded((tw + 74, h), h // 2, INK + (175,))
    dr = ImageDraw.Draw(im)
    dr.ellipse([20, h // 2 - 6, 32, h // 2 + 6], fill=GOLD + (255,))
    dr.text((44 - b[0], (h - th) // 2 - b[1]), txt, font=f, fill=CREAM + (255,))
    return im


def make_label(txt, size=46, maxw=MAXW):
    f = fit_font(txt, F_CHIP, size, maxw - 52)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    tw, th, b = text_size(d, txt, f)
    im = rounded((tw + 52, int(size * 1.7)), 14, GOLD + (255,))
    ImageDraw.Draw(im).text((26 - b[0], (im.height - th) // 2 - b[1]), txt, font=f, fill=INK + (255,))
    return im


# ------------------------------------------------------------ beat analysis
SPLIT_STRIP = ["좌우 분할", "2분할", "3분할", "나란히", "그림", "3컷", "좌: ", "우: ", "카드 3장: ", "카드 2장"]


def analyse(beat):
    t, scene, anim, cap, vo, sfx = beat
    blob = scene + " " + anim
    fx = {}
    m = re.findall(r"'([^']{1,12})'", scene)
    if "도장" in blob or "팻말" in blob:
        word = next((x for x in m if not x.isdigit()), None)
        if "O 팻말" in scene or re.search(r"에 O$", scene.strip()):
            word = "진짜 금기"
        elif "△" in scene:
            word = "나라마다 달라요"
        fx["stamp"] = word or "OK"
    if any(x in scene for x in ("八十八",)):
        fx["hanja"] = ("八十八", "米")
    elif "喜" in scene:
        fx["hanja"] = ("喜", "七十七")
    elif "古稀" in scene:
        fx["bigtxt"] = "古稀"
    nums = [x for x in m if re.fullmatch(r"\d{2,3}", x)]
    if nums and "hanja" not in fx:
        fx["bignum"] = nums
        fx["cross"] = "X" in anim
    if re.search(r"D\+1", blob):
        fx["dcount"] = True
    if (" vs " in scene.lower() or "분할" in scene or "나란히" in scene or " / " in scene) and "카드" not in scene and "체크리스트" not in scene:
        s = scene
        for k in SPLIT_STRIP:
            s = s.replace(k, "")
        parts = re.split(r"\s+vs\s+|\s+VS\s+|\s*/\s*", s)
        parts = [p.strip(" ,") for p in parts if p.strip(" ,")]
        if 2 <= len(parts) <= 3:
            fx["split"] = parts
            fx["vs"] = " vs " in scene.lower()
    # 칩 목록 (가운데 점 · 이 있는 자막)
    lines = cap.split("/")
    joined = cap.replace("/", " · ")
    if "·" in cap or "①" in cap:
        if "①" in cap:
            head = lines[0]
            items = [x.strip() for x in re.split(r"[①②③④]", lines[1]) if x.strip()]
        elif "·" in lines[0]:
            head = None
            items = [x.strip() for x in lines[0].split("·") if x.strip()]
            fx["chip_rest"] = lines[1:]
        else:
            head = lines[0]
            items = [x.strip() for x in lines[1].split("·") if x.strip()]
        if 2 <= len(items) <= 5 and all(len(i) <= 16 for i in items):
            fx["chips"] = items
            fx["chip_head"] = head
            fx["check"] = "체크" in blob or "체크" in sfx
    if "밝기" in anim or "켜짐" in scene:
        fx["light"] = True
    if "음악 정지" in anim:
        fx["music_stop"] = True
    if "타임랩스" in anim or "2배속" in anim:
        fx["fast"] = True
    return fx


def tsec(rng_txt):
    a, b = rng_txt.replace("–", "-").split("-")
    return float(a), float(b)


# ------------------------------------------------------------ 말하는 순간 찾기
def spoken_at(text, segs, words, lead=0.15, default=None):
    """내레이션에서 words(칩·숫자 글자)가 나오는 대략의 시각. 그 말이 든 토막(segs) 안에서 글자 위치 비율로 잡는다.
    순서대로 찾고(앞 항목 뒤에서), 못 찾은 항목은 앞뒤 항목 사이를 고르게 채운다."""
    if not text or not segs:
        return default
    base, offs = 0, []
    for g in segs:
        k = text.find(g["text"], base)
        offs.append(k)
        base = k + len(g["text"])

    def t_of(pos):
        for g, o in zip(segs, offs):
            if o <= pos < o + len(g["text"]):
                return lead + g["a"] + (g["b"] - g["a"]) * (pos - o) / max(len(g["text"]), 1)
        return None

    out, cur = [], 0
    for w in words:
        hit = None
        for tok in re.split(r"[\s·:=+,()]+", w.translate(CIRC)):
            tok = re.sub(r"[.?!'X]", "", tok)
            for cand in (tok, tok[:2]):
                if len(cand) >= 2 and text.find(cand, cur) >= 0:
                    hit = text.find(cand, cur)
                    break
            if hit is not None:
                break
        if hit is not None:
            cur = hit + 1
        out.append(t_of(hit) if hit is not None else None)
    # 못 찾은 칸 채우기
    end = lead + segs[-1]["b"]
    for j in range(len(out)):
        if out[j] is None:
            prev = next((out[k] for k in range(j - 1, -1, -1) if out[k] is not None), lead)
            nxt_k = next((k for k in range(j + 1, len(out)) if out[k] is not None), None)
            nxt = out[nxt_k] if nxt_k is not None else end
            gaps = (nxt_k if nxt_k is not None else len(out)) - j + 1
            out[j] = prev + (nxt - prev) / gaps
    # 순서가 뒤집히지 않게, 너무 붙지 않게
    for j in range(1, len(out)):
        out[j] = max(out[j], out[j - 1] + 0.25)
    return out


# ------------------------------------------------------------ 장면 배치 (겹침 없이 아래에서 위로 쌓기)
def _rot_h(im, deg):
    r = math.radians(abs(deg))
    return im.height * math.cos(r) + im.width * math.sin(r), im.width * math.cos(r) + im.height * math.sin(r)


def plan_layout(L, i, hook_bottom):
    """설명 자막(VO_TOP~) 위로 자막 박스 → 칩 목록 → 특수 연출 순서로 쌓는다.
    특수 연출(큰 숫자·한자·도장·라벨)은 남은 칸에 맞춰 줄이고 그 칸 가운데에 둔다."""
    fx, P = L["fx"], {}
    y = STACK_BOTTOM
    if L["cap"] is not None:
        P["cap_cy"] = y - L["cap"].height / 2
        y -= L["cap"].height + GAP_Y
    top = (hook_bottom + GAP_Y) if i == 0 else TOP_LIMIT
    if "chips" in L:
        chips = L["chips"]
        tot = sum(c.height for c in chips) + 26 * (len(chips) - 1)
        s = min(1.0, (y - top) / tot)
        P["chip_scale"] = s
        P["chip_y0"] = y - tot * s
        y -= tot * s + GAP_Y
    bottom = y
    # 특수 연출의 원래 크기
    hs, ws = [], []
    if "bignum" in L:
        k = 0.62 if len(L["bignum"]) > 1 else 1.0
        hs.append(max(im.height for im in L["bignum"]) * k)
        ws.append((480 + L["bignum"][0].width * k) if len(L["bignum"]) > 1 else L["bignum"][0].width)
        if fx.get("cross"):
            hs.append(2 * 230 + 26)
    if "bigtxt" in L:
        hs.append(L["bigtxt"].height); ws.append(L["bigtxt"].width)
    if "hanja" in L:
        parts, result = L["hanja"]
        n = len(parts)
        hs.append(max([im.height * (0.8 if n > 1 else 1) for im in parts] + [result.height]))
        ws.append(300 * (n - 1) + max(im.width for im in parts) * (0.8 if n > 1 else 1))
    if "stamp" in L:
        h_, w_ = _rot_h(L["stamp"], 12)
        hs.append(h_); ws.append(w_)
    if fx.get("dcount"):
        hs.append(96 * 1.7)
    lab_h = max((lab.height for lab in L.get("labels", [])), default=0)
    if lab_h:
        P["label_y"] = top + lab_h / 2
        top += lab_h + GAP_Y
    avail = max(bottom - top, 80)
    nat_h = max(hs, default=0)
    nat_w = max(ws, default=0)
    P["fx_scale"] = min(1.0, avail / nat_h if nat_h else 1.0, MAXW / nat_w if nat_w else 1.0)
    P["fx_cy"] = (top + bottom) / 2
    return P


def qa_check(rects):
    """한 프레임의 글자 블록들: 세이프존 밖으로 나가거나, 다른 종류끼리 겹치면 문제로 센다."""
    bad = []
    tol = 2
    for k, x0, y0, x1, y1 in rects:
        if x0 < SAFE_L - tol or x1 > SAFE_R + tol or y0 < SAFE_T - tol or y1 > SAFE_B + tol:
            bad.append(f"세이프존 이탈 {k} ({int(x0)},{int(y0)})-({int(x1)},{int(y1)})")
    # 같은 종류(설명 자막 단어끼리, 특수 연출끼리)는 한 덩어리라 겹쳐도 된다
    groups = {}
    for k, x0, y0, x1, y1 in rects:
        g = groups.setdefault(k, [x0, y0, x1, y1])
        g[0], g[1], g[2], g[3] = min(g[0], x0), min(g[1], y0), max(g[2], x1), max(g[3], y1)
    ks = list(groups)
    for a in range(len(ks)):
        for b in range(a + 1, len(ks)):
            A, B = groups[ks[a]], groups[ks[b]]
            if min(A[2], B[2]) - max(A[0], B[0]) > tol and min(A[3], B[3]) - max(A[1], B[1]) > tol:
                bad.append(f"겹침 {ks[a]}↔{ks[b]}")
    return bad


# ------------------------------------------------------------ render one video
def render_video(idx, v):
    slug = v["slug"]
    bhard = v["tone"] == "B급"
    imgs = load_images(slug)
    beats = v["beats"]
    # 장면 길이: 계획 길이, 음성이 있으면 음성+여유
    durs, vo_waves = [], []
    for i, bt in enumerate(beats):
        a, b = tsec(bt[0])
        d = b - a
        p = os.path.join(VO, slug, f"{i:02d}.wav")
        if os.path.exists(p):
            sr, w = wavfile.read(p)
            w = w.astype(np.float32) / (32768 if w.dtype == np.int16 else 1)
            if w.ndim > 1:
                w = w.mean(1)
            if sr != audio.SR:
                w = np.interp(np.linspace(0, len(w), int(len(w) * audio.SR / sr), endpoint=False), np.arange(len(w)), w)
            vo_waves.append(w)
            jp_ = os.path.join(VO, slug, f"{i:02d}.json")
            tail = json.load(open(jp_, encoding="utf-8")).get("tail", 1.02) if os.path.exists(jp_) else 1.02
            d = max(d * 0.6, len(w) / audio.SR + 0.15 + tail)  # 장면 끝 쉼은 낭독 대본의 마지막 표시대로
        else:
            vo_waves.append(None)
        durs.append(d)
    has_vo = any(w is not None for w in vo_waves)
    END = 3.0
    starts = np.cumsum([0] + durs)
    total = starts[-1] + END
    nframes = int(total * FPS)

    # 미리 만든 레이어
    hook_im, ul_x, ul_y, ul_w = make_hook(v["thumb"], bhard)
    layers = []
    for i, bt in enumerate(beats):
        fx = analyse(bt)
        L = {"fx": fx}
        caplines = bt[3].split("/")
        if "chips" in fx:
            L["chips"] = [make_chip(c, fx["check"], 56 if len(fx["chips"]) <= 3 else 50) for c in fx["chips"]]
            caplines = [fx["chip_head"]] if fx["chip_head"] else (fx.get("chip_rest") or None)
        L["cap"] = make_caption(caplines) if (caplines and i > 0) else None
        L["vo"] = None
        # 내레이션이 있어도 설명 자막은 띄운다 (무음 시청 전제, brand-rules §5-3) — 음성 문장 시각에 맞춘다
        if bt[4] and not bt[4].startswith("("):
            segs = None
            jp = os.path.join(VO, slug, f"{i:02d}.json")
            if vo_waves[i] is not None and os.path.exists(jp):
                segs = json.load(open(jp, encoding="utf-8")).get("segs")
            rd = (v.get("read") or [None] * len(beats))[i]
            chunks, _ = phrase_chunks(rd, bt[3]) if rd else vo_segments(bt[4], bt[3])
            if segs:
                tts_, loffs = seg_times(chunks, segs, durs[i])
            else:
                tts_, loffs = chunk_times(chunks, durs[i]), [None] * len(chunks)
            for c, tt, lo in zip(chunks, tts_, loffs):
                c["_layout"] = layout_chunk(c["lines"])
                c["_t"] = tt
                c["_lt"] = lo
            L["vo"] = chunks
            times = segs
            # 칩과 두 번째 큰 숫자는 내레이션에서 그 말이 나올 때 뜬다
            if "chips" in fx:
                L["chip_t"] = spoken_at(bt[4], times, fx["chips"])
            # 도장은 긴 뜸(///) 뒤 첫 마디에 찍는다 — 반전을 말하기 전에 답을 보여 주지 않게
            if "stamp" in fx and times and rd:
                import reading_script as RS
                mk = [m for _, m in RS.parse(rd)]
                k = next((j + 1 for j in range(len(mk) - 1) if mk[j] == "///"), None)
                if k is not None and k < len(times):
                    L["stamp_t"] = 0.15 + times[k]["a"]
            # 한자 합체는 '겹쳐 / 흘려'를 말할 때 시작한다
            if "hanja" in fx:
                cue = next((w for w in ("겹쳐", "흘려") if w in bt[4]), None)
                if cue:
                    L["hanja_t"] = spoken_at(bt[4], times, [cue])[0]
            if "bignum" in fx and len(fx["bignum"]) > 1:
                L["num2_t"] = (spoken_at(bt[4], times, [fx["bignum"][1]]) or [None])[0]
        if "stamp" in fx:
            L["stamp"] = make_stamp(fx["stamp"])
        if "hanja" in fx:
            L["hanja"] = [make_big_text(c, 330) for c in fx["hanja"][0]], make_big_text(fx["hanja"][1], 330 if len(fx["hanja"][1]) == 1 else 220, CREAM)
        if "bigtxt" in fx:
            L["bigtxt"] = make_big_text(fx["bigtxt"], 300)
        if "bignum" in fx:
            L["bignum"] = [make_big_text(n, 420) for n in fx["bignum"]]
        if "split" in fx:
            n = len(fx["split"])
            L["labels"] = [make_label(p[:12], 46, int((SAFE_R - SAFE_L) / n) - 24) for p in fx["split"]]
        spec = SHOTS.get(slug, [None] * len(beats))[i] if slug in SHOTS else None
        if spec:
            specs = spec if isinstance(spec, list) else [spec]
            L["shots"] = [load_shot(sp, slug) for sp in specs]
        else:  # 지정이 없으면 예전처럼 차례로
            L["shots"] = [(imgs[(i + k) % len(imgs)], 0.5) for k in range(3)]
        while len(L["shots"]) < 3:
            L["shots"].append(L["shots"][-1])
        L["img"], L["focus"] = L["shots"][0]
        # 카메라 움직임 — 장면마다 바꾼다 (밀기 · 오른쪽 이동 · 빠지기 · 왼쪽 이동)
        L["move"] = ["push", "panR", "pull", "panL"][i % 4]
        L["pos"] = plan_layout(L, i, HOOK_Y + hook_im.height)
        layers.append(L)
    wm = logo(CREAM, 46)
    topic_im = make_topic(v["topic"]) if v.get("topic") else None
    end_logo = logo(BROWN, 120)
    cta_f = F_HOOK(80)

    # ---------------- audio
    sr = audio.SR
    mix = np.zeros(int(sr * (total + 1)), np.float32)
    style = audio.style_for(v["bgm"])
    music = audio.bgm(style, total + 0.5, seed=idx + 11).astype(np.float32)
    gain = np.ones(len(music), np.float32) * (0.30 if has_vo else 0.42)
    # 첫 4초 무음 연출 (용돈케이크 ASMR)
    if "첫 4초 무음" in v["bgm"]:
        gain[: int(sr * 4)] = 0
        k = int(sr * 4)
        gain[k:k + sr] *= np.linspace(0, 1, sr)
    for i, L in enumerate(layers):
        s0 = starts[i]
        if L["fx"].get("music_stop"):  # 음악은 도장 직전 0.6초 동안 멈춘다 (뜸에 맞춰)
            st = L.get("stamp_t", 0.6) - 0.6
            a, b = int(sr * (s0 + st)), int(sr * (s0 + st + 0.6))
            gain[a:b] = 0
        if has_vo and vo_waves[i] is not None:  # 덕킹
            a = int(sr * (s0 + 0.15))
            b = a + len(vo_waves[i])
            gain[a:b] = np.minimum(gain[a:b], 0.16)
    gain = np.convolve(gain, np.ones(2205) / 2205, mode="same").astype(np.float32)  # 부드럽게
    mix[: len(music)] += music * gain[: len(music)]
    stamp_hits = []
    for i, bt in enumerate(beats):
        s0 = starts[i]
        fx = layers[i]["fx"]
        sfx_list = audio.sfx_for(bt[5])
        for off, w in sfx_list:
            t0 = s0 + 0.12 + off
            if "stamp" in fx and w is not None and off == 0:  # 도장·팻말 장면은 첫 효과음을 찍히는 순간에
                t0 = s0 + layers[i].get("stamp_t", 0.42)  # 도장 찍히는 순간에 맞춤
                stamp_hits.append(t0)
            k = int(sr * t0)
            mix[k:k + len(w)] += w[: max(0, len(mix) - k)] * 0.55
        if i > 0:  # 장면 전환 휙
            w = audio.sfx_whoosh(0.3) if bhard else audio.sfx_whoosh(0.5) * 0.5
            k = max(0, int(sr * (s0 - 0.15)))
            mix[k:k + len(w)] += w * (0.45 if bhard else 0.25)
        if "chips" in fx:
            ct = layers[i].get("chip_t") or [0.35 + j * 0.38 for j in range(len(fx["chips"]))]
            for j in range(len(fx["chips"])):
                w = audio.sfx_pop() if not fx["check"] else audio.sfx_click()
                k = int(sr * (s0 + ct[j] - 0.1))
                mix[k:k + len(w)] += w * 0.5
        if layers[i]["cap"] is not None:
            w = audio.sfx_pop()
            k = int(sr * (s0 + layers[i].get("stamp_t", 0.05)))
            mix[k:k + len(w)] += w * 0.25
        if vo_waves[i] is not None:
            k = int(sr * (s0 + 0.15))
            w = vo_waves[i]
            mix[k:k + len(w)] += w.astype(np.float32) * 0.95
    # 엔드카드 차임
    w = audio.sfx_ding()
    k = int(sr * (starts[-1] + 0.2))
    mix[k:k + len(w)] += w * 0.35
    mix = mix[: int(sr * total)]
    peak = np.max(np.abs(mix)) or 1
    mix = np.tanh(mix / peak * 1.3) * 0.89
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(OUT, f"_{slug}.wav")
    wavfile.write(wav, sr, (mix * 32767).astype(np.int16))

    # ---------------- video
    out = os.path.join(OUT, f"{idx + 1:02d}-{slug}.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    shake_rng = np.random.default_rng(idx)
    qa_log, qa_n = {}, [0]
    qa_reset()

    def bg_frame(img, lt, dur, i, zoom_punch=0.0, speed=1.0, focus=0.5, move=None):
        """켄번스 — 장면마다 밀기/빠지기/좌우 이동을 바꾸고, 사진 안 초점(focus)을 중심으로 움직인다."""
        p = ease_out(lt / max(dur, 0.1)) * 0.7 + lt / max(dur, 0.1) * 0.3
        p = clamp(p * speed)
        move = move or ["push", "panR", "pull", "panL"][i % 4]
        if move == "push":
            z, dx = 1.02 + 0.12 * p, 0.0
        elif move == "pull":
            z, dx = 1.14 - 0.12 * p, 0.0
        else:
            z = 1.08 + 0.03 * p
            dx = (p - 0.5) * (0.22 if move == "panR" else -0.22)
        z += zoom_punch
        cw, ch = min(int(W / z), img.width), min(int(H / z), img.height)
        cx = img.width * focus + dx * cw
        x = int(clamp(cx - cw / 2, 0, img.width - cw))
        y = int((img.height - ch) * 0.5)
        fr = img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.BILINEAR)
        dep = getattr(img, "depth", None)
        if dep is None or not MOTION:
            return fr
        d = cv2.resize(dep[y:y + ch, x:x + cw], (W, H), interpolation=cv2.INTER_LINEAR)
        return Image.fromarray(motion.animate(np.asarray(fr), d, lt, seed=idx * 31 + i))

    def beat_pulse(L, lt):
        """새 자막 화면이 뜰 때(말의 마디)마다 화면이 살짝 다가간다."""
        z = 0.0
        for c in (L.get("vo") or [])[1:]:
            u = (lt - c["_t"][0]) / 0.45
            if 0 <= u < 1:
                z += 0.022 * math.sin(math.pi * u)
        return z

    for fi in range(nframes):
        t = fi / FPS
        if t >= starts[-1]:
            # ---------- 엔드카드
            lt = t - starts[-1]
            frame = Image.new("RGBA", (W, H), CREAM + (255,))
            # 직전 장면에서 디졸브
            if lt < 0.3:
                L = layers[-1]
                prev = bg_frame(L["img"], durs[-1], durs[-1], len(layers) - 1, focus=L["focus"], move=L["move"]).convert("RGBA")
                frame = Image.blend(prev, frame, ease_out(lt / 0.3))
            paste_center(frame, end_logo, CX, 760, 0.9 + 0.1 * ease_back(lt / 0.5), ease_out((lt - 0.1) / 0.4))
            dr = ImageDraw.Draw(frame)
            for j, line in enumerate(v["end"]):
                a = ease_out((lt - 0.35 - j * 0.12) / 0.3)
                if a <= 0:
                    continue
                tw, th, b = text_size(dr, line, cta_f)
                lay = Image.new("RGBA", (tw + 20, th + 40), (0, 0, 0, 0))
                ImageDraw.Draw(lay).text((10 - b[0], 10 - b[1]), line, font=cta_f, fill=BROWN + (int(255 * a),))
                frame.alpha_composite(lay, (int(CX - tw / 2), int(980 + j * 120 + (1 - a) * 30)))
            # 골드 밑줄
            uw = int(380 * ease_out((lt - 0.8) / 0.4))
            if uw > 0:
                dr.rectangle([int(CX) - uw // 2, 1250, int(CX) + uw // 2, 1256], fill=GOLD)
            proc.stdin.write(frame.convert("RGB").tobytes())
            continue

        i = int(np.searchsorted(starts, t, side="right") - 1)
        i = min(i, len(beats) - 1)
        L, fx = layers[i], layers[i]["fx"]
        lt = t - starts[i]
        dur = durs[i]
        punch = 0.0
        if i == 0 and bhard:
            punch = 0.18 * (1 - ease_out(lt / 0.45))
        if "stamp" in fx:
            hit = L.get("stamp_t", 0.42)
            if hit <= lt < hit + 0.25:
                punch += 0.03 * (1 - (lt - hit) / 0.25)
        # ---------- 배경
        if "split" in fx:
            n = len(fx["split"])
            frame = Image.new("RGBA", (W, H), INK + (255,))
            pw = W // n
            for j in range(n):
                a = ease_out((lt - j * 0.18) / 0.35)
                im_, fc_ = L["shots"][j]
                src = bg_frame(im_, lt, dur, i + j, beat_pulse(L, lt), focus=fc_, move="push" if j % 2 == 0 else "pull")
                panel = src.crop(((W - pw) // 2, 0, (W - pw) // 2 + pw, H))
                if fx.get("dcount") and j == 0:  # 왼쪽(생화)만 점점 시들게
                    k = clamp((lt - 0.6) / max(dur - 1.2, 0.5))
                    panel = ImageEnhance.Color(panel).enhance(1 - 0.75 * k)
                    panel = ImageEnhance.Brightness(panel).enhance(1 - 0.35 * k)
                off = int((1 - a) * (-pw if j == 0 else pw))
                frame.paste(panel, (j * pw + off, 0))
            dr = ImageDraw.Draw(frame)
            for j in range(1, n):
                dr.rectangle([j * pw - 3, 0, j * pw + 3, H], fill=CREAM)
        else:
            frame = bg_frame(L["img"], lt, dur, i, punch + beat_pulse(L, lt), 1.8 if fx.get("fast") else 1.0,
                             focus=L["focus"], move=L["move"]).convert("RGBA")
            if fx.get("light"):
                k = ease_out((lt - 0.2) / 0.6)
                frame = ImageEnhance.Brightness(frame).enhance(0.3 + 0.7 * k)
        # 장면 전환
        PL = layers[i - 1] if i > 0 else None
        if i > 0 and lt < (0.22 if bhard else 0.35):
            prev = bg_frame(PL["img"], durs[i - 1], durs[i - 1], i - 1, focus=PL["focus"], move=PL["move"]).convert("RGBA")
            if bhard:  # 새 장면이 오른쪽에서 밀고 들어온다 + 짧은 플래시
                k = ease_out(lt / 0.22)
                off = int((1 - k) * W)
                canvas = Image.new("RGBA", (W, H), INK + (255,))
                canvas.paste(prev, (off - W, 0))
                canvas.paste(frame, (off, 0))
                frame = canvas
                if lt < 0.1:
                    frame = Image.blend(frame, Image.new("RGBA", (W, H), (255, 255, 255, 255)), 0.35 * (1 - lt / 0.1))
            else:  # 앞 장면이 살짝 커지며 사라지고 새 장면이 드러난다
                k = ease_out(lt / 0.35)
                zp = prev.resize((int(W * (1 + 0.06 * k)), int(H * (1 + 0.06 * k))), Image.BILINEAR)
                zp = zp.crop(((zp.width - W) // 2, (zp.height - H) // 2, (zp.width - W) // 2 + W, (zp.height - H) // 2 + H))
                frame = Image.blend(zp, frame, k)
        frame.alpha_composite(SCRIM_TOP, (0, 0))
        frame.alpha_composite(SCRIM_BOT, (0, H - SCRIM_BOT.height))
        frame.alpha_composite(wm, (60, 240))
        if topic_im is not None:  # 주제 표시 — 처음 0.3초에 스며들고 끝까지 남는다
            paste_center(frame, topic_im, SAFE_L + topic_im.width / 2, TOPIC_Y + topic_im.height / 2, 1.0,
                         ease_out(t / 0.3) if i == 0 else 1.0, kind="topic")

        # ---------- 0번 장면: 훅
        P = L["pos"]
        BY = P["fx_cy"]        # 특수 연출 중심 높이 — 장면마다 남은 칸 가운데
        FS = P["fx_scale"]     # 특수 연출 크기 — 칸에 맞게 줄인 값
        if i == 0:
            if bhard:
                s = 1.35 - 0.35 * ease_back(lt / 0.4)
                a = ease_out(lt / 0.15)
            else:
                s = 1.0
                a = ease_out(lt / 0.4)
            hy = HOOK_Y + (0 if bhard else int((1 - a) * 24))
            # 훅 이미지는 화면 폭(W)짜리이고 글자는 그 안에서 CX에 맞춰져 있다 → 확대 중심도 CX
            paste_center(frame, hook_im, CX + (W / 2 - CX) * s, hy + hook_im.height / 2, s, a, kind="hook")
            uw = int(ul_w * ease_out((lt - 0.45) / 0.3))
            if uw > 0:
                ImageDraw.Draw(frame).rectangle([ul_x, hy + ul_y, ul_x + uw, hy + ul_y + 10], fill=GOLD)

        # ---------- 특수 연출
        if "split" in fx:
            n = len(fx["split"])
            span = (SAFE_R - SAFE_L) / n
            for j, lab in enumerate(L["labels"]):
                a = ease_back((lt - 0.3 - j * 0.15) / 0.3)
                paste_center(frame, lab, SAFE_L + span * (j + 0.5), P["label_y"], clamp(a, 0, 1.3), clamp(a), kind="label")
            if fx.get("vs"):
                vs = make_label("VS", 60)
                a = ease_back((lt - 0.6) / 0.3)
                paste_center(frame, vs, CX, BY, a * 1.2 * FS, clamp(a), kind="fx")
        if fx.get("dcount"):
            k = clamp((lt - 0.5) / max(dur - 1.2, 0.5))
            day = 1 + int(round(k * 6))
            paste_center(frame, make_label(f"D+{day}", 96), CX, BY, FS, ease_out(lt / 0.3), kind="fx")
        if "hanja" in L:
            parts, result = L["hanja"]
            n = len(parts)
            h0 = L.get("hanja_t", 0.5)
            merge = clamp((lt - h0) / 0.9)
            cy = BY
            if lt < h0 + 1.0:
                for j, im in enumerate(parts):
                    x0 = CX + (j - (n - 1) / 2) * 300 * FS
                    x = x0 + (CX - x0) * ease_in(merge)
                    a = ease_out((lt - j * 0.12) / 0.25) * (1 - clamp((lt - (h0 + 0.75)) / 0.25))
                    paste_center(frame, im, x, cy, (0.8 if n > 1 else 1.0) * FS, a, kind="fx")
            if lt >= h0 + 0.8:
                a = ease_out((lt - (h0 + 0.8)) / 0.2)
                s = ease_back((lt - (h0 + 0.8)) / 0.35)
                paste_center(frame, result, CX, cy, s * FS, a, kind="fx")
        if "bigtxt" in L:
            a = ease_out((lt - 0.1) / 0.6)
            paste_center(frame, L["bigtxt"], CX, BY, (0.9 + 0.1 * a) * FS, a, kind="fx")
        if "bignum" in L:
            nums = L["bignum"]
            im = nums[0]
            a = ease_back(lt / 0.35)
            cx0 = CX
            if len(nums) > 1:
                n2 = L.get("num2_t") or 0.8   # 두 번째 숫자는 그 숫자를 말할 때
                cx0 = CX - 240 * FS * ease_out((lt - (n2 - 0.3)) / 0.4)
                a2 = ease_back((lt - n2) / 0.35)
                if a2 > 0:
                    paste_center(frame, nums[1], CX + 250 * FS, BY, clamp(a2, 0, 1.2) * 0.62 * FS, clamp(a2), angle=-6, kind="fx")
            paste_center(frame, im, cx0, BY, clamp(a, 0, 1.2) * (0.62 if len(nums) > 1 else 1) * FS, clamp(a), kind="fx")
            if fx.get("cross"):
                k = ease_out((lt - 0.5) / 0.4)
                if k > 0:
                    dr = ImageDraw.Draw(frame)
                    cx, cy, r = CX, BY, 230 * FS
                    wl = max(10, int(26 * FS))
                    dr.line([(cx - r, cy - r), (cx - r + 2 * r * k, cy - r + 2 * r * k)], fill=STAMP, width=wl)
                    k2 = ease_out((lt - 0.8) / 0.4)
                    if k2 > 0:
                        dr.line([(cx + r, cy - r), (cx + r - 2 * r * k2, cy - r + 2 * r * k2)], fill=STAMP, width=wl)
        if "chips" in L:
            chips = L["chips"]
            cs = P["chip_scale"]
            y = P["chip_y0"]
            ct = L.get("chip_t") or [0.35 + j * 0.38 for j in range(len(chips))]
            for j, c in enumerate(chips):
                a = ease_back((lt - (ct[j] - 0.1)) / 0.32)
                paste_center(frame, c, CX - (1 - clamp(a)) * 110, y + c.height * cs / 2, (clamp(a, 0, 1.25) if a > 0 else 0) * cs, clamp(a * 2), kind="chips")
                y += (c.height + 26) * cs
        if "stamp" in L:
            hit = L.get("stamp_t", 0.42)
            if lt >= hit - 0.18:
                k = clamp((lt - (hit - 0.18)) / 0.18)
                s = 2.6 - 1.6 * ease_in(k)
                paste_center(frame, L["stamp"], CX, BY, s * FS, clamp(k * 1.5), angle=-12, kind="fx")

        # ---------- 자막
        if L["cap"] is not None:
            a = ease_back((lt - L.get("stamp_t", 0.0)) / 0.28) if lt >= L.get("stamp_t", 0.0) else 0  # 반전 장면은 답과 함께
            cy = P["cap_cy"]
            if lt > dur - 0.12:
                a = clamp((dur - lt) / 0.12)
            paste_center(frame, L["cap"], CX, cy + (1 - clamp(a)) * 46, 0.85 + 0.15 * clamp(a, 0, 1.15) if a > 0 else 0, clamp(a * 1.5), kind="cap")
        if L["vo"]:
            draw_vo(frame, L["vo"], lt, dur)
        if QA:
            qa_n[0] += len(_RECTS)
            for msg in qa_check(_RECTS):
                qa_log.setdefault(msg, []).append(round(t, 2))
            qa_reset()

        # ---------- 흔들기 (도장)
        if "stamp" in fx:
            hit = L.get("stamp_t", 0.42)
            if hit <= lt < hit + 0.22:
                amp = 16 * (1 - (lt - hit) / 0.22)
                dx, dy = shake_rng.integers(-1, 2, 2) * amp
                frame = frame.transform(frame.size, Image.AFFINE, (1, 0, dx, 0, 1, dy), fillcolor=INK + (255,))
        # 진행바 (아래쪽 얇게)
        dr = ImageDraw.Draw(frame)
        pw_ = int(W * t / starts[-1])
        dr.rectangle([0, H - 8, pw_, H], fill=GOLD)
        proc.stdin.write(frame.convert("RGB").tobytes())
    proc.stdin.close()
    proc.wait()
    os.remove(wav)
    if QA:
        json.dump({"_검사한_글자블록": qa_n[0], **{m: [ts[0], ts[-1], len(ts)] for m, ts in qa_log.items()}}, open(out[:-4] + "-qa.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return out, round(total, 1), has_vo, len(qa_log)


def _fade(im, a):
    im = im.copy()
    im.putalpha(im.split()[-1].point(lambda p: int(p * a)))
    return im


# ------------------------------------------------------------ thumbnail
def render_thumb(idx, v):
    img = load_images(v["slug"])[0]
    x = (img.width - W) // 2
    y = (img.height - H) // 2
    fr = img.crop((x, y, x + W, y + H)).convert("RGBA")
    fr.alpha_composite(gradient(int(H * 0.55), 230, 0), (0, 0))
    hook_im, ul_x, ul_y, ul_w = make_hook(v["thumb"], True)
    big = hook_im.resize((int(hook_im.width * 1.25), int(hook_im.height * 1.25)), Image.LANCZOS)
    fr.alpha_composite(big, ((W - big.width) // 2, 300))
    dr = ImageDraw.Draw(fr)
    ux = (W - big.width) // 2 + int(ul_x * 1.25)
    uy = 300 + int(ul_y * 1.25)
    dr.rectangle([ux, uy, ux + int(ul_w * 1.25), uy + 12], fill=GOLD)
    chip = make_label(v["chip"], 48)
    fr.alpha_composite(chip, ((W - chip.width) // 2, uy + 60))
    fr.alpha_composite(logo(CREAM, 46), (60, 240))
    p = os.path.join(OUT, f"{idx + 1:02d}-{v['slug']}-thumb.jpg")
    fr.convert("RGB").save(p, quality=92)
    return p


def job(args):
    idx, v = args
    th = render_thumb(idx, v)
    out, total, has_vo, nqa = render_video(idx, v)
    return v["slug"], out, total, has_vo, th, f"검수 문제 {nqa}종"


if __name__ == "__main__":
    want = set(sys.argv[1:])
    jobs = [(i, v) for i, v in enumerate(VIDEOS) if not want or v["slug"] in want]
    os.makedirs(OUT, exist_ok=True)
    with Pool(min(int(os.environ.get("TECHA_JOBS", "2")), len(jobs))) as p:  # 사진 움직임을 켜면 램 14GB에서 2편이 한계
        for r in p.imap_unordered(job, jobs):
            print(json.dumps(r, ensure_ascii=False), flush=True)
