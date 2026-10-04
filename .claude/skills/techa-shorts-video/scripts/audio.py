"""효과음·BGM 합성. 외부 음원을 쓰지 않고 전부 코드로 만든다 → 저작권·상업 이용 걱정 없음."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)


def _t(d):
    return np.arange(int(SR * d)) / SR


def _bp(x, lo, hi, order=4):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def _lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def _hp(x, f, order=4):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def _env(n, a=0.002, d=0.1, curve=6.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.clip(t - a, 0, None) / max(d, 1e-4))
    return att * dec


def _norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# ---------------------------------------------------------------- 효과음
def sfx_thud():  # 도장 쾅
    n = int(SR * 0.45)
    t = _t(0.45)
    body = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * _env(n, 0.001, 0.25, 5)
    slap = _lp(rng.standard_normal(n), 2500) * _env(n, 0.0005, 0.04, 8)
    return _norm(body * 1.0 + slap * 0.8)


def sfx_click():  # 볼펜 딸깍·스위치
    n = int(SR * 0.08)
    x = _hp(rng.standard_normal(n), 2000) * _env(n, 0.0003, 0.012, 9)
    x2 = np.zeros(n)
    k = int(SR * 0.03)
    x2[k:] = x[: n - k] * 0.6
    return _norm(x + x2, 0.7)


def sfx_paper(d=0.35):  # 종이 넘기기·포장지 바스락
    n = int(SR * d)
    x = _bp(rng.standard_normal(n), 1200, 7000)
    wob = 0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 9, n) + rng.random(n) * 0.6))
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return _norm(x * wob * e, 0.55)


def sfx_scratch(d=0.45):  # 펜 긋기
    n = int(SR * d)
    x = _bp(rng.standard_normal(n), 2500, 8000)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * _t(d))
    e = np.sin(np.linspace(0, np.pi, n)) ** 0.7
    return _norm(x * am * e, 0.4)


def sfx_ding():  # 유리잔 팅
    t = _t(1.2)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dcy)
            for f, a, dcy in [(2093, 1, 3), (5230, .5, 6), (3510, .3, 5), (7040, .15, 9)])
    return _norm(x, 0.5)


def sfx_shutter():
    a = sfx_click()
    out = np.zeros(int(SR * 0.2))
    out[: len(a)] += a
    k = int(SR * 0.09)
    out[k:k + len(a)] += a * 0.8
    return _norm(out, 0.7)


def sfx_bills(d=1.0):  # 지폐 차르륵
    out = np.zeros(int(SR * d))
    p = sfx_paper(0.06)
    for i in range(int(d * 14)):
        k = int(i * SR / 14 + rng.integers(0, 500))
        if k + len(p) < len(out):
            out[k:k + len(p)] += p * (0.6 + 0.4 * rng.random())
    return _norm(out, 0.6)


def sfx_drop():  # 물방울 똑
    t = _t(0.25)
    f = 1800 * np.exp(-t * 18) + 500
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), 0.001, 0.08, 6), 0.6)


def sfx_wind(d=1.4):
    n = int(SR * d)
    x = _lp(rng.standard_normal(n), 900)
    return _norm(x * np.sin(np.linspace(0, np.pi, n)) ** 2, 0.35)


def sfx_whoosh(d=0.35):
    n = int(SR * d)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for i, f in enumerate(np.linspace(400, 4000, 8)):
        seg = slice(i * n // 8, (i + 1) * n // 8)
        out[seg] = _bp(x, f * 0.7, min(f * 1.4, 18000))[seg]
    return _norm(out * np.sin(np.linspace(0, np.pi, n)) ** 2, 0.45)


def sfx_pop():  # 자막 톡
    t = _t(0.09)
    f = 900 * np.exp(-t * 25) + 300
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), 0.001, 0.04, 5), 0.35)


def sfx_piano_low():
    t = _t(2.0)
    f = 55
    x = sum(np.sin(2 * np.pi * f * h * t) / h ** 1.2 * np.exp(-t * (1.2 + h * 0.4)) for h in range(1, 7))
    return _norm(x, 0.7)


def sfx_snip():  # 가위
    a = _hp(rng.standard_normal(int(SR * 0.05)), 3000) * _env(int(SR * 0.05), 0.0003, 0.01, 8)
    t = _t(0.05)
    a += np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 80) * 0.5
    out = np.zeros(int(SR * 0.18))
    out[: len(a)] += a
    out[int(SR * .1):int(SR * .1) + len(a)] += a * .8
    return _norm(out, 0.6)


def sfx_dial():
    out = []
    for lo, hi in [(697, 1209), (770, 1336), (852, 1477), (941, 1336)]:
        t = _t(0.09)
        out.append((np.sin(2 * np.pi * lo * t) + np.sin(2 * np.pi * hi * t)) * 0.4)
        out.append(np.zeros(int(SR * 0.05)))
    return _norm(np.concatenate(out), 0.4)


def sfx_knock():
    t = _t(0.25)
    x = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) + _lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 60) * 0.5
    return _norm(x, 0.7)


def sfx_clink():  # 그릇
    t = _t(0.6)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(1320, 7), (2710, 10), (4100, 14)])
    return _norm(x, 0.4)


def sfx_blow():
    n = int(SR * 0.6)
    x = _bp(rng.standard_normal(n), 300, 3000) * np.sin(np.linspace(0, np.pi, n)) ** 2
    return _norm(x, 0.4)


def sfx_calc():
    out = np.zeros(int(SR * 0.6))
    c = sfx_click()
    for i in range(4):
        k = int(SR * (0.02 + i * 0.13))
        out[k:k + len(c)] += c * 0.7
    return _norm(out, 0.6)


def sfx_ambient(d=2.0):  # 사무실 소음
    n = int(SR * d)
    x = _lp(rng.standard_normal(n), 400) * 0.6 + np.sin(2 * np.pi * 60 * _t(d)) * 0.05
    return _norm(x * np.minimum(1, np.linspace(0, 6, n)) * np.minimum(1, np.linspace(6, 0, n)), 0.25)


SFX_RULES = [  # (키워드, 함수) — 위에서부터 먼저 맞는 것
    (("셔터", "찰칵"), sfx_shutter),
    (("계산기",), sfx_calc),
    (("도장", "쾅"), sfx_thud),
    (("유리잔", "팅"), sfx_ding),
    (("지폐", "차르륵"), sfx_bills),
    (("물방울", "똑"), sfx_drop),
    (("바람",), sfx_wind),
    (("피아노 저음",), sfx_piano_low),
    (("가위",), sfx_snip),
    (("다이얼", "전화"), sfx_dial),
    (("못에", "팻말", "놓는 소리"), sfx_knock),
    (("그릇",), sfx_clink),
    (("'후'", "초 끄는"), sfx_blow),
    (("에어컨", "소음"), sfx_ambient),
    (("펜", "긋", "연필", "붓"), sfx_scratch),
    (("딸깍", "스위치", "체크", "버튼"), sfx_click),
    (("종이", "넘기", "카드", "편지", "서류", "파일", "포장지", "바스락", "비닐", "상자", "봉투", "리본", "옷걸이", "줄기", "끈", "돋보기", "지도", "서랍", "자동차", "달력"), sfx_paper),
]


def sfx_for(text):
    """효과음 칸 문장 → [(offset_sec, wave), ...]. '3번' 같은 횟수는 반복."""
    if not text or text.strip() in ("—", "-"):
        return []
    out = []
    parts = [p.strip() for p in text.replace("→", "+").split("+")]
    off = 0.0
    for p in parts:
        fn = None
        for keys, f in SFX_RULES:
            if any(k in p for k in keys):
                fn = f
                break
        if fn is None:
            continue
        times = 1
        for n in (2, 3, 4):
            if f"{n}번" in p:
                times = n
        w = fn()
        for i in range(times):
            out.append((off + i * 0.32, w))
        off += 0.35 * times
    return out


# ---------------------------------------------------------------- BGM
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def ks_pluck(f, d, bright=0.5):  # 카플러스-스트롱 현 뜯기
    n = int(SR * d)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = _lp(buf, 1000 + 8000 * bright, 2) if p > 20 else buf
    out = np.zeros(n)
    decay = 0.996
    for i in range(n):
        out[i] = buf[i % p]
        j = i % p
        buf[j] = decay * 0.5 * (buf[j] + buf[(j + 1) % p])
    return out


def tone(f, d, kind):
    t = _t(d)
    if kind == "marimba":
        x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 18)
        return x * np.exp(-t * 6)
    if kind == "bell":
        x = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)
        return x * np.exp(-t * 2.2)
    if kind == "piano":
        x = sum(np.sin(2 * np.pi * f * h * t) / h ** 1.5 * np.exp(-t * (1.5 + h * 0.6)) for h in range(1, 6))
        return x * (1 - np.exp(-t * 300))
    if kind == "bass":
        x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
        return x * np.exp(-t * 2.5) * (1 - np.exp(-t * 200))
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * f * m * t + rng.random() * 6) for m in (1, 1.003, 0.997, 2.001))
        a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
        return x * a * 0.25
    raise ValueError(kind)


STYLES = {
    # 이름: (bpm, 키, 단조?, 리드 악기, 리듬 패턴, 브러시)
    "quiz": dict(bpm=100, key="F", minor=False, lead="pluck", arp=[0, 2, 1, 2], swing=0, brush=False),
    "noir": dict(bpm=90, key="D", minor=True, lead="walk", arp=None, swing=0.12, brush=True),
    "marimba": dict(bpm=98, key="G", minor=False, lead="marimba", arp=[0, 1, 2, 1, 3, 1, 2, 1], swing=0, brush=False),
    "jazz": dict(bpm=100, key="Bb", minor=False, lead="piano_comp", arp=None, swing=0.18, brush=True),
    "guitar": dict(bpm=88, key="C", minor=False, lead="pluck", arp=[0, 1, 2, 3, 2, 1, 2, 1], swing=0, brush=False),
    "piano": dict(bpm=76, key="Eb", minor=False, lead="piano", arp=[0, 1, 2, 3, 2, 1, 2, 1], swing=0, brush=False),
    "bells": dict(bpm=90, key="A", minor=False, lead="bell", arp=[0, 2, 1, 3, 2, 1, 2, 0], swing=0, brush=False),
}


def style_for(text):
    t = text
    if "콘트라베이스" in t or "느와르" in t:
        return "noir"
    if "재즈" in t:
        return "jazz"
    if "오르골" in t or "글로켄" in t:
        return "bells"
    if "피치카토" in t or "우쿨렐레" in t:
        return "quiz"
    if "마림바" in t:
        return "marimba"
    if "기타" in t:
        return "guitar"
    return "piano"


def bgm(style, dur, seed=1):
    global rng
    rng = np.random.default_rng(seed)
    S = STYLES[style]
    bpm = S["bpm"]
    beat = 60 / bpm
    root = 48 + NOTE[S["key"].replace("b", "")] - (1 if "b" in S["key"] else 0)
    if S["minor"]:
        prog = [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 8], [7, 10, 14, 17]]  # i iv bVII v
    else:
        prog = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]]  # I vi IV V
    n = int(SR * (dur + 3))
    L = np.zeros(n)
    bar = beat * 4
    bars = int(dur / bar) + 2
    for b in range(bars):
        ch = prog[b % 4]
        t0 = b * bar
        # 베이스
        if S["lead"] == "walk":
            for i in range(4):
                nn = root - 12 + ch[[0, 1, 2, 1][i]] + (0 if i < 3 else -1)
                w = ks_pluck(midi(nn), beat * 1.1, 0.2) * 0.9
                k = int(SR * (t0 + i * beat + (S["swing"] * beat if i % 2 else 0)))
                L[k:k + len(w)] += w[: max(0, n - k)]
        else:
            w = tone(midi(root - 12 + ch[0]), bar * 0.95, "bass") * 0.55
            k = int(SR * t0)
            L[k:k + len(w)] += w[: max(0, n - k)]
            w = tone(midi(root - 12 + ch[2]), beat * 1.5, "bass") * 0.35
            k = int(SR * (t0 + beat * 2))
            L[k:k + len(w)] += w[: max(0, n - k)]
        # 화성·아르페지오
        lead = S["lead"]
        if lead in ("pluck", "marimba", "piano", "bell"):
            pat = S["arp"]
            steps = len(pat)
            step = bar / steps
            for i, idx in enumerate(pat):
                nn = root + 12 + ch[idx % 4] + (12 if lead == "bell" else 0)
                if lead == "pluck":
                    w = ks_pluck(midi(nn), step * 2.5, 0.6) * 0.45
                else:
                    w = tone(midi(nn), step * 3, lead) * (0.32 if lead != "bell" else 0.22)
                k = int(SR * (t0 + i * step))
                L[k:k + len(w)] += w[: max(0, n - k)]
            if lead == "piano":
                w = tone(midi(root + ch[1]), bar, "pad") * 0.5
                k = int(SR * t0)
                L[k:k + len(w)] += w[: max(0, n - k)]
        if lead in ("walk", "piano_comp"):
            # 2·4박 코드 컴핑
            for i in (1, 3) if lead == "piano_comp" else (0,):
                for iv in ch[1:]:
                    w = tone(midi(root + 12 + iv), beat * (0.6 if lead == "piano_comp" else 3.5), "piano") * 0.16
                    k = int(SR * (t0 + i * beat + S["swing"] * beat))
                    L[k:k + len(w)] += w[: max(0, n - k)]
        # 간단한 멜로디 (2마디에 한 번, 펜타토닉)
        if b % 2 == 1 and lead != "walk":
            scale = [0, 2, 4, 7, 9] if not S["minor"] else [0, 3, 5, 7, 10]
            for i in range(3):
                nn = root + 24 + scale[int(rng.integers(0, 5))]
                kind = {"pluck": "bell", "marimba": "marimba", "piano": "piano", "bell": "bell", "piano_comp": "piano"}[lead]
                w = tone(midi(nn), beat * 2, kind) * 0.18
                k = int(SR * (t0 + beat * (i * 1.3 + 0.5)))
                L[k:k + len(w)] += w[: max(0, n - k)]
        # 브러시·셰이커
        if S["brush"]:
            for i in range(8):
                hit = _bp(rng.standard_normal(int(SR * 0.08)), 3000, 9000) * _env(int(SR * .08), .002, .05, 5)
                k = int(SR * (t0 + i * beat / 2 + (S["swing"] * beat if i % 2 else 0)))
                L[k:k + len(hit)] += hit[: max(0, n - k)] * (0.12 if i % 2 else 0.2)
        elif style in ("quiz", "marimba"):
            for i in range(8):
                hit = _hp(rng.standard_normal(int(SR * 0.04)), 6000) * _env(int(SR * .04), .001, .02, 6)
                k = int(SR * (t0 + i * beat / 2))
                L[k:k + len(hit)] += hit[: max(0, n - k)] * 0.08
    L = L[: int(SR * dur)]
    # 끝 2초 페이드아웃
    fo = int(SR * 2)
    L[-fo:] *= np.linspace(1, 0, fo)
    return _norm(L, 0.8)
