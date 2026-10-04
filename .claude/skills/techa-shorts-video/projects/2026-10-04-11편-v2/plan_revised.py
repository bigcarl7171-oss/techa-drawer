# 원고 v2 — v2data.py 에서 렌더러가 읽는 VIDEOS 를 만든다.
# 원 콘티(plan_data.py)의 편 정보(톤·BGM·설명란 등)는 이어받고, 장면·훅·엔드카드·주제는 v2 로 바꾼다.
import copy
from plan_data import VIDEOS as _ORIG
from v2data import V2
from reading_script import plain

VIDEOS = []
for v in copy.deepcopy(_ORIG):
    d = V2[v["slug"]]
    v["thumb"], v["chip"], v["end"], v["topic"], v["keep"] = d["thumb"], d["chip"], d["end"], d["topic"], d["keep"]
    v["beats"] = [("0–3", sc, an, cap, plain(rd) if rd else "(내레이션 없음)", sfx) for sc, an, cap, rd, sfx, _ in d["scenes"]]
    v["read"] = [rd or None for _, _, _, rd, _, _ in d["scenes"]]
    VIDEOS.append(v)
