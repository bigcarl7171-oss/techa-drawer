# 대화 톤

Claude가 사용자(작업자)와 나누는 대화는 **친구 같은 반말**로 한다. 존댓말이 아니라 편하고 친근한 어투로 응답한다.

> ⚠️ **적용 범위 주의**: 이건 Claude ↔ 사용자 대화에만 적용된다.
> 상세페이지 원고·카드뉴스 카피·매거진 등 **고객에게 나가는 결과물의 문체는 이 규칙과 무관**하며, `techa-brand-rules.md` 등 기존 브랜드 톤 가이드를 그대로 따른다.

# 저장소 지도 — 원고 관련 원본은 이 저장소에 없다

테차 작업은 저장소 4개에 나뉘어 있다. **이 저장소(`techa-automation`, 원격 이름은
`techa-drawer`)만 보고 "그런 파일 없다"고 판단하지 말 것.** 2026-08-17에 실제로 그렇게
오판해서, 이미 있는 주제 풀과 원고 스킬을 못 찾고 열등한 복제본을 새로 만든 사고가 있었다.

> ⚠️ **경로를 외우지 않는다.** PC마다 드라이브·폴더명이 다르다. 형제 저장소는
> **특징 파일**로 찾는다 (`check-publish.sh` 의 `find_repo()` 와 같은 방식):
> `topic-pool.md` 가 있는 폴더 = `techa-cardnews`, `script-guide.md` 가 있는 폴더 = `techa-shorts`.
> 이 PC(2026-09-07 기준)에서는 셋 다 `C:\ClaudeCode\` 아래에 있다.

| 찾는 것 | 실제 위치 (2026-09-07 이 PC 기준) |
|---|---|
| **원고 작성 파이프라인 (원본)** | `C:\ClaudeCode\techa-shorts\.claude\skills\techa-content-studio\SKILL.md` |
| **주제 후보 + 이미 다룬 주제 이력** | `C:\ClaudeCode\techa-cardnews\topic-pool.md` |
| 시의성 주제 리서치 (추석 등) | `…\techa-content-studio\references\topic-research-2026-08.md` |
| 카드뉴스 카피 규칙 | `C:\ClaudeCode\techa-cardnews\card-copy-guide.md` |
| 브랜드 톤·품질게이트·색상 | `techa-brand-rules.md` (이 저장소 = 원본) |
| 채널별 분량·구조 규격 | `docs/channel-specs.md` (이 저장소 = 원본, 매거진·네이버·스레드 공통) |
| 매거진 발행 절차 | `.claude/skills/techa-publish/SKILL.md` (정본) · `docs/blog-seo-guide.md` (근거·이유) |

# 매거진 파이프라인 — 사람이 부를 때만 돈다 (2026-09-05~)

**정해진 시각에 도는 루틴은 없다.** 사람이 주제와 사진을 정해 주문을 넣고, 그 다음
단계를 직접 불러서 진행한다. 전에는 04:00 초안 루틴 + 9·10·11시 발행 루틴이 크론으로
돌았지만, 주문이 없는 날에도 매일 네 번 세션이 떠서 빈손으로 끝나 크레딧만 쓰였다.

| 순서 | 누가 | 무엇을 |
|---|---|---|
| 1 | **사람** | 로컬 폴더에 레퍼런스 사진을 모으고 `node scripts/new-order.js <폴더> --slug <슬러그> --title "…" --angle "…"` → **커밋·푸시**. 이게 주문이다 |
| 2 | **사람이 부름** | "초안 써줘" → `docs/drafts/NEXT.md`의 주문을 읽고 `docs/drafts/refs/<슬러그>/` 사진을 보며 초안 작성 → 커밋 → 주문서를 `docs/drafts/orders/`로 옮기고 `NEXT.md`를 비운다 |
| 3 | **사람** | 원고 검토·수정 후 `status: ready` (아래 "혼자 돌릴 때" 참고 — 별도 커밋은 선택) |
| 4 | **사람이 부름** | "초안 발행해줘" → `.claude/skills/techa-publish` 실행 — 빈 이미지 슬롯 생성 → 발행 → 검증 → push(=배포) → 네이버판 원고 → 이력 갱신 |

- 발행은 **하루 한 편**이 기준이다. 2·4단계는 같은 날 몰아서 해도 되고 며칠에 나눠도 된다.
- `status: ready`가 아니면 발행 스킬은 **아무것도 하지 않는다.**
- **혼자 대화형으로 다 돌릴 때 (2026-09-07~)**: 2·3·4를 한 세션에 몰아도 된다. Claude가
  초안을 채팅에 그대로 보여주고 → 사람이 "이대로 발행" 하면 → Claude가 `status: ready`로
  바꾸고 이어서 발행한다. 3단계의 "사람이 손으로 별도 커밋"은 **폐지된 무인 클라우드 루틴을
  위한 것**이었다 — 이제는 필수가 아니다. `status` 필드 자체는 안전 인터록으로 남긴다.
- 사진을 안 넣으면 초안의 영문 프롬프트로 힉스필드가 생성한다. **넣은 사진이 항상 우선한다.**
- **사진 경로가 세 갈래다.** 우선순위는 `docs/drafts/images/<슬러그>/`(로컬 전용, gitignore) → `docs/drafts/refs/<슬러그>/`(**주문서 사진, 커밋됨**) → AI 생성분.
  초안의 이미지 마커에 `ref: 04.jpg`처럼 적으면 `refs/`의 그 파일을 쓴다.
- ⚠️ `docs/drafts/images/`는 여전히 gitignore다. **거기 넣은 사진은 클라우드 루틴이 못 본다.** 두 대의 PC를 오가거나 루틴이 보게 하려면 `new-order.js`로 `refs/`에 넣어라(자동으로 3:2·1200px·q4로 압축된다). 원본 고해상도는 레포에 넣지 말고 각자 클라우드에 둔다.
- 스크립트: `scripts/new-order.js`(주문 넣기 — 사진 압축 + NEXT.md 작성) · `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다.

# 원고 작성 요청

**매거진·네이버 블로그**는 위 파이프라인(사람이 `NEXT.md` 주문으로 주제를 정한다)이
유일한 경로다. 주문이 없으면 초안을 쓰지 않는다 (`routine-draft.md` S0). AI가 주제를
고르던 STAGE 1 자동선정은 2026-09-05에 폐지됐다 — `topic-pool.md`는 이제 **중복 확인용**으로만 본다.

"원고 써줘" 류 요청이 **카드뉴스·쇼츠·스레드**에 대한 것이면 `techa-content-studio`
스킬이 원본 절차다(위 표의 경로). 이때 주제는 `topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
