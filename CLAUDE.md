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
| **주제 후보 120개 + 이미 다룬 주제 이력** | `C:\ClaudeCode\techa-cardnews\topic-pool.md` — 게이트가 읽는 정본 |
| **지금 쓸 주제·우선순위** | 노션 `테차 원고함` (데이터소스 `8eeb105a-bd24-4c02-94f8-0ddbd35b69cd`) — SERP 근거 있는 것만 둔다. 2026-09-19에 "테차 원고 보드" 아티팩트를 은퇴시키고 여기로 옮겼다 |
| 시의성 주제 리서치 (추석 등) | `…\techa-content-studio\references\topic-research-2026-08.md` |
| 카드뉴스 카피 규칙 | `C:\ClaudeCode\techa-cardnews\card-copy-guide.md` |
| **사이트의 정의·목적 순위** | `docs/techa-drawer-definition.md` — 2026-09-20 사장님 확정. 스마트스토어 판매 ① / 브랜드 인지 ② / B2B ③, **카페24는 정의에서 제외**. 판단이 갈리면 여기가 위다 |
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
| 2 | **사람이 부름** | "초안 써줘" → `routine-draft.md` 대로 스크래치 폴더(`C:\연습\<slug>_원고\`)에 **`blog.md`를 먼저** 쓰고, 그 범위대로 `magazine.md`를 새로 쓴다. 저장소엔 아무것도 안 만든다 |
| 3 | **사람** | `blog.md` 검토·수정 (채팅에서 반복) → 확정되면 그 범위를 `magazine.md`에 맞춘다. 승인하면 "발행해줘" |
| 4 | **사람이 부름** | "발행해줘" → `.claude/skills/techa-publish` 실행 — 직전 발행본을 archive로 내리고 `magazine.md`를 `docs/drafts/<날짜>-<slug>.md`로 들여옴 → 이미지 → 발행본 → 검증 → push(=배포) → topic-pool·INDEX 갱신 |
| 5 | **사람** | **스크래치 `blog.md`를 네이버 블로그에 붙여넣기(해시태그 클러스터 포함) ← 1순위** + 색인 요청 2곳 → 스크래치 폴더 삭제 |

- 발행은 **하루 한 편**이 기준이다. 2~4는 한 세션에 몰아도 되고 며칠에 나눠도 된다.
- ⭐ **선물 키워드에서는 네이버 블로그가 본편이다 (2026-09-19).** 와이프생일선물·프로포즈꽃다발
  같은 구매형 화면은 쇼핑·VIEW가 채우고 techa.kr이 들어갈 자리가 없다(32개 실측 0건).
  매거진은 구글·브랜드 자산으로 계속 쓰되 **작성 순서에서 뒤에 둔다.**
  > ⚠️ **정정 (2026-09-20).** 위를 "네이버에 techa.kr 자리가 없다"로 일반화했던 것은 틀렸다.
  > 서치어드바이저 실측(최근 30일)은 **노출 26,000 · 클릭 260 · 전월비 +553%**다. 다만 그 유입은
  > **선물 키워드가 아니라 도구 키워드의 웹문서 영역**에서 온다 — `/ko/workdays/` 3,074노출,
  > `/ko/menu-roulette/` 6,495, `/ko/ladder/`, `/ko/age-calculator/`. 매거진 글도 웹문서에는 뜬다
  > (`sad-flower-meaning` 2,248노출). VIEW에 안 뜨는 것과 네이버에 아예 없는 것은 다르다.
  > 근거·해석은 `docs/naver-webmaster-2026-09-20.md`.
- 주제는 **"구매 직전 고민"** 쪽으로 고른다. 꽃말 같은 정보형은 이겨도 안 산다.
  판정 원장은 `docs/keyword-serp-tracker-2026-08.xlsx`(11개) + `serp-vertical-strategy-2026-08.md` §2.
- 발행 3~7일 뒤 **네이버에서 재검색해 노출을 확인한다** (`techa-publish` S8).
  확인하지 않으면 몇 편을 쓰든 결과가 같다.
- **`blog.md`(네이버용)는 끝까지 저장소에 안 들어간다.** 스크래치에서 쓰고, 네이버에 붙여넣고, 폴더째 삭제.
- **`docs/drafts/` 루트에는 가장 최근 발행 매거진 `.md` 1개만** 남는다. 그 전 것들은 `docs/drafts/archive/`.
- 사진은 스크래치 폴더에만 둔다. `prepare-images.js <slug> --from "<폴더>"` (촬영본이면 `--photo`).
  없는 슬롯은 초안의 영문 `prompt:` 로 힉스필드가 생성. **넣은 사진이 항상 우선.**
  원본 고해상도는 저장소에 안 넣는다 — 커밋되는 건 `blog/<slug>/*.jpg` 파생본뿐.
- 스크립트: `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- **목록은 손으로 고치지 않는다** — 홈 도구 표·관련 도구·홈 검색 목록은 생성기 3종이
  찍는다(`build-home-tools.js` · `build-home-curation.js` · `build-related.js` · `build-posts.js` ·
  `build-blog-products.js`). `site.js` 나
  `blog/index.html` 을 고쳤으면 해당 생성기를 돌린다. 안 돌리면 게이트가 잡는다.
  (JS로만 그리던 동안 도구 15개가 색인에서 빠져 있었다 — `docs/blog-seo-guide.md` 참고)
- **홈 계절 큐레이션은 달이 바뀌면 사람 없이 자동 배포된다** (2026-09-20). 매일 00:10 KST에
  `.github/workflows/home-seasonal-curation.yml` 이 돌고, 달이 바뀌어 구성이 달라지면 `index.html` 을
  찍어 main 에 바로 푸시한다(=Cloudflare 배포). PR 검토 단계는 없다.
  원본은 `data/home-curation.json` — 이걸 고쳤으면 **`node scripts/build-home-curation.js --verify-all`** 로
  12개월치가 전부 빌드되는지 확인한다. 12월 구성이 깨져 있으면 12월 1일 새벽에야 알게 된다.
  (게이트도 같은 검사를 돈다.)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다. 실제 클릭 경로는 `docs/search-console-guide.md`.

# 원고 작성 요청

**매거진·네이버 블로그**는 위 파이프라인(사람이 채팅으로 주제를 지정한다)이 유일한 경로다.
주제가 없으면 초안을 쓰지 않는다 (`routine-draft.md` S1). AI가 주제를 고르던 STAGE 1
자동선정은 2026-09-05에 폐지됐다 — `topic-pool.md`는 이제 **중복 확인용**으로만 본다.

"원고 써줘" 류 요청이 **카드뉴스·쇼츠·스레드**에 대한 것이면 `techa-content-studio`
스킬이 원본 절차다(위 표의 경로). 이때 주제는 `topic-pool.md`에서 고른다 — 즉흥 생성하지 않는다.

⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 쪽이 최신**이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
