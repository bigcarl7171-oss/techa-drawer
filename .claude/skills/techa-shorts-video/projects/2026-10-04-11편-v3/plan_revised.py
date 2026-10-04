# 원고 v3 — scriptdata.py 에서 렌더러가 읽는 VIDEOS 를 만든다 (편 정보는 plan_data.py 를 이어받음).
import copy
from plan_data import VIDEOS as _ORIG
from scriptdata import S
from reading_script import plain

VIDEOS = []
for v in copy.deepcopy(_ORIG):
    d = S[v["slug"]]
    for k in ("thumb", "chip", "end", "topic", "keep"):
        v[k] = d[k]
    if d.get("bgm"):
        v["bgm"] = d["bgm"]
    v["beats"] = [("0–3", sc, an, cap, plain(rd) if rd else "(내레이션 없음)", sfx) for sc, an, cap, rd, sfx, _ in d["scenes"]]
    v["read"] = [rd or None for _, _, _, rd, _, _ in d["scenes"]]
    VIDEOS.append(v)
