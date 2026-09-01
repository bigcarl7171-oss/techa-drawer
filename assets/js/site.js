/* ===========================================================
   테차 유틸리티 — 공통 스크립트
   - 앱 레지스트리(홈/관련링크 공용)
   - 헤더/푸터/브레드크럼/광고슬롯 주입
   =========================================================== */
(function () {
  "use strict";

  // 사이트 기본 정보 (배포 시 도메인만 교체)
  var SITE = {
    name: "테차 서랍",
    tagline: "필요한 순간 바로 꺼내 쓰는 생활 도구 서랍",
    base: "https://www.techa.kr",
    shopUrl: "https://smartstore.naver.com/itecha", // TECHA 선물샵 (탄생화·탄생석 등에 선물 CTA 자동 노출)
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
      desc: "누구에게·어떤 상황·얼마짜리 고르면 딱 맞는 선물 추천", status: "live", path: "/ko/gift-finder/" }
  ];

  var CATS = {
    date:    { title: "날짜·시간", emoji: "📆" },
    calc:    { title: "계산·변환", emoji: "🧮" },
    money:   { title: "금융·재테크", emoji: "💰" },
    health:  { title: "건강", emoji: "💪" },
    fortune: { title: "운세·감성", emoji: "🔮" },
    text:    { title: "텍스트 도구", emoji: "✍️" },
    fun:     { title: "재미·추첨", emoji: "🎲" },
    life:    { title: "생활", emoji: "🏠" }
  };

  // ---------- 매거진 글 레지스트리 (홈 검색용) ----------
  // 새 글 추가 시 이 배열과 blog/index.html의 카드를 함께 추가할 것
  var POSTS = [
    { title: "학예회·발표회 꽃다발, 생화 대신 비누꽃을 고르는 이유", emoji: "💐",
      desc: "미리 사둘 수 있고, 옮기기 편하고, 사진에 아이 얼굴이 나오는 행사 꽃다발", path: "/blog/event-bouquet-soap-flower/", date: "2026-08-12" },
    { title: "집들이 선물, 화분 대신 해바라기 액자를 고르는 이유", emoji: "🌻",
      desc: "물·자리·인테리어, 집들이·개업 선물 고를 때 확인해볼 세 가지", path: "/blog/sunflower-frame-housewarming-gift/", date: "2026-08-11" },
    { title: "유리돔 무드등 고를 때, 사진으로는 알 수 없는 4가지", emoji: "🕯️",
      desc: "온라인으로 고를 때 사진만으로는 확인하기 어려운 네 가지 기준을 정리했습니다", path: "/blog/glass-dome-mood-lamp-review/", date: "2026-08-10" },
    { title: "슬픈 꽃말을 가진 꽃들, 알고 나면 더 애틋해지는 이야기", emoji: "🥀",
      desc: "아네모네, 히아신스, 금잔화, 라일락에 담긴 슬픈 꽃말과 그 사연을 정리했어요", path: "/blog/sad-flower-meanings/", date: "2026-08-08" },
    { title: "배송이 무사히 도착했다는 그 한 줄이, 왜 저희에겐 가장 큰 안심일까요", emoji: "📦",
      desc: "\"무사히 도착했고 예쁘다\"는 짧은 리뷰 한 줄에 공방이 유독 기뻐하는 이유를 담았어요", path: "/blog/safe-delivery-review/", date: "2026-08-02" },
    { title: "프리저브드 꽃, 조화 아니야? 사실은 진짜 생화입니다", emoji: "🌹",
      desc: "조화와 뭐가 다른지, 어떻게 시들지 않는지 정리했습니다", path: "/blog/preserved-flower-real-flower/", date: "2026-07-29" },
    { title: "한여름 생화, 유독 빨리 시드는 이유와 오래 보는 법", emoji: "🌸",
      desc: "줄기 손질, 물 교체 주기 등 여름철 생화 관리 팁 5가지", path: "/blog/summer-fresh-flower-care/", date: "2026-07-28" }
  ];

  // ---------- 헤더 주입 ----------
  // 모든 페이지(도구 21개·매거진·안내)가 이 함수 하나를 공유한다.
  // 검색을 여기 넣으면 "도구 페이지에서 다른 도구로 가려면 홈으로 돌아가야
  // 한다"는 문제가 파일 21개를 각각 고치지 않고도 한 번에 풀린다.
  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    el.className = "site-header";
    el.innerHTML =
      '<div class="wrap">' +
      '  <a class="logo" href="/">테<b>차</b> 서랍</a>' +
      '  <div class="header-search">' +
      '    <button type="button" class="header-search-toggle" id="header-search-toggle" aria-label="도구·매거진 검색" aria-expanded="false">🔍</button>' +
      '    <div class="header-search-panel" id="header-search-panel">' +
      '      <input type="text" id="header-search-input" placeholder="도구·매거진 검색..." autocomplete="off">' +
      '      <div class="header-search-results" id="header-search-results"></div>' +
      '    </div>' +
      '  </div>' +
      '  <nav class="header-nav"><a href="/blog/">테차 매거진</a><a href="/">전체 도구</a></nav>' +
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
  function renderRelated(currentSlug, category, slugs) {
    var el = document.getElementById("related");
    if (!el) return;
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
    el.innerHTML =
      '<div class="wrap">' +
      '  <a href="/">홈</a><a href="/about/">사이트 소개</a><a href="/contact/">문의하기</a>' +
      '  <a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a>' +
      '  <div class="disclaimer">본 사이트의 계산 결과는 참고용이며, 정확한 판단이 필요한 경우 전문가·공식기관에 확인하세요. © ' +
      new Date().getFullYear() + " 테차 서랍</div>" +
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
      var title = (document.title.split(":")[0] || "테차 서랍").trim();
      var url = location.href;
      var text = (resultText ? resultText + "\n" : "") + title + " | 테차 서랍";
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
      // (shop_click 은 GA에 "스마트스토어 이동"으로 문서화된 주요 이벤트라 섞으면 안 됨 — docs/techa-kr-funnel.md)
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
