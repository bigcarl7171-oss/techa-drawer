# 장면별 배경 사진 — v2data.py 의 장면 마지막 칸에서 가져온다.
from v2data import V2

SHOTS = {slug: [sc[5] for sc in d["scenes"]] for slug, d in V2.items()}
