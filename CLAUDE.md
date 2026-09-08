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

# 매거진 파이프라인 — 사람이 부를 때만 돈다 (2026-09-07 개정)

**정해진 시각에 도는 루틴은 없다.** 사람이 채팅으로 주제·사진을 지정하고, 다음 단계를
직접 불러서 진행한다. 초안은 **저장소가 아니라 네 PC의 스크래치 폴더**에 만든다.
매거진 최종본만 발행 단계에서 저장소로 들어온다.

| 순서 | 누가 | 무엇을 |
|---|---|---|
| 1 | **사람** | 채팅으로 지정: "주제 X, 사진은 `C:\...\폴더`, 각도는 …" |
| 2 | **사람이 부름** | "초안 써줘" → `routine-draft.md` 대로 스크래치 폴더(`C:\연습\<slug>_원고\`)에 `magazine.md` + `blog.md` 작성. 저장소엔 아무것도 안 만든다 |
| 3 | **사람** | `magazine.md` 검토·수정 (채팅에서 반복). 승인하면 "발행해줘" |
| 4 | **사람이 부름** | "발행해줘" → `.claude/skills/techa-publish` 실행 — 직전 발행본을 archive로 내리고 `magazine.md`를 `docs/drafts/<날짜>-<slug>.md`로 들여옴 → 이미지 → 발행본 → 검증 → push(=배포) → topic-pool·INDEX 갱신 |
| 5 | **사람** | 색인 요청 2곳 + 스크래치 `blog.md`를 네이버 블로그에 붙여넣기 → 스크래치 폴더 삭제 |

- 발행은 **하루 한 편**이 기준이다. 2~4는 한 세션에 몰아도 되고 며칠에 나눠도 된다.
- **`blog.md`(네이버용)는 끝까지 저장소에 안 들어간다.** 스크래치에서 쓰고, 네이버에 붙여넣고, 폴더째 삭제.
- **`docs/drafts/` 루트에는 가장 최근 발행 매거진 `.md` 1개만** 남는다. 그 전 것들은 `docs/drafts/archive/`.
- 사진은 스크래치 폴더에만 둔다. `prepare-images.js <slug> --from "<폴더>"` (촬영본이면 `--photo`).
  없는 슬롯은 초안의 영문 `prompt:` 로 힉스필드가 생성. **넣은 사진이 항상 우선.**
  원본 고해상도는 저장소에 안 넣는다 — 커밋되는 건 `blog/<slug>/*.jpg` 파생본뿐.
- 스크립트: `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다. 실제 클릭 경로는 `docs/search-console-guide.md`.

# 원고 작성 요청

**매거진·네이버 블로그**는 위 파이프라인(사람이 채팅으로 주제를 지정한다)이 유일한 경로다.
주제가 없으면 초안을 쓰지 않는다 (`routine-draft.md` S1). AI가 주제를 고르던 STAGE 1
자동선정은 2026-09-05에 폐지됐다 — `topic-pool.md`는 이제 **중복 확인용**으로만 본다.

"원고 써줘" 류 요청이 **카드뉴스·쇼츠·스레드**에 대한 것이면 `techa-content-studio`
스킬이 원본 절차다(위 표의 경로). 이때 주제는 `topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
