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

# 원고 작성 요청

"원고 써줘" "블로그 글 써줘" "매거진에 글 하나" "이번 주 소재 뭐 쓸까" 같은 요청이 오면
**`techa-content-studio` 스킬이 원본 절차**다(위 표의 경로). 주제 추천은 반드시
`topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
