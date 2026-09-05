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

# 매거진 파이프라인 — 사람이 부를 때만 돈다 (2026-09-05~)

**정해진 시각에 도는 루틴은 없다.** 사람이 주제와 사진을 정해 주문을 넣고, 그 다음
단계를 직접 불러서 진행한다. 전에는 04:00 초안 루틴 + 9·10·11시 발행 루틴이 크론으로
돌았지만, 주문이 없는 날에도 매일 네 번 세션이 떠서 빈손으로 끝나 크레딧만 쓰였다.

| 순서 | 누가 | 무엇을 |
|---|---|---|
| 1 | **사람** | 로컬 폴더에 레퍼런스 사진을 모으고 `node scripts/new-order.js <폴더> --slug <슬러그> --title "…" --angle "…"` → **커밋·푸시**. 이게 주문이다 |
| 2 | **사람이 부름** | "초안 써줘" → `docs/drafts/NEXT.md`의 주문을 읽고 `docs/drafts/refs/<슬러그>/` 사진을 보며 초안 작성 → 커밋 → 주문서를 `docs/drafts/orders/`로 옮기고 `NEXT.md`를 비운다 |
| 3 | **사람** | ①원고 검토·수정 ②`status: ready`로 바꿔 커밋 (사진은 주문 때 이미 넣었다) |
| 4 | **사람이 부름** | "초안 발행해줘" → `.claude/skills/techa-publish` 실행 — 빈 이미지 슬롯 생성 → 발행 → 검증 → push(=배포) → 네이버판 원고 → 이력 갱신 |

- 발행은 **하루 한 편**이 기준이다. 2·4단계는 같은 날 몰아서 해도 되고 며칠에 나눠도 된다.
- `status: ready`가 아니면 발행 스킬은 **아무것도 하지 않는다.**
- 사진을 안 넣으면 초안의 영문 프롬프트로 힉스필드가 생성한다. **넣은 사진이 항상 우선한다.**
- **사진 경로가 세 갈래다.** 우선순위는 `docs/drafts/images/<슬러그>/`(로컬 전용, gitignore) → `docs/drafts/refs/<슬러그>/`(**주문서 사진, 커밋됨**) → AI 생성분.
  초안의 이미지 마커에 `ref: 04.jpg`처럼 적으면 `refs/`의 그 파일을 쓴다.
- ⚠️ `docs/drafts/images/`는 여전히 gitignore다. **거기 넣은 사진은 클라우드 루틴이 못 본다.** 두 대의 PC를 오가거나 루틴이 보게 하려면 `new-order.js`로 `refs/`에 넣어라(자동으로 3:2·1200px·q4로 압축된다). 원본 고해상도는 레포에 넣지 말고 각자 클라우드에 둔다.
- 스크립트: `scripts/new-order.js`(주문 넣기 — 사진 압축 + NEXT.md 작성) · `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다.

# 원고 작성 요청

"원고 써줘" "블로그 글 써줘" "매거진에 글 하나" "이번 주 소재 뭐 쓸까" 같은 요청이 오면
**`techa-content-studio` 스킬이 원본 절차**다(위 표의 경로). 주제 추천은 반드시
`topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
