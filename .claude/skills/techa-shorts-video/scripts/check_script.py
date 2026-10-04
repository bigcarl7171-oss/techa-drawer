"""원고 데이터 점검 — TTS·렌더 전에 돌린다 (돈·시간 들기 전에 잡는다).

PYTHONIOENCODING=utf-8 TECHA_SHORTS_PROJECT=<프로젝트 폴더> python check_script.py

편마다: 장면별 자동 연출 / 낭독 글자 수(≈ 길이) / 대본에 남은 맨 숫자 / 소리가 안 나는 효과음 칸 / BGM 스타일 / 사진 파일 존재.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render  # noqa: E402  (PROJ 경로 설정과 analyse 를 같이 쓴다)
import audio  # noqa: E402
import reading_script as RS  # noqa: E402
from plan_revised import VIDEOS  # noqa: E402

FX_KEYS = ("bignum", "cross", "stamp", "split", "chips", "hanja", "bigtxt", "dcount", "light", "music_stop")
bad_total = 0
for v in VIDEOS:
    probs, n = [], 0
    shots = render.SHOTS.get(v["slug"], [])
    print(f"\n{v['slug']}  ({v.get('topic', '')})  BGM={audio.style_for(v['bgm'])}")
    for i, bt in enumerate(v["beats"]):
        fx = render.analyse(bt)
        rd = (v.get("read") or [None] * len(v["beats"]))[i]
        if rd:
            n += len(re.sub(r"[\s.,?!'…]", "", "".join(RS.say(t) for t, _ in RS.parse(rd))))
            for t, _ in RS.parse(rd):
                if re.search(r"\d", RS.say(t)):
                    probs.append(f"장면{i} 숫자를 한글 읽기로: {t}")
        if bt[5].strip() not in ("—", "-", "") and not audio.sfx_for(bt[5]):
            probs.append(f"장면{i} 효과음 키워드 없음: {bt[5]}")
        if i < len(shots):
            for sp in (shots[i] if isinstance(shots[i], list) else [shots[i]]):
                try:
                    path, _, _ = sp.partition("@")
                    d = render.src_dir(v["slug"]) if "/" not in path else next(
                        os.path.join(render.SRC, x) for x in os.listdir(render.SRC) if x.startswith(path.split("/")[0] + "-"))
                    if not os.path.exists(os.path.join(d, "원본사진", path.split("/")[-1])):
                        probs.append(f"장면{i} 사진 없음: {sp}")
                except StopIteration:
                    probs.append(f"장면{i} 사진 편 번호 없음: {sp}")
        tags = [k for k in FX_KEYS if fx.get(k)]
        extra = fx.get("stamp") or fx.get("chips") or fx.get("split") or ""
        print(f"   {i}  {tags} {extra}")
    est = n * 0.205 + 9.5  # 2026-10-04 v3 실측 보정 (331자→77.4초, 252자→61.2초, 쉼·엔드카드 포함)
    print(f"   낭독 {n}자 ≈ {est:.0f}초" + ("  ⚠ 60초 넘음" if est > 60 else ""))
    for p in probs:
        print("   ⚠", p)
    bad_total += len(probs)
print(f"\n문제 {bad_total}건")
