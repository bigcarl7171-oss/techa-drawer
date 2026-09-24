/* ===========================================================
   테차 유틸리티 — 공통 스크립트
   - 앱 레지스트리(홈/관련링크 공용)
   - 헤더/푸터/브레드크럼/광고슬롯 주입
   =========================================================== */
(function () {
  "use strict";

  // 사이트 기본 정보 (배포 시 도메인만 교체)
  var SITE = {
    name: "테차 꽃공방",
    tagline: "변치 않는 선물, 당신의 꽃 가게",
    base: "https://www.techa.kr",
    shopUrl: "https://mkt.shopping.naver.com/link/68d237dc713c156d9f530c28", // TECHA 선물샵 스토어 홈 (탄생화·탄생석 등에 선물 CTA 자동 노출)
    // ↑ 스마트스토어 주소가 아니라 판매자센터 발급 "마케팅링크"다 — 네이버쇼핑 매출연동수수료를
    //   피하려고 2026-09-18에 교체했다. smartstore.naver.com 주소를 다시 넣지 말 것.
    //   전체 링크 목록: data/store-links.json
    gaId: "G-SEQ155EHQ7", // GA4 측정 ID. 값을 채우면 전 페이지에서 자동으로 애널리틱스가 활성화됨
    coupangPartnersId: "AF354247" // 쿠팡 파트너스 ID. 아직 미사용 — 실제 상품 링크 삽입 시 이 값과 함께 필수 고지 문구를 넣을 것
  };

  // ---------- 앱 레지스트리 ----------
  // status: "live" | "soon"  /  cat: 카테고리 키
  var APPS = [
    { slug: "age-calculator", name: "만 나이 계산기", emoji: "🎂", cat: "date",
      desc: "생년월일로 만 나이·연 나이 계산", status: "live", path: "/ko/age-calculator/" },
    { slug: "dday", name: "D-Day 계산기", emoji: "📅", cat: "date",
      desc: "목표일까지 남은 날·100일·1000일", status: "live", path: "/ko/dday/" },
    { slug: "char-counter", name: "글자수 세기", emoji: "🔤", cat: "text",
      desc: "공백 포함/제외·바이트·단어수", status: "live", path: "/ko/char-counter/" },
    { slug: "lotto", name: "로또 번호 추첨기", emoji: "🎱", cat: "fun",
      desc: "1~45 랜덤 6개+보너스, 제외수 옵션", status: "live", path: "/ko/lotto/" },
    { slug: "ladder", name: "사다리 타기", emoji: "🪜", cat: "fun",
      desc: "내기·순서 정하기 랜덤 사다리", status: "live", path: "/ko/ladder/" },
    { slug: "menu-roulette", name: "오늘 뭐 먹지? 메뉴 룰렛", emoji: "🍽️", cat: "fun",
      desc: "메뉴 고민 끝, 랜덤 추천", status: "live", path: "/ko/menu-roulette/" },
    { slug: "dad-joke", name: "아재개그 뽑기", emoji: "🥸", cat: "fun",
      desc: "질문 보고 정답 맞히는 아재개그 + 아재력 테스트", status: "live", path: "/ko/dad-joke/" },
    { slug: "unit-converter", name: "단위 변환기", emoji: "📏", cat: "calc",
      desc: "길이·무게·넓이·온도 등 변환", status: "live", path: "/ko/unit-converter/" },
    { slug: "percent", name: "퍼센트 계산기", emoji: "％", cat: "calc",
      desc: "비율·증감률·할인 3종 계산", status: "live", path: "/ko/percent/" },
    { slug: "date-diff", name: "두 날짜 사이 일수", emoji: "🗓️", cat: "date",
      desc: "날짜 차이·주·개월·년 환산", status: "live", path: "/ko/date-diff/" },
    { slug: "workdays", name: "근무일수 계산기", emoji: "💼", cat: "date",
      desc: "주말·공휴일 제외 근무일 계산", status: "live", path: "/ko/workdays/" },
    { slug: "lunar-converter", name: "음력 양력 변환기", emoji: "🌙", cat: "date",
      desc: "한국 음력 기준 날짜 변환·윤달·간지", status: "live", path: "/ko/lunar-converter/" },
    { slug: "bmi", name: "BMI 계산기", emoji: "⚖️", cat: "health",
      desc: "체질량지수·비만도 확인", status: "live", path: "/ko/bmi/" },
    { slug: "loan", name: "대출 이자 계산기", emoji: "🏦", cat: "money",
      desc: "원리금균등·원금균등 상환", status: "live", path: "/ko/loan/" },
    { slug: "vat", name: "부가가치세 계산기", emoji: "🧾", cat: "money",
      desc: "공급가↔합계 부가세 계산", status: "live", path: "/ko/vat/" },
    { slug: "margin", name: "마진율 계산기", emoji: "📈", cat: "money",
      desc: "판매가·원가로 마진 계산", status: "live", path: "/ko/margin/" },
    { slug: "compound", name: "복리 계산기", emoji: "💹", cat: "money",
      desc: "복리·적립 미래가치·72법칙", status: "live", path: "/ko/compound/" },
    { slug: "name-match", name: "이름 궁합 테스트", emoji: "💞", cat: "fortune",
      desc: "두 사람 이름으로 보는 궁합", status: "live", path: "/ko/name-match/" },
    { slug: "horoscope", name: "오늘의 별자리 운세", emoji: "🔮", cat: "fortune",
      desc: "생일로 보는 오늘의 운세", status: "live", path: "/ko/horoscope/" },
    { slug: "zodiac-love", name: "별자리 궁합", emoji: "💘", cat: "fortune",
      desc: "두 별자리의 궁합 분석", status: "live", path: "/ko/zodiac-love/" },
    { slug: "birth-flower", name: "월별 탄생화·꽃말", emoji: "🌸", cat: "fortune",
      desc: "태어난 달의 꽃과 꽃말", status: "live", path: "/ko/birth-flower/" },
    { slug: "birth-stone", name: "월별 탄생석", emoji: "💎", cat: "fortune",
      desc: "태어난 달의 보석과 의미", status: "live", path: "/ko/birth-stone/" },
    { slug: "gift-finder", name: "상황별 선물 큐레이션", emoji: "🎁", cat: "life",
      desc: "받는 분·선물하는 날·원하는 느낌으로 테차 꽃 선물 추천", status: "live", path: "/ko/gift-finder/" }
  ];

  var CATS = {
    date:    { title: "날짜와 일정을 확인할 때", emoji: "📆" },
    calc:    { title: "헷갈리는 값을 바로 계산할 때", emoji: "🧮" },
    money:   { title: "돈과 비용을 계산할 때", emoji: "💰" },
    health:  { title: "간단한 건강 수치가 궁금할 때", emoji: "💪" },
    fortune: { title: "가볍게 의미와 재미를 찾을 때", emoji: "🔮" },
    text:    { title: "글을 확인하고 정리할 때", emoji: "✍️" },
    fun:     { title: "선택과 순서를 정하기 어려울 때", emoji: "🎲" },
    life:    { title: "선물을 준비할 때", emoji: "🏠" }
  };

  // ---------- 매거진 글 레지스트리 (홈 검색용) ----------
  // 이 배열은 scripts/build-posts.js 가 blog/index.html 의 카드에서 생성한다 — 직접 고치지 말 것.
  // 예전엔 "새 글 추가 시 이 배열과 카드를 함께 추가할 것"이라는 주석만 있었는데, 발행
  // 스크립트가 카드만 갱신해서 2026-08-12 이후 25편이 홈 검색에서 통째로 빠져 있었다.
  var POSTS = [
    { title: "비누꽃다발이란? 비누꽃으로 만드는 선물과 쓰임새 정리", emoji: "🧼",
      desc: "비누꽃다발의 정체와 세안 가능 여부, 비누꽃 상품 5가지와 실제 쓰임", path: "/blog/soap-flower-bouquet-guide/", date: "2026-09-24" },
    { title: "선물하면 안 되는 꽃, 근거 있는 금기와 나라별 관습", emoji: "💐",
      desc: "근거가 확인된 금기 두 가지와 나라마다 뜻이 바뀌는 꽃 관습을 나눠 정리했어요", path: "/blog/flower-gift-avoid-flowers/", date: "2026-09-22" },
    { title: "프리저브드 플라워란? 뜻과 장단점, 꽃다발 고르기 전에", emoji: "🌸",
      desc: "프리저브드 플라워의 뜻과 쓰임, 향·가격까지 알고 고르는 법", path: "/blog/preserved-flower-pros-cons/", date: "2026-09-21" },
    { title: "아내 생일 선물이 해마다 어려워지는 이유는 값이 아니었습니다", emoji: "🎀",
      desc: "아내 생일 선물이 해마다 어려워지는 이유와, 비교되지 않는 선물 고르는 법", path: "/blog/wife-birthday-gift/", date: "2026-09-20" },
    { title: "택배로 온 꽃다발이 멀쩡한 이유는 포장이 전부가 아닙니다", emoji: "📦",
      desc: "택배로 온 꽃이 멀쩡한 이유와 눌림을 막는 포장 방식", path: "/blog/flower-parcel-delivery/", date: "2026-09-19" },
    { title: "졸업식 꽃다발 비누꽃, 한 달 뒤 후기에 적혀 있는 것", emoji: "🎓",
      desc: "한 달 사용 후기로 확인한, 행사 뒤까지 생각해 꽃다발 고르는 기준", path: "/blog/graduation-bouquet-one-month-later/", date: "2026-09-18" },
    { title: "비누꽃다발·프리저브드 꽃다발 후기에서 가장 많이 나온 말", emoji: "💬",
      desc: "후기에서 많이 나온 표현과 아쉬움으로 남은 말을 비율로 정리했습니다", path: "/blog/flower-gift-review-analysis/", date: "2026-09-16" },
    { title: "노란장미 꽃말 뜻, 질투에서 우정이 되기까지", emoji: "🌼",
      desc: "노란 장미 꽃말이 우정과 질투로 갈린 사연과 받는 분별 고르는 법", path: "/blog/yellow-rose-meaning/", date: "2026-09-15" },
    { title: "추석 용돈 선물, 시들지 않는 꽃이라 미리 받아 두셔도 됩니다", emoji: "🌕",
      desc: "추석 용돈 선물, 미리 받아 두는 이유와 연휴 전 준비 순서", path: "/blog/chuseok-money-gift-prepare-early/", date: "2026-09-14" },
    { title: "승진 축하 이벤트, 요즘 사무실에서 하는 여섯 가지", emoji: "🎉",
      desc: "사무실에서 실제로 쓰는 승진 축하 방식 여섯 가지와, 방식에 맞춰 선물 고르는 순서", path: "/blog/promotion-gift-event-ideas/", date: "2026-09-12" },
    { title: "블랙앤화이트 장미 무드등, 색을 빼고 만들면서 더 따진 것들", emoji: "🌹",
      desc: "흑백 장미 무드등을 만든 이유와 소재, 전원·사이즈 고르는 기준", path: "/blog/black-white-rose-mood-lamp/", date: "2026-09-11" },
    { title: "비누꽃 한두 송이, 작다는 게 이 선물의 이유입니다", emoji: "🌹",
      desc: "한두 송이가 약소해 보일까 걱정될 때, 받는 쪽 부담까지 넣어 선물 크기를 정하는 법", path: "/blog/soap-flower-one-stem/", date: "2026-09-10" },
    { title: "승진 축하 선물, 그날 하루가 아니라 새 자리에 남는 것으로", emoji: "🎉",
      desc: "승진 축하 선물, 화환·꽃다발 대신 바뀐 사무실과 책상에 오래 남는 것을 고르는 기준", path: "/blog/promotion-congratulation-gift/", date: "2026-09-08" },
    { title: "환갑·칠순 부모님 생신, 현금 선물을 봉투보다 오래 남게 드리는 법", emoji: "🎂",
      desc: "봉투 대신 용돈케이크로 현금을 전하는 법과, 행사 뒤에도 무드등으로 남는 이유", path: "/blog/parents-birthday-money-cake/", date: "2026-09-07" },
    { title: "프리저브드 꽃다발이 생화보다 아담해 보이는 이유", emoji: "💐",
      desc: "프리저브드가 아담해 보이는 이유와 용도별 사이즈 고르는 기준", path: "/blog/preserved-flower-volume-guide/", date: "2026-09-03" },
    { title: "발표회·집들이·개업, 가을 선물은 경우마다 고르는 법이 달라요", emoji: "🍂",
      desc: "발표회·집들이·개업·그냥 안부, 경우마다 먼저 볼 것이 달라요", path: "/blog/autumn-flower-gift-offseason/", date: "2026-09-03" },
    { title: "하드웨어 엔지니어와 조소 전공자가 꽃집을 열었습니다", emoji: "🌿",
      desc: "전자공학과 조소, 두 사람이 나눠 맡은 자리가 상품에 남긴 것", path: "/blog/engineer-and-sculptor-flower-shop/", date: "2026-09-02" },
    { title: "아이 발표회 꽃다발, 얼굴 안 가리는 크기 확인해보세요", emoji: "🌸",
      desc: "발표회 사진에서 아이 얼굴 안 가리게, 꽃다발 폭·무게·색 고르는 기준", path: "/blog/kids-recital-bouquet-size-guide/", date: "2026-09-01" },
    { title: "텅 비어 있던 현관, 놓는 것 하나 거는 것 하나면 달라져요", emoji: "🚪",
      desc: "신발장 위와 빈 벽, 두 자리에 뭘 두면 좋은지", path: "/blog/entryway-mood-lamp-placement/", date: "2026-08-29" },
    { title: "퇴원 축하 선물, 병문안 선물이랑 똑같이 고르면 아쉬운 이유", emoji: "🎉",
      desc: "병문안 때 피했던 것들이 퇴원 축하 땐 오히려 잘 어울리는 이유예요", path: "/blog/hospital-discharge-gift/", date: "2026-08-27" },
    { title: "원룸 무드 조명, 이 자리에 놓으면 방 분위기가 달라져요", emoji: "💡",
      desc: "원룸 무드등, 협탁·책상·창가 중 어디에 어떤 색으로 두면 좋을지 정리했어요", path: "/blog/one-room-mood-lighting-placement/", date: "2026-08-26" },
    { title: "더운 날 꽃 선물, 망설여진다면 확인해보세요", emoji: "🌻",
      desc: "더위에도 꽃 선물이 안심되는 이유, 확인 기준 세 가지", path: "/blog/summer-flower-gift-check/", date: "2026-08-25" },
    { title: "병문안 꽃 고를 때 동백꽃을 피하는 이유", emoji: "🌺",
      desc: "병문안 꽃 고를 때 피해야 할 꽃과 확인하면 좋을 기준을 정리했어요", path: "/blog/camellia-hospital-visit-taboo/", date: "2026-08-24" },
    { title: "편의점 꽃다발, 급할 때 사도 될까요", emoji: "🌷",
      desc: "왜 빨리 시드는지, 그래도 사야 한다면 뭘 확인해야 하는지", path: "/blog/convenience-store-flower-emergency/", date: "2026-08-23" },
    { title: "회사 행사 꽃, 견적 받기 전에 확인해야 할 5가지", emoji: "🧾",
      desc: "최소 수량부터 세금계산서 발행·배송 범위까지 — 견적 요청 전 체크리스트", path: "/blog/corporate-flower-quote-checklist/", date: "2026-08-21" },
    { title: "기업 행사 꽃다발, 당일 아침에 준비하면 늦는 이유", emoji: "🏢",
      desc: "시상식·워크숍·창립기념일 단체 꽃다발은 당일이 아니라 미리 준비하는 것입니다", path: "/blog/corporate-event-bouquet-timing/", date: "2026-08-20" },
    { title: "졸업식 꽃다발, 유치원~대학교 아들·딸·조카별 고르는 법", emoji: "🎓",
      desc: "아이가 직접 드는 자리인지, 사진에 담기는 자리인지 — 대상과 학교급으로 나눠 정리했습니다", path: "/blog/graduation-gift-by-recipient/", date: "2026-08-19" },
    { title: "사진보다 실물이 낫다는 말을 자주 듣습니다", emoji: "📷",
      desc: "화면으로 보실 때 걱정하시는 방향과, 직접 보신 분들의 반응은 정반대였습니다", path: "/blog/flower-gift-better-than-photo/", date: "2026-08-18" },
    { title: "추석 용돈, 봉투 말고 뭘로 드릴까요", emoji: "🧧",
      desc: "상 위에 놓을지, 불을 켜고 축하할지, 손에 들려드릴지 — 명절 용돈 고르는 세 가지 방식", path: "/blog/chuseok-money-gift/", date: "2026-08-17" },
    { title: "돈꽃다발 후기를 처음부터 끝까지 읽었습니다", emoji: "💰",
      desc: "상자를 열던 날, 건네던 순간, 그리고 한참 뒤에도 남아 있는 꽃", path: "/blog/money-bouquet-customer-stories/", date: "2026-08-14" },
    { title: "학예회·발표회 꽃다발, 생화 대신 비누꽃을 고르는 이유", emoji: "💐",
      desc: "미리 사둘 수 있고, 옮기기 편하고, 사진에 아이 얼굴이 나오는 행사 꽃다발", path: "/blog/event-bouquet-soap-flower/", date: "2026-08-12" },
    { title: "집들이 선물, 화분 대신 해바라기 액자를 고르는 이유", emoji: "🌻",
      desc: "물·자리·인테리어, 집들이·개업 선물 고를 때 확인해볼 세 가지", path: "/blog/sunflower-frame-housewarming-gift/", date: "2026-08-11" },
    { title: "유리돔 무드등 고를 때, 사진으로는 알 수 없는 4가지", emoji: "🕯️",
      desc: "소등 상태·뒷면·전원·시간이 지난 뒤, 사진 밖에서 확인할 것들", path: "/blog/glass-dome-mood-lamp-review/", date: "2026-08-10" },
    { title: "슬픈 꽃말을 가진 꽃들, 알고 나면 더 애틋해지는 이야기", emoji: "🥀",
      desc: "아네모네, 히아신스, 금잔화, 라일락에 담긴 슬픈 꽃말과 그 사연", path: "/blog/sad-flower-meanings/", date: "2026-08-08" },
    { title: "배송이 무사히 도착했다는 그 한 줄이, 왜 저희에겐 가장 큰 안심일까요", emoji: "📦",
      desc: "\"무사히 도착했고 예쁘다\"는 후기 한 줄에 공방이 유독 기뻐하는 이유", path: "/blog/safe-delivery-review/", date: "2026-08-02" },
    { title: "프리저브드 꽃, 조화 아니야? 사실은 진짜 생화입니다", emoji: "🌹",
      desc: "조화와 뭐가 다른지, 어떻게 시들지 않는지 정리했습니다", path: "/blog/preserved-flower-real-flower/", date: "2026-07-29" },
    { title: "한여름 생화, 유독 빨리 시드는 이유와 오래 보는 법", emoji: "🌸",
      desc: "줄기 손질, 물 교체 주기 등 여름철 생화 관리 팁 5가지", path: "/blog/summer-fresh-flower-care/", date: "2026-07-28" }
  ];

  // ---------- 헤더 주입 ----------
  // 모든 페이지(도구·매거진·안내)가 이 함수 하나를 공유한다.
  // 검색을 여기 넣으면 "도구 페이지에서 다른 도구로 가려면 홈으로 돌아가야
  // 한다"는 문제가 파일 21개를 각각 고치지 않고도 한 번에 풀린다.
  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    el.className = "site-header";
    // 정적 HTML이 이전 버전이어도 방문자에게는 항상 최신 공통 메뉴를 보여준다.
    // build-chrome.js가 정적 마크업을 동기화하고, 이 코드는 배포 중 누락된 페이지를 보완한다.
    // build-chrome.js 의 headerMarkup 과 같은 마크업 (2026-09-22 메인 개편)
    el.innerHTML =
      '<div class="wrap">' +
      '  <a class="brand-lock" href="/" aria-label="테차 꽃공방 홈"><img src="/assets/icons/techa-logo.png" alt="techa" width="71" height="22"><span>테차 꽃공방</span></a>' +
      '  <nav class="header-nav" aria-label="주요 메뉴"><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a><a href="/blog/">테차 매거진</a><a href="/space/">공간 스타일링</a><a href="/contact/">기업·단체 주문</a></nav>' +
      '  <div class="header-search">' +
      '    <button type="button" class="header-search-toggle" id="header-search-toggle" aria-label="도구·매거진 검색" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>' +
      '    <div class="header-search-panel" id="header-search-panel">' +
      '      <input type="text" id="header-search-input" placeholder="도구·매거진 검색..." autocomplete="off">' +
      '      <div class="header-search-results" id="header-search-results"></div>' +
      '    </div>' +
      '  </div>' +
      '  <a class="header-shop-link" href="' + SITE.shopUrl + '" target="_blank" rel="noopener">스마트스토어 <span aria-hidden="true">↗</span></a>' +
      '  <details class="header-menu"><summary><span class="header-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="header-menu-label">메뉴</span></summary><nav aria-label="전체 메뉴"><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a><a href="/blog/">테차 매거진</a><a href="/space/">공간 스타일링</a><a href="/contact/">기업·단체 주문</a><a href="/about/">테차 소개</a><a href="/care/">꽃 관리법</a></nav></details>' +
      '</div>';
    initHeaderSearch();
  }

  // ---------- 헤더 검색 (모든 페이지 공용) ----------
  function initHeaderSearch() {
    var toggle = document.getElementById("header-search-toggle");
    var panel = document.getElementById("header-search-panel");
    var input = document.getElementById("header-search-input");
    var results = document.getElementById("header-search-results");
    if (!toggle || !panel || !input || !results) return;

    var liveApps = APPS.filter(function (a) { return a.status === "live"; });
    var index = liveApps.map(function (a) {
      return { emoji: a.emoji, title: a.name, desc: a.desc, path: a.path, tag: CATS[a.cat] ? CATS[a.cat].title : "" };
    }).concat(POSTS.map(function (p) {
      return { emoji: p.emoji, title: p.title, desc: p.desc, path: p.path, tag: "매거진" };
    }));

    fetch("/assets/data/search-index.json").then(function (r) {
      return r.ok ? r.json() : [];
    }).then(function (data) {
      if (data.length) index = data;
    }).catch(function () { /* 생성 인덱스가 없어도 기존 APPS·POSTS 검색은 계속 동작 */ });

    function open() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      input.focus();
    }
    function close() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    function render(q) {
      if (!q) { results.innerHTML = ""; return; }
      var matches = index.filter(function (item) {
        return (item.title + " " + item.desc).toLowerCase().replace(/\s+/g, "").indexOf(q) > -1;
      });
      if (!matches.length) {
        results.innerHTML = '<div class="header-search-empty">해당하는 결과가 없어요</div>';
        return;
      }
      results.innerHTML = matches.slice(0, 8).map(function (item) {
        return '<a class="header-search-result" href="' + item.path + '">' +
          '<span class="header-search-result-emoji">' + item.emoji + '</span>' +
          '<div class="header-search-result-info">' +
            '<div class="header-search-result-name">' + item.title + '</div>' +
            '<div class="header-search-result-desc">' + item.desc + '</div>' +
          '</div>' +
        '</a>';
      }).join("");
    }

    toggle.addEventListener("click", function () {
      panel.classList.contains("is-open") ? close() : open();
    });
    input.addEventListener("input", function (e) {
      render(e.target.value.trim().toLowerCase().replace(/\s+/g, ""));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".header-search")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  // ---------- 브레드크럼 + 페이지 헤드 ----------
  // opts: { title, desc, category }
  function renderPageHead(opts) {
    var el = document.getElementById("page-head");
    if (!el) return;
    if (el.children.length) return; // build-chrome.js 가 찍어 둔 정적 제목·브레드크럼
    var cat = CATS[opts.category];
    var crumb = '<a href="/">홈</a> › ' +
      (cat ? '<a href="/#cat-' + opts.category + '">' + cat.title + '</a> › ' : '') +
      '<span>' + opts.title + '</span>';
    el.innerHTML =
      '<div class="wrap">' +
      '  <div class="breadcrumb">' + crumb + '</div>' +
      '  <div class="page-head"><h1>' + opts.title + '</h1>' +
      (opts.desc ? '<p class="lead">' + opts.desc + '</p>' : '') + '</div>' +
      '</div>';
  }

  // ---------- 광고 슬롯 ----------
  // AdSense 승인 후 아래 자리에 광고 코드 삽입
  function renderAdSlots() {
    var slots = document.querySelectorAll(".ad-slot");
    slots.forEach(function (s) {
      if (!s.innerHTML.trim()) s.style.display = "none"; // 애드센스 보류 중 — 빈 자리 문구 대신 완전히 숨김
      /* AdSense 예시:
         <ins class="adsbygoogle" style="display:block"
              data-ad-client="ca-pub-XXXX" data-ad-slot="YYYY"
              data-ad-format="auto" data-full-width-responsive="true"></ins> */
    });
  }

  // ---------- 관련 앱(내부 링크) ----------
  // slugs: 표시할 앱 slug 배열 (없으면 같은 카테고리 자동)
  // 이 블록은 scripts/build-related.js 가 HTML에 미리 구워 넣는다 — 크롤러가 도구
  // 사이를 오갈 수 있어야 하기 때문이다(JS로만 그리던 동안 도구 15개가 피링크 1개짜리로
  // 남았고 색인에도 거의 안 잡혔다). 여기서는 비어 있을 때만 폴백으로 그린다.
  function renderRelated(currentSlug, category, slugs) {
    var el = document.getElementById("related");
    if (!el) return;
    if (el.querySelector(".related-list")) return;
    var list = slugs
      ? slugs.map(function (sg) { return byslug(sg); }).filter(Boolean)
      : APPS.filter(function (a) { return a.cat === category && a.slug !== currentSlug; });
    if (!list.length) { el.innerHTML = ""; return; }
    el.className = "related";
    el.innerHTML = '<h2>관련 도구</h2><div class="related-list">' +
      list.map(function (a) {
        return '<a href="' + a.path + '">' + a.emoji + " " + a.name + "</a>";
      }).join("") + "</div>";
  }

  // ---------- 푸터 주입 ----------
  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    // 정적 HTML이 이전 버전이어도 최신 서비스 링크와 연도를 일관되게 보여준다.
    el.innerHTML =
      '<div class="wrap">' +
      '  <a href="/">홈</a><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a><a href="/space/">공간 스타일링·구독</a><a href="/contact/">기업·단체 주문</a><a href="/about/">테차 소개</a><a href="/blog/">테차 매거진</a><a href="/care/">꽃 관리법</a><a href="/ko/">일상 도구</a>' +
      '  <a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a>' +
      // 계산 결과 안내는 도구 페이지(/ko/)에만 — scripts/build-chrome.js 와 같은 조건 (2026-09-22)
      '  <div class="disclaimer">' +
      (location.pathname.indexOf('/ko/') === 0 ? '본 사이트의 계산 결과는 참고용이며, 정확한 판단이 필요한 경우 전문가·공식기관에 확인하세요. ' : '') +
      '© ' + new Date().getFullYear() + " 테차 꽃공방</div>" +
      '</div>';
  }

  function byslug(sg) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].slug === sg) return APPS[i];
    return null;
  }

  // ---------- 홈 그리드 ----------
  function renderHome() {
    var el = document.getElementById("home-grid");
    if (!el) return;
    var html = "";
    Object.keys(CATS).forEach(function (key) {
      var apps = APPS.filter(function (a) { return a.cat === key; });
      if (!apps.length) return;
      html += '<h2 class="cat-title" id="' + key + '">' + CATS[key].emoji + " " + CATS[key].title + "</h2>";
      html += '<div class="grid">';
      apps.forEach(function (a) {
        var soon = a.status !== "live";
        html += '<a class="app-card' + (soon ? " soon" : "") + '" href="' + (soon ? "#" : a.path) + '">' +
          '<div class="emoji">' + a.emoji + "</div>" +
          '<div class="name">' + a.name + "</div>" +
          '<div class="desc">' + a.desc + "</div></a>";
      });
      html += "</div>";
    });
    el.innerHTML = html;
  }

  // ---------- Google Analytics (GA4) — SITE.gaId 설정 시에만 활성화 ----------
  function initAnalytics() {
    if (!SITE.gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + SITE.gaId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", SITE.gaId);
    window.gtag = gtag;
  }

  // ---------- 이벤트 기록 ----------
  // GA4가 꺼져 있거나 광고차단으로 안 뜬 경우에도 조용히 넘어간다.
  // 쓰는 이벤트:
  //   situation_click   상황 카드 클릭        { situation }
  //   care_view         관리법 조회           { product }
  //   news_signup_click 알림받기 유도 클릭    { situation }
  //   shop_click        스마트스토어 이동     { placement }
  //   gift_finder_filter        선물 큐레이션 필터 변경   { recipient, occasion, price }
  //   gift_finder_product_click 선물 큐레이션 구매 링크 클릭 { line }
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e) { /* 측정 실패가 기능을 막지 않도록 무시 */ }
  }

  // ---------- 공통 초기화 ----------
  function initPage(opts) {
    opts = opts || {};
    initAnalytics();
    renderHeader();
    if (opts.title) renderPageHead(opts);
    renderAdSlots();
    renderShopCTA();
    if (opts.share) renderShare(opts.share);
    if (opts.slug) renderRelated(opts.slug, opts.category, opts.related);
    renderFooter();
  }

  // ---------- 결과 공유 버튼 ----------
  // opts.share = 결과 요소 선택자(예: "#result"). 해당 요소 바로 뒤에 공유 버튼 삽입.
  function renderShare(sel) {
    if (typeof sel !== "string") sel = "#result";
    var el = document.querySelector(sel);
    if (!el) return;
    var btn = document.createElement("button");
    btn.className = "btn btn-ghost btn-sm";
    btn.type = "button";
    btn.textContent = "🔗 결과 공유하기";
    btn.style.marginTop = "12px";
    btn.addEventListener("click", function () {
      var resultText = (el.textContent || "").replace(/\s+/g, " ").trim();
      var title = (document.title.split(":")[0] || "테차 꽃공방").trim();
      var url = location.href;
      var text = (resultText ? resultText + "\n" : "") + title + " | 테차 꽃공방";
      if (navigator.share) {
        navigator.share({ title: title, text: text, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text + "\n" + url);
        var t = btn.textContent; btn.textContent = "링크가 복사됐어요!";
        setTimeout(function () { btn.textContent = t; }, 1600);
      }
    });
    el.parentNode.insertBefore(btn, el.nextSibling);
  }

  // ---------- TECHA 선물샵 CTA (탄생화·탄생석 등) ----------
  // 페이지에 <div id="techa-cta" data-text="..."></div> 가 있으면 채움
  // data-href/data-label 을 지정하면 스토어 대신 그 링크로 보낸다(예: B2B 글 -> /contact/).
  // 지정 안 하면 기존 그대로 스마트스토어 링크 + "테차 꽃 선물 보러가기 →".
  function renderShopCTA() {
    var el = document.getElementById("techa-cta");
    if (!el) return;
    var text = el.getAttribute("data-text") || "이 감성을 담은 프리저브드 플라워 선물, 테차에서 만나보세요";
    var overrideHref = el.getAttribute("data-href");
    var href = overrideHref || SITE.shopUrl;
    var label = el.getAttribute("data-label") || "테차 꽃 선물 보러가기 →";
    var base = 'margin:22px 0;padding:18px 20px;border-radius:var(--radius-md);background:var(--amber-soft);border:1px solid var(--amber-border);';
    if (href) {
      var targetAttr = overrideHref ? "" : ' target="_blank" rel="noopener"';
      el.innerHTML = '<div style="' + base + '">' +
        '<div style="font-weight:700;color:var(--amber-strong-ink);margin-bottom:10px">🌸 ' + text + '</div>' +
        '<a class="btn btn-primary btn-sm" href="' + href + '"' + targetAttr + '>' + label + '</a></div>';
      // 어느 페이지의 CTA가 실제로 스토어/문의로 보내는지 측정
      // 오버라이드 링크는 스토어 이동이 아니므로 shop_click 이 아니라 contact_click 으로 구분한다
      // shop_click은 스토어 이동 전용 이벤트이므로 문의 이동과 섞지 않는다.
      var link = el.querySelector("a");
      if (link) link.addEventListener("click", function () {
        track(overrideHref ? "contact_click" : "shop_click", { placement: document.body.dataset.placement || location.pathname });
      });
    } else {
      el.innerHTML = '<div style="' + base + 'opacity:.85">' +
        '<div style="font-weight:700;color:var(--amber-strong-ink)">🌸 ' + text + '</div>' +
        '<div style="font-size:13px;color:var(--amber-muted-ink);margin-top:4px">테차 선물샵 연결 준비중</div></div>';
    }
  }

  window.TECHA = {
    SITE: SITE, APPS: APPS, CATS: CATS, POSTS: POSTS,
    initPage: initPage, renderHome: renderHome, renderShopCTA: renderShopCTA,
    track: track
  };
})();
