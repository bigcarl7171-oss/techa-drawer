"""구글 TTS(Chirp3 HD Aoede)로 장면별 내레이션을 문장 단위로 만든다.

vo/<slug>/<번호>.wav  — 장면 하나의 내레이션 (문장 사이 쉼 포함)
vo/<slug>/<번호>.json — 문장별 [시작, 끝] 초. 렌더러가 자막을 음성에 맞춰 바꾸는 데 쓴다.

python tts_aoede.py            # 11편 전부
python tts_aoede.py <slug> ... # 일부만
"""
import base64, io, json, os, re, sys, urllib.request
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
# 편 묶음 데이터(plan_data · plan_revised · reading_script · scenes)가 있는 폴더
PROJ = os.environ.get("TECHA_SHORTS_PROJECT", os.path.join(os.path.dirname(HERE), "projects", "2026-10-04-11편-v3"))
sys.path.insert(0, PROJ)
from plan_revised import VIDEOS  # noqa

SCR = os.environ.get("TECHA_SHORTS_WORK", "D:/techa-shorts/build/work")
ENV_FILE = "d:/techa-automation/.env"
KEY = os.environ.get("GOOGLE_TTS_API_KEY")
if not KEY and os.path.exists(ENV_FILE):
    m = re.search(r"^\s*GOOGLE_TTS_API_KEY\s*=\s*(.*)$", open(ENV_FILE, encoding="utf-8-sig").read(), re.M)
    KEY = m and m.group(1).strip().strip("\"'")
if not KEY:
    sys.exit("GOOGLE_TTS_API_KEY 를 못 찾았다 (환경 변수 / d:/techa-automation/.env)")

VOICE = os.environ.get("TECHA_TTS_VOICE", "ko-KR-Chirp3-HD-Aoede")
RATE = {"B급": 1.12, "반반": 1.09, "감성": 1.06, "정보": 1.08}  # 또박또박 — 쇼호스트처럼 빠르게 몰지 않는다 (브랜드 규칙 §5-4, 2026-10-04 사장님 요청)
SR = 44100
GAP = 1.02         # 문장 사이 쉼 (2026-10-04 사장님 요청: 0.6초에서 70% 더 → 1.02초)
GAP_PHRASE = 0.5   # 문장 안 쉼표·자막 줄바꿈 자리의 한 템포 (2026-10-04 사장님 요청)


def sentences(text):
    return [s for s in re.split(r"(?<=[.?!])\s+", text.strip()) if s]


