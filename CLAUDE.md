# 대화 톤

Claude가 사용자(작업자)와 나누는 대화는 **친구 같은 반말**로 한다. 존댓말이 아니라 편하고 친근한 어투로 응답한다.

> ⚠️ **적용 범위 주의**: 이건 Claude ↔ 사용자 대화에만 적용된다.
> 상세페이지 원고·카드뉴스 카피·매거진 등 **고객에게 나가는 결과물의 문체는 이 규칙과 무관**하며, `techa-brand-rules.md` 등 기존 브랜드 톤 가이드를 그대로 따른다.

# 저장소 지도 — 원고 관련 원본은 이 저장소에 없다

테차 작업은 저장소 4개에 나뉘어 있다. **이 저장소(`techa-automation`, 원격 이름은
`techa-drawer`)만 보고 "그런 파일 없다"고 판단하지 말 것.** 2026-08-17에 실제로 그렇게
오판해서, 이미 있는 주제 풀과 원고 스킬을 못 찾고 열등한 복제본을 새로 만든 사고가 있었다.

| 찾는 것 | 실제 위치 |
|---|---|
| **원고 작성 파이프라인 (원본)** | `D:\claude-practice\.claude\skills\techa-content-studio\SKILL.md` |
| **주제 후보 + 이미 다룬 주제 이력** | `D:\techa-cardnews\topic-pool.md` |
| **원고 보드** (주제 고르는 대시보드) | https://claude.ai/code/artifact/d186c5b8-c22a-4f17-af60-693ba18ba6c2<br>소스: `…\techa-content-studio\references\topic-board.html` · 재발행 시 반드시 이 URL로 |
| 시의성 주제 리서치 (추석 등) | `…\techa-content-studio\references\topic-research-2026-08.md` |
| 카드뉴스 카피 규칙 | `D:\techa-cardnews\card-copy-guide.md` |
| 브랜드 톤·품질게이트·색상 | `techa-brand-rules.md` (이 저장소 = 원본) |
| 매거진 발행 절차·SEO | `docs/blog-seo-guide.md` (이 저장소 = 원본) |

# 매일 도는 매거진 파이프라인 (2026-08-23~)

클라우드 루틴 2개가 하루를 나눠 맡는다. 사람이 하는 일은 가운데 셋뿐이다.

| 시각 | 누가 | 무엇을 |
|---|---|---|
| 05:30 KST | 초안 루틴 | 주제 3안 선정 → 1안으로 초안 작성 → `docs/drafts/`에 커밋 (`status: draft`) |
| 낮 | **사람** | ①원고 검토·수정 ②사진을 `docs/drafts/images/<슬러그>/`에 넣기 ③`status: ready`로 바꿔 커밋 |
| 14:00 KST | 발행 루틴 | `.claude/skills/techa-publish` 실행 — 빈 이미지 슬롯 생성 → 발행 → 검증 → push(=배포) → 네이버판 원고 → 이력 갱신 |

- `status: ready`가 아니면 발행 루틴은 **아무것도 하지 않는다.** 급하면 "초안 발행해줘"로 직접 부르면 된다.
- 사진을 안 넣으면 초안의 영문 프롬프트로 힉스필드가 생성한다. **넣은 사진이 항상 우선한다.**
- 스크립트: `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다.

# 원고 작성 요청

"원고 써줘" "블로그 글 써줘" "매거진에 글 하나" "이번 주 소재 뭐 쓸까" 같은 요청이 오면
**`techa-content-studio` 스킬이 원본 절차**다(위 표의 경로). 주제 추천은 반드시
`topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
