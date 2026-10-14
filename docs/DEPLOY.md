# 배포 가이드 (무료)

> ⚠️ **2026-10-14 확인 필요:** 작업 브랜치 `feature/message-page-refresh-20261014`의
> Cloudflare 검사가 `production/builds`로 기록됐고, `main`에 병합하기 전에도 그 변경이
> `www.techa.kr/message/`에서 보였다. 아래의 `main` 전용 배포 설명은 현재 동작과
> 일치하지 않을 수 있다. Cloudflare 대시보드의 **Workers & Pages → techa-automation →
> Settings → Builds → Branch control**에서 Production branch가 `main`인지 확인하고,
> 다른 브랜치의 Preview command가 `npx wrangler preview`인지 확인해야 한다.
> 설정을 확인·수정하기 전에는 **작업 브랜치 푸시도 운영 반영 가능성이 있다고 보고**
> 공개 페이지를 확인한다. [Cloudflare 브랜치 설정 안내](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

> ✅ **현재 이미 배포되어 있음** (2026-07-28 기준, Cloudflare 대시보드로 확인됨)
> - Cloudflare Pages/Workers 프로젝트명: **techa-automation** (GitHub 저장소가 `techa-drawer`로
>   이름 변경된 뒤에도 연결은 안 끊김 — 저장소 ID 기준 연결이라 이름 변경엔 영향 없음)
> - **Production 브랜치는 `main`** — 아래 나머지 방법 A/B/C의 절차는 이미 완료된 최초 설정
>   과정을 위해 남겨둔 기록이다. **`main`에 push할 때마다 즉시 techa.kr에 반영되니, 사이트
>   파일(ko/, assets/, index.html 등)을 지우거나 옮기는 커밋은 반드시 신중하게.**
> - 커스텀 도메인 **techa.kr** 연결 완료

이 사이트는 순수 정적 파일이라 **무료 호스팅**만으로 배포됩니다.
⚠️ HTML이 절대경로(`/assets`, `/ko`)를 쓰므로 **도메인 루트에서 서비스하는 호스트**를 써야 합니다.
→ Cloudflare Pages / Vercel / Netlify ✅ · GitHub Pages 프로젝트 사이트 ❌(하위경로라 경로 깨짐)

- 배포 브랜치: **`main`** (아래 절차에 나오는 `claude/multi-app-landing-page-vsr0o9`는 최초 개발용
  브랜치였고, 이후 main으로 병합되어 지금은 main이 배포 기준)
- 빌드 과정 없음 · 출력 폴더 = 저장소 루트

---

## 방법 A. Cloudflare Pages (추천 — 대역폭 무제한)

1. https://dash.cloudflare.com 가입(무료) → 로그인
2. 좌측 **Workers & Pages** → **Create application** → **Pages** 탭 → **Connect to Git**
3. GitHub 계정 연결 → 저장소 **techa-drawer** 선택 (2026-07-28 이전엔 techa-automation이라는
   이름이었음 — Cloudflare에 이미 연결되어 있다면 이름 변경만으로는 안 끊기니 그대로 둬도 됨)
4. 설정 입력:
   - **Production branch**: `claude/multi-app-landing-page-vsr0o9`
   - **Framework preset**: `None`
   - **Build command**: (비움)
   - **Build output directory**: `/`  (루트)
5. **Save and Deploy** → 1~2분 뒤 `https://<프로젝트명>.pages.dev` 주소 생성
6. 이후 이 브랜치에 push할 때마다 자동 재배포

## 방법 B. Vercel

1. https://vercel.com 가입(GitHub 계정으로) → **Add New → Project**
2. **techa-drawer** 저장소 Import
3. Framework Preset: **Other** / Build & Output: 비움(정적)
4. Branch를 `claude/multi-app-landing-page-vsr0o9`로 지정 → **Deploy**
5. `https://<프로젝트명>.vercel.app` 생성

## 방법 C. Netlify

1. https://app.netlify.com 가입 → **Add new site → Import an existing project** → GitHub
2. **techa-drawer** 선택 → Branch: `claude/multi-app-landing-page-vsr0o9`
3. Build command: 비움 / **Publish directory**: `.`
4. **Deploy** → `https://<프로젝트명>.netlify.app` 생성

---

## 배포 후 할 일 (순서대로)

1. **접속 확인**: 생성된 `.pages.dev` 주소로 홈 + 10개 앱 정상 동작 확인
2. **Google Search Console** 등록
   - https://search.google.com/search-console → URL 접두어에 배포 주소 입력 → 소유권 확인
   - **Sitemaps**에 `sitemap.xml` 제출 → 색인 시작
3. **콘텐츠 더 쌓기**: 애드센스 승인률을 위해 앱 15~20개까지 확충 권장 (Wave 2)
4. **Google AdSense 신청**
   - https://adsense.google.com → 사이트 추가(배포 주소) → 심사
   - 승인 후 `assets/js/site.js`의 `renderAdSlots()` 자리에 광고 코드 삽입 + `<head>`에 스니펫
5. **(선택) 도메인 연결**: 도메인 구입(연 1~2만원) 후 호스트 대시보드에서 Custom domain 연결
   - 연결 후 `sitemap.xml`·canonical의 경로를 실제 도메인 절대주소로 갱신 권장

---

## 참고: main 브랜치 배포 (완료된 상태)
`claude/multi-app-landing-page-vsr0o9` 브랜치는 이미 main에 병합됐고, Cloudflare의 Production
branch도 `main`으로 전환 완료. 즉 지금은 **main = 실서비스**다.
