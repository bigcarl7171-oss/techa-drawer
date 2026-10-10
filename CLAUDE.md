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
| **하루 콘텐츠 발행 순서 (최우선)** | `C:\ClaudeCode\techa-shorts\.claude\skills\techa-daily-content\SKILL.md` — 블로그·매거진·클립. 20개 주제 지침서 사본·진행표 포함 |
| 카드뉴스·스레드 원고 | `C:\ClaudeCode\techa-shorts\.claude\skills\techa-content-studio\SKILL.md` |
| **주제 후보 120개 + 이미 다룬 주제 이력** | `C:\ClaudeCode\techa-cardnews\topic-pool.md` — 게이트가 읽는 정본 |
| **지금 쓸 주제·우선순위** | 노션 `테차 원고함` (데이터소스 `8eeb105a-bd24-4c02-94f8-0ddbd35b69cd`) — SERP 근거 있는 것만 둔다. 2026-09-19에 "테차 원고 보드" 아티팩트를 은퇴시키고 여기로 옮겼다 |
| 카드뉴스 카피 규칙 | `C:\ClaudeCode\techa-cardnews\card-copy-guide.md` |
| **사이트의 정의·목적 순위** | `docs/techa-drawer-definition.md` — 2026-09-20 사장님 확정. 스마트스토어 판매 ① / 브랜드 인지 ② / B2B ③, **카페24는 정의에서 제외**. 판단이 갈리면 여기가 위다 |
| 브랜드 톤·품질게이트·색상 | `techa-brand-rules.md` (이 저장소 = 원본) |
| 채널별 분량·구조 규격 | `docs/channel-specs.md` (이 저장소 = 원본, 매거진·네이버·스레드 공통) |
| 매거진 발행 절차 | `.claude/skills/techa-publish/SKILL.md` (정본) · `docs/blog-seo-guide.md` (근거·이유) |
| **쇼츠·릴스 영상 제작** (대본·Gemini 내레이션·자막·렌더·검수) | techa-shorts 저장소 `.claude/skills/techa-shorts-studio/SKILL.md` — 쇼츠 규칙은 거기 하나뿐 (2026-10-08 통일, 이 저장소의 `techa-shorts-video` 스킬은 흡수 후 삭제) |

# 매거진 파이프라인 — 사람이 부를 때만 돈다

**순서는 `techa-daily-content` 스킬(techa-shorts 저장소)이 정본이다** (2026-10-10):
주제 확인 → 승인 → `blog.md` 초안(`routine-draft.md`) → 원고 승인 → 사장님이 네이버 발행 →
"블로그 올렸어 <주소>" → `techa-publish` 로 매거진 → 네이버 클립·인스타·유튜브 영상.
정해진 시각에 도는 루틴은 없다. 아래는 이 저장소에서만 알아야 하는 사실이다.

- 매거진도 네이버 웹문서 영역에는 뜬다 (2026-09-20 서치어드바이저 실측, `docs/naver-webmaster-2026-09-20.md`).
  선물 키워드 VIEW 영역은 블로그만 들어가므로 블로그가 본편, 매거진은 뒤에 쓴다.
- `blog.md`(네이버용)는 끝까지 저장소에 안 들어간다. 스크래치 폴더에만 둔다.
- **`docs/drafts/` 루트에는 가장 최근 발행 매거진 `.md` 1개만** 남는다. 그 전 것들은 `docs/drafts/archive/`.
- 사진은 스크래치 폴더에만 둔다. `prepare-images.js <slug> --from "<폴더>"` (촬영본이면 `--photo`).
  없는 슬롯은 초안의 영문 `prompt:` 로 힉스필드가 생성. **넣은 사진이 항상 우선.**
  원본 고해상도는 저장소에 안 넣는다 — 커밋되는 건 `blog/<slug>/*.jpg` 파생본뿐.
- 스크립트: `scripts/publish-draft.js`(발행본·목록·캐러셀·사이트맵) · `scripts/prepare-images.js`(3:2 크롭·워터마크 제거) · `scripts/check-publish.sh`(게이트)
- **목록은 손으로 고치지 않는다** — 홈 도구 표·관련 도구·홈 검색 목록은 생성기 3종이
  찍는다(`build-home-tools.js` · `build-home-curation.js` · `build-tool-hub.js` · `build-related.js` · `build-posts.js` ·
  `build-blog-products.js` · `build-tool-products.js` · `build-chrome.js` ·
  `build-message-phrases.js`). `site.js` 나
  `blog/index.html` 을 고쳤으면 해당 생성기를 돌린다. 안 돌리면 게이트가 잡는다.
  (JS로만 그리던 동안 도구 15개가 색인에서 빠져 있었다 — `docs/blog-seo-guide.md` 참고)
  **헤더·브레드크럼/h1·푸터도 `build-chrome.js` 가 찍는다 (2026-09-20).** 그전엔 65쪽 중
  61쪽에 정적 `<h1>` 이 아예 없었고 전역 링크가 전부 JS 주입이라 `/contact/` 로 가는
  정적 링크가 2개뿐이었다. 지금은 65개다. `site.js` 는 정적 마크업이 있으면 다시
  그리지 않는다(헤더 검색 동작과 푸터 연도만 붙인다).
- **홈 계절 큐레이션은 달이 바뀌면 사람 없이 자동 배포된다** (2026-09-20). 매일 00:10 KST에
  `.github/workflows/home-seasonal-curation.yml` 이 돌고, 달이 바뀌어 구성이 달라지면 `index.html` 을
  찍어 main 에 바로 푸시한다(=Cloudflare 배포). PR 검토 단계는 없다.
  원본은 `data/home-curation.json` — 이걸 고쳤으면 **`node scripts/build-home-curation.js --verify-all`** 로
  12개월치가 전부 빌드되는지 확인한다. 12월 구성이 깨져 있으면 12월 1일 새벽에야 알게 된다.
  (게이트도 같은 검사를 돈다.)
- 자동화가 못 하는 것 3가지 — 구글 색인 요청, 네이버 수집 요청, 네이버 블로그 붙여넣기. API가 없다. 실제 클릭 경로는 `docs/search-console-guide.md`.

# 원고 작성 요청

**매거진·네이버 블로그**는 `techa-daily-content` 가 유일한 경로다. **카드뉴스·쇼츠·스레드**만
따로 쓸 때는 `techa-content-studio` 가 원본 절차다.

⚠️ 규칙이 서로 어긋나면 순서는 **`techa-daily-content`**, 원고 규칙은 **`techa-content-studio`** 쪽이 최신이다. 이 저장소의
`blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