def synth(text, rate, markup=False, voice=None):
    body = {"input": {"markup" if markup else "text": text}, "voice": {"languageCode": "ko-KR", "name": voice or VOICE},
            "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": SR, "speakingRate": rate}}
    req = urllib.request.Request(f"https://texttospeech.googleapis.com/v1/text:synthesize?key={KEY}",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = base64.b64decode(json.load(r)["audioContent"])
    sr, w = wavfile.read(io.BytesIO(raw))
    w = w.astype(np.float32) / 32768
    # 앞뒤 무음 정리 (문장 경계 시각을 정확히)
    idx = np.where(np.abs(w) > 0.01)[0]
    if len(idx):
        w = w[max(0, idx[0] - int(sr * 0.03)): idx[-1] + int(sr * 0.08)]
    return w


def silences(w, sr, min_len=0.12):
    """말 사이 무음 구간 [(시작, 끝)] — 20ms 창 에너지가 최대치의 3% 아래인 곳"""
    win = int(sr * 0.02)
    n = len(w) // win
    e = np.sqrt(np.mean(w[: n * win].reshape(n, win) ** 2, axis=1))
    thr = max(0.006, e.max() * 0.03)
    out, st = [], None
    for k, v in enumerate(e < thr):
        if v and st is None:
            st = k
        if (not v or k == n - 1) and st is not None:
            if (k - st) * 0.02 >= min_len:
                out.append((st * 0.02, k * 0.02))
            st = None
    return out


EXPECT = {"/": 0.3, "//": 0.6, "///": 1.1}


def align(gaps, marks, says, total):
    """대본의 쉼 표시(marks)를 오디오에서 찾은 무음(gaps)에 순서대로 짝짓는다.
    글자 수로 쉼의 예상 위치를 잡고, 예상과 가장 가까운 무음을 고른다(순서 유지, 동적 계획법).
    못 찾은 쉼은 예상 위치를 그대로 쓴다."""
    K = len(marks)
    if K == 0:
        return []
    chars = [max(len(x.replace(" ", "")), 1) for x in says]
    speech = max(total - sum(EXPECT[m] for m in marks), 0.5)
    exp, t = [], 0.0
    for k in range(K):
        t += speech * chars[k] / sum(chars)
        exp.append((t, t + EXPECT[marks[k]]))
        t += EXPECT[marks[k]]
    G = len(gaps)
    INF = 1e9
    # cost[k][g]: k번째 쉼을 g번째 무음에 (g = G 는 '못 찾음')
    best = [[INF] * (G + 1) for _ in range(K + 1)]
    back = [[None] * (G + 1) for _ in range(K + 1)]
    best[0][0] = 0.0
    for k in range(K):
        for g0 in range(G + 1):
            if best[k][g0] >= INF:
                continue
            # 무음 g 를 쓴다
            for g in range(g0, G):
                c = abs((gaps[g][0] + gaps[g][1]) / 2 - sum(exp[k]) / 2)
                if best[k][g0] + c < best[k + 1][g + 1]:
                    best[k + 1][g + 1] = best[k][g0] + c
                    back[k + 1][g + 1] = (g0, g)
            # 못 찾음
            if best[k][g0] + 1.5 < best[k + 1][g0]:
                best[k + 1][g0] = best[k][g0] + 1.5
                back[k + 1][g0] = (g0, None)
    g_end = min(range(G + 1), key=lambda g: best[K][g])
    picks, g = [], g_end
    for k in range(K, 0, -1):
        g0, used = back[k][g]
        picks.append(gaps[used] if used is not None else exp[k - 1])
        g = g0
    return picks[::-1]


if __name__ == "__main__":
    import render  # 자막 줄 나누기를 렌더러와 똑같이 쓰기 위해
    import reading_script as RS
    want = set(sys.argv[1:])
    for v in VIDEOS:
        if want and v["slug"] not in want:
            continue
        d = os.path.join(SCR, "vo", v["slug"])
        os.makedirs(d, exist_ok=True)
        rate = RATE.get(v["tone"], 1.0)
        for i, bt in enumerate(v["beats"]):
            out = os.path.join(d, f"{i:02d}.wav")
            for p in (out, out[:-4] + ".json"):
                if os.path.exists(p):
                    os.remove(p)
            rd = (v.get("read") or [None] * len(v["beats"]))[i]
            if not rd:
                continue
            _, segs = render.vo_segments(bt[4], bt[3]) if False else render.phrase_chunks(rd, bt[3])
            says = [g[3] for g in segs]
            marks = [g[4] for g in segs]
            # 장면 하나를 통째로 — 억양이 토막마다 끊기지 않게. 쉼은 대본 표시 자리에만.
            markup = " ".join(sy + (" " + RS.PAUSE_TAG[mk] if k < len(segs) - 1 else "") for k, (sy, mk) in enumerate(zip(says, marks)))
            vname = "ko-KR-Chirp3-HD-" + RS.VOICES.get(v["slug"], "Aoede")
            w = synth(markup, rate, markup=True, voice=vname)
            total = len(w) / SR
            gaps = silences(w, SR)
            picks = align(gaps, marks[:-1], says, total)
            meta, a = [], 0.0
            for k, g in enumerate(segs):
                b = picks[k][0] if k < len(picks) else total
                meta.append({"c": g[0], "l": g[1], "text": g[2], "say": g[3], "a": round(a, 3), "b": round(b, 3)})
                if k < len(picks):
                    a = picks[k][1]
            wavfile.write(out, SR, (np.clip(w, -1, 1) * 32767).astype(np.int16))
            json.dump({"text": bt[4], "markup": markup, "segs": meta, "tail": RS.TAIL_SEC[marks[-1]],
                       "gaps_found": len(gaps), "pauses": len(marks) - 1, "voice": vname}, open(out[:-4] + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print(f"{v['slug']} {i:02d} {vname[-6:]} {total:.1f}s  쉼 {len(marks) - 1} / 무음 {len(gaps)}", flush=True)
