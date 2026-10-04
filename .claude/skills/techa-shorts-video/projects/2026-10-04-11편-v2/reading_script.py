# 낭독 대본 — v2data.py 의 장면 낭독 칸과 목소리. 표기와 읽기 함수는 아래.
from v2data import V2

READ = {slug: [sc[3] or None for sc in d["scenes"]] for slug, d in V2.items()}
VOICES = {slug: d["voice"] for slug, d in V2.items()}


PAUSE_TAG = {"/": "[pause short]", "//": "[pause]", "///": "[pause long]"}
TAIL_SEC = {"/": 0.45, "//": 0.85, "///": 1.25}  # 장면 끝 쉼 (다음 장면으로 넘어가기 전)


NUM = __import__("re").compile(r"\{([^|}]*)\|([^}]*)\}")


def show(txt):
    """자막에 보일 글자 — 숫자 그대로"""
    return NUM.sub(lambda m: m.group(1), txt)


def say(txt):
    """TTS가 읽을 글자 — 숫자는 한글로 (맥락에 맞춰 직접 적은 읽기)"""
    return NUM.sub(lambda m: m.group(2), txt)


def parse(line):
    """'가 / 나 // 다 ///' → [(말 토막, 뒤 쉼 표시)]. 마지막 토막의 표시는 장면 끝 쉼."""
    import re
    toks = re.split(r"\s*(/{1,3})\s*", line.strip())
    out = []
    for k in range(0, len(toks), 2):
        txt = toks[k].strip()
        mark = toks[k + 1] if k + 1 < len(toks) else "//"
        if txt:
            out.append((txt, mark))
    return out


def plain(line):
    """자막·화면용 원고 (숫자 그대로)"""
    return " ".join(show(t) for t, _ in parse(line))


