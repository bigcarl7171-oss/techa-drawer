---
name: techa-publish
description: >
  테차서랍 매거진 원고를 발행까지 끝낸다. 사람이 스크래치 폴더의 `magazine.md`를
  검토·수정한 뒤 "발행해줘"라고 부르면, 이 스킬이 나머지를 전부 처리한다 — 직전 발행본을
  archive로 내리고 매거진 최종본을 `docs/drafts/`에 넣기, 빈 이미지 슬롯 생성, 발행본 HTML
  생성, 목록·메인·사이트맵 반영, 내부링크 연결, check-publish.sh 검증, 커밋·푸시(=Cloudflare
  배포), topic-pool·INDEX 이력 갱신. 네이버용 `blog.md`는 스크래치에만 두고 저장소엔 안 넣는다.
  트리거: '발행해줘', '매거진 올려줘', '<슬러그> 발행'.
---

# 테차 매거진 발행 (techa-publish)

`routine-draft.md`에 따라 네 PC의 스크래치 폴더(`C:\연습\<slug>_원고\` 등)에 `magazine.md`와
`blog.md`가 만들어진다. 사람이 `magazine.md`를 검토·수정하고 "발행해줘"로 부르면 이 스킬이
**거기서부터 끝까지**를 맡는다. 발행은 하루 한 편이 기준이다. 정해진 시각에 도는 클라우드
루틴은 없다 (2026-09-05 폐지).

> ⚠️ 규칙이 서로 어긋나면 **`techa-content-studio` 스킬 쪽이 최신이다.** 이 저장소의
> `docs/blog-seo-guide.md`가 더 오래된 방침을 담고 있던 전례가 있다(네이버 링크백 건).
> 채널별 분량·구조 수치는 `docs/channel-specs.md`가 단일 출처다.

## 저장소 찾기 — 절대경로를 외우지 않는다

작업 PC마다 드라이브·폴더명이 다르다. 하드코딩했다가 "그런 파일 없다"고 오판한 사고가
있었다(2026-08-17). 부모 폴더에서 **특징 파일**로 찾는다 — `check-publish.sh`의 `find_repo()`와 같은 방식.

| 별칭 | 특징 파일 |
|---|---|
| `techa-drawer` (여기) | 루트의 `techa-brand-rules.md` |
| `techa-cardnews` | 루트의 `topic-pool.md` |
| `techa-shorts` | 루트의 `script-guide.md` — `.claude/skills/techa-content-studio/` 가 여기 있다 |

---

## S0 — 대상 확정 + 저장소로 들여오기

1. `git pull`
2. 사람이 준 스크래치 폴더 경로와 `<slug>`를 확인한다. `magazine.md`를 읽는다.
   프론트매터에 `date`(발행일, 오늘)와 `slug`가 없으면 정한다.
3. **직전 발행본을 archive로 내린다**: `docs/drafts/` 루트에 있는 `*-*.md`(INDEX.md 제외,
   보통 1개 — 지난번 발행 매거진)를 `git mv` 로 `docs/drafts/archive/` 로 옮긴다.
   → 루트에는 항상 **가장 최근 발행본 1개만** 남는다.
   - `-naver.md` 가 눈에 띄면 그냥 `git rm` 한다. **네이버본은 저장소에 두지 않는다** —
     같은 주제 매거진이 발행되면 폐기한다 (2026-09-07 확정).
4. `magazine.md`를 `docs/drafts/<date>-<slug>.md` 로 복사한다 (프론트매터 `status: published`).
   이 파일이 "저장소에 남는 매거진 최종본"이다. 이후 스크립트는 전부 이 파일을 읽는다.

## S1 — 이미지 채우기

```
node scripts/prepare-images.js <slug> --from "<스크래치폴더>"        # AI 생성분(우하단 워터마크 크롭)
node scripts/prepare-images.js <slug> --from "<스크래치폴더>" --photo  # 직접 촬영본(가운데 크롭)
```

JSON의 `missing[]`을 본다. 비어 있으면 S2로.

빈 슬롯이 있으면 **그 슬롯만** 생성한다:

- 각 항목의 `prompt`(초안 이미지 마커의 `— prompt:` 영문 프롬프트)로 힉스필드 `generate_image` 호출.
- `prompt`가 비어 있으면 `desc`(한글 설명)를 근거로 영문 프롬프트를 직접 만든다.
  `blog-seo-guide.md` 이미지 규칙:
  - `Photorealistic`, 따뜻한 자연광 · `no text, no watermark, no logos`
  - `keep the bottom-right corner as simple, uncluttered background` (워터마크 잘라낼 자리)
  - 사람이 나오면 안 되는 컷이면 `no people`
- 받은 파일을 스크래치 폴더에 `cover.png` / `1.png` / `2.png`… 로 두고 `prepare-images.js`를
  다시 돌린다. 우하단 워터마크가 잘리고 3:2·1200px·q4 jpg로 `blog/<slug>/`에 들어간다.
- 결과 jpg가 100~150KB 범위인지 `filled[].kb`로 확인한다. 크게 벗어나면 사용자에게 알린다.
- **원본 PNG·고해상도 사진은 저장소에 넣지 않는다.** 커밋되는 건 `blog/<slug>/*.jpg` 파생본뿐.

## S2 — 발행본 생성

원고를 읽고 세 가지를 정한 뒤 스크립트에 넘긴다:

- `--emoji` 소재에 맞는 이모지 1개 (기존 카드들과 겹쳐도 된다)
- `--tag` 캐러셀 태그, 2~5자 (예: `꽃 고르기`, `기업 행사`, `보관법`)
- `--desc` 목록 카드 한 줄 — 한 줄 요약을 그대로 쓰지 말고 **뭘 알 수 있는 글인지** 30~45자로
- `--cta` (선택) 이 글과 어울리는 선물 문구. 억지스러우면 넣지 않는다

```
node scripts/publish-draft.js <slug> --emoji 🌷 --tag "꽃 고르기" --desc "…" [--cta "…"]
```

이 스크립트가 처리하는 것 (손대지 말 것):
발행본 HTML · `og:image`를 글별 cover로 · `blog/index.html` 카드 · `index.html` 캐러셀(상한 3,
`transition-delay` 재부여) · 위젯(상한 5) · `sitemap.xml` · 멱등 재실행.

JSON의 `warnings[]`를 확인한다. **본문 분량 경고가 뜨면 여기서 멈추고 사용자에게 알린다** —
매거진 목표는 `docs/channel-specs.md` 기준(현재 1,500~2,800자)이다. 무단으로 살을 붙이지 않는다.

## S3 — 내부링크 (판단이 필요한 단계)

새 글로 들어오는 링크를 **블로그 밖 페이지 최소 1곳**에 만든다. 2026-08-17·08-18 두 번 연속
누락된 지점이라 `check-publish.sh`가 실패로 잡는다.

- 후보: `care/`, `about/`, `ko/<도구>/` 중 **소재가 실제로 맞닿는** 곳
- 문맥 안에 자연스러운 문장으로 넣는다. "관련 글" 목록을 새로 만들지 않는다
- 억지로 맞는 곳이 없으면 그 사실을 보고하고 사용자 판단을 받는다 — 아무 데나 꽂지 않는다

## S4 — 검증 (게이트)

```
bash scripts/check-publish.sh <slug>
```

- **❌가 하나라도 있으면 커밋하지 않고 멈춘다.** 뭐가 걸렸는지 그대로 보고한다.
- ⚠️ 중 "라이브 페이지/sitemap"은 아직 배포 전이라 정상이다. 나머지 ⚠️는 사용자에게 알린다.

## S5 — 커밋·푸시 (배포)

통과했을 때만:

```
git add blog/<slug> blog/index.html index.html sitemap.xml docs/drafts/ <내부링크 건드린 파일>
git commit -m "매거진 발행: <제목>"
git push
```

`docs/drafts/` 에는 이번 발행본 추가 + 직전 발행본의 archive 이동이 함께 담긴다.
푸시하면 Cloudflare Workers Builds가 자동 배포한다. 1~2분 뒤:

```
curl -s -o /dev/null -w '%{http_code}' https://www.techa.kr/blog/<slug>/
```
200이 아니면 보고한다.

## S6 — 네이버용 blog.md 점검 (저장소엔 안 넣는다)

`blog.md`는 `routine-draft.md` S5에서 이미 스크래치 폴더에 만들어져 있다.
**저장소에 커밋하지 않는다.** 여기서는 두 가지만 확인한다:

- S0~S2에서 `magazine.md`가 **크게 바뀌었으면** `blog.md`도 스크래치에서 맞춰 다시 쓴다
  (다루는 범위는 매거진과 같게, 형식·문장·1인칭 농도만 다르게 — `stage3-blog.md`).
- `blog.md`에 techa.kr 링크가 없는지, 마크다운 문법(`###`)이 없는지, 제목 3안이 있는지.

사람이 이 `blog.md`를 네이버 블로그에 붙여넣는다(S8). 붙여넣고 나면 스크래치 폴더째 삭제한다.

## S7 — 이력 갱신 (빠뜨리면 같은 주제를 또 추천하게 된다)

중복 방지의 정본은 **`techa-cardnews/topic-pool.md` 의 "이미 다룬 주제" 표** 하나다.

1. `techa-cardnews/topic-pool.md`:
   - **"이미 다룬 주제" 표** → 제목 · `슬러그` · 발행일 · 네이버 재구성 각도 한 줄
   - `topic_no` 가 있으면 번호 표 그 행 `사용함` 열에 `날짜` 도 적는다 (`routine-draft.md` S2 가 읽는다)
   - 커밋·푸시한다 (다른 저장소다)
2. `docs/drafts/INDEX.md` 맨 위에 이번 발행 행을 추가한다 (`날짜 | 번호 | 슬러그 | 제목 | 상태`).
   상태는 `발행` (네이버 블로그에도 올렸으면 `발행+네이버`).

## S8 — 사람 몫만 보고하고 끝낸다

API가 없어 자동화할 수 없는 셋:

- 구글 서치콘솔 → URL 검사 → 색인 생성 요청
- 네이버 서치어드바이저 → 요청 → 웹 페이지 수집 요청
- 스크래치 폴더의 `blog.md`를 네이버 블로그에 붙여넣기 (제목 3안 중 1개 확정 + 이미지 3장 업로드)
  → 끝나면 스크래치 폴더 삭제

최종 보고: 발행 URL · 본문 자수 · 이미지 출처(직접 촬영 / AI 생성) · 내부링크 건 페이지 ·
`check-publish.sh` 결과 · 스크래치 `blog.md` 경로 · 위 3가지 남은 일.

---

## 실행 전 체크리스트

- [ ] S0: 직전 발행본을 `docs/drafts/archive/` 로 옮겼는가 / 루트에 최종본 1개만 남았는가
- [ ] S1: 촬영본은 `--photo` 로 돌렸는가 / 워터마크가 잘렸는가 / 원본을 저장소에 안 넣었는가
- [ ] S2: 본문 분량 경고가 떴는데 **멈췄는가** (몰래 늘리지 않았는가)
- [ ] S3: 블로그 밖 내부링크를 문맥 안에 자연스럽게 넣었는가
- [ ] S4: ❌ 없이 통과한 뒤에만 커밋했는가
- [ ] S6: `blog.md` 를 저장소에 커밋하지 **않았는가** / magazine 변경분이 반영됐는가 / techa.kr 링크가 없는가
- [ ] S7: `topic-pool.md` "이미 다룬 주제" 표를 갱신·푸시했는가 / INDEX 행을 추가했는가
- [ ] 브랜드 사실: 누적 판매량·리뷰 건수를 **숫자로 쓰지 않았는가** (평점 4.8+ 만 숫자 허용).
      손님 문의는 허용된 3가지(배송·맞춤 제작·생화 여부) 밖으로 나가지 않았는가
