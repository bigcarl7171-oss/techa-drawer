# 장면별 배경 사진 — scriptdata.py 장면 마지막 칸
from scriptdata import S

SHOTS = {slug: [sc[5] for sc in d["scenes"]] for slug, d in S.items()}
