#!/usr/bin/env node
/**
 * 사이트 공통 껍데기(헤더·브레드크럼/제목·푸터)를 정적 HTML로 찍는다.
 *
 * 왜 만들었나 — 2026-09-20 구조 점검에서 나온 것:
 *   · 65개 중 61개 페이지에 정적 <h1> 이 아예 없었다. 크롤러는 제목 없는 페이지를 봤다
 *   · 헤더·푸터가 전부 site.js 주입이라 사이트 전역 링크 11개가 소스에 없었다.
 *     그 결과 /contact/(B2B, 정의 문서 ③순위)로 가는 정적 링크가 65쪽 중 2쪽뿐이었다
 *   · 페이지당 정적 나가는 링크 중앙값이 2개였다
 * 도구 목록·관련 도구·상품 CTA 를 정적으로 바꾼 것과 같은 병이고, 이게 마지막 하나다.
 *
 * 단일 출처는 그대로 둔다:
 *   · 페이지 제목·설명·카테고리 → 각 페이지의 initPage({ title, desc, category })
 *   · 스토어 마케팅링크         → assets/js/site.js 의 SITE.shopUrl
 *   · 카테고리 이름             → site.js 의 CATS
 *
 * site.js 는 이 마크업이 이미 있으면 다시 그리지 않는다(헤더 검색 동작만 붙인다).
 *
 * 사용: node scripts/build-chrome.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, readRegistry, esc, eolOf, toEol } = require('./lib/site-registry');

const HEADER_BEGIN = '<!-- BEGIN site-header (생성: scripts/build-chrome.js — 직접 고치지 말 것) -->';
const HEADER_END = '<!-- END site-header -->';
const HEAD_BEGIN = '<!-- BEGIN page-head (생성: scripts/build-chrome.js — 직접 고치지 말 것) -->';
const HEAD_END = '<!-- END page-head -->';
const FOOTER_BEGIN = '<!-- BEGIN site-footer (생성: scripts/build-chrome.js — 직접 고치지 말 것) -->';
const FOOTER_END = '<!-- END site-footer -->';
const BIZ_BEGIN = '<!-- BEGIN business-schema (생성: scripts/build-chrome.js — 직접 고치지 말 것) -->';
const BIZ_END = '<!-- END business-schema -->';

// 2026-10-04 AI 검색 대응: 업체 정보를 기계가 읽는 형태로 둔다.
// 그전엔 홈에 WebSite 스키마만 있고 about·contact 엔 스키마가 없어서, 검색엔진·AI가
// "고양 덕양구의 꽃공방"이라는 사실을 본문 텍스트에서 추측해야 했다.
// 값의 출처는 아래 footerMarkup() 의 사업자·연락처 정보다 — 한쪽을 고치면 다른 쪽도 고친다.
// 영업시간은 확정 전이라 넣지 않았다(푸터의 09:00–18:00 은 상담 시간이다).
const BIZ_PAGES = ['index.html', 'about/index.html', 'contact/index.html'];
const BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  '@id': 'https://www.techa.kr/#business',
  name: '테차 꽃공방',
  // TECHA 는 꽃(테차 꽃공방)과 차(TECHA Tea, techa.co.kr)를 묶는 모브랜드다 (2026-10-04,
  // docs/TECHA_MASTER_HANDOFF_CLAUDE_2026-09-30.md §1). 그래서 'TECHA'·'테차' 단독을 꽃공방의
  // 다른 이름으로 두지 않고, 사업자등록 상호는 legalName, 모브랜드는 parentOrganization 으로 둔다.
  alternateName: ['테차꽃공방', 'TECHA 꽃 공방', '테차 꽃공방(TECHA)', 'TECHA Flower', 'techaflower'],
  legalName: '테차(TECHA)',
  parentOrganization: { '@id': 'https://www.techa.kr/#organization' },
  description: '경기도 고양시 덕양구의 꽃공방. 프리저브드 플라워·비누꽃 무드등·글라스돔 같은 시들지 않는 꽃 선물과 기업·학교·기관 단체 납품, 플라워 클래스를 운영합니다.',
  url: 'https://www.techa.kr/',
  logo: 'https://www.techa.kr/assets/icons/icon-512.png',
  image: 'https://www.techa.kr/blog/preserved-flower-volume-guide/cover.jpg',
  telephone: '+82-31-817-3147',
  email: 'bigcarl@naver.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '은빛로 53 코스미온빌 301호',
    addressLocality: '고양시 덕양구',
    addressRegion: '경기도',
    addressCountry: 'KR'
  },
  areaServed: [{ '@type': 'City', name: '고양시' }, { '@type': 'Country', name: '대한민국' }],
  knowsAbout: ['프리저브드 플라워', '비누꽃', '꽃 무드등', '글라스돔 꽃', '단체 꽃다발 납품', '플라워 클래스'],
  sameAs: [
    'https://www.instagram.com/techa_flower/',
    'https://www.youtube.com/@%ED%94%84%EB%A6%AC%EC%A0%80%EB%B8%8C%EB%93%9C%EA%BD%83%EB%8B%A4%EB%B0%9C',
    'https://www.facebook.com/techagongbang/',
    'https://m.place.naver.com/place/1694681698/home'
  ]
};

// 2026-10-06 사장님 결정: 차 사이트가 자랄 때까지는 "테차 = 꽃공방"으로 먼저 알린다.
// 그래서 모브랜드 TECHA 의 본거지(@id)를 techa.kr 에 두고, '테차'·'techa' 단독 이름은 여기에만 준다.
// techa.co.kr 은 'TECHA Tea'(테차티)로만 부르고 parentOrganization 으로 이 @id 를 가리킨다.
// 차 사이트가 커지면 그때 이 구조를 다시 정한다.
const ORGANIZATION = {
  '@type': 'Organization',
  '@id': 'https://www.techa.kr/#organization',
  name: 'TECHA',
  alternateName: ['테차', 'techa', '테차 꽃공방', '테차꽃공방', 'TECHA Flower', 'techaflower'],
  description: '경기도 고양시 덕양구에서 프리저브드플라워와 비누꽃 선물을 만드는 꽃공방 브랜드. 차 지식·생활문화 공간 TECHA Tea를 함께 운영합니다.',
  url: 'https://www.techa.kr/',
  logo: 'https://www.techa.kr/assets/icons/icon-512.png',
  sameAs: BUSINESS.sameAs,
  subOrganization: [
    { '@id': 'https://www.techa.kr/#business' },
    { '@type': 'Organization', '@id': 'https://techa.co.kr/#organization', name: 'TECHA Tea', alternateName: '테차티', url: 'https://techa.co.kr/' }
  ]
};

function businessMarkup() {
  const { '@context': ctx, ...business } = BUSINESS;
  return [
    BIZ_BEGIN,
    '<script type="application/ld+json">',
    JSON.stringify({ '@context': ctx, '@graph': [ORGANIZATION, business] }, null, 2),
    '</script>',
    BIZ_END
  ].join('\n');
}

// 첫 실행에는 </head> 바로 앞에 넣고, 그다음부터는 주석 사이만 갈아끼운다.
function fillBusiness(html, eol) {
  const b = html.indexOf(BIZ_BEGIN);
  if (b !== -1) {
    const e = html.indexOf(BIZ_END, b);
    if (e === -1) return { html, found: false };
    return { html: html.slice(0, b) + toEol(businessMarkup(), eol) + html.slice(e + BIZ_END.length), found: true };
  }
  const h = html.indexOf('</head>');
  if (h === -1) return { html, found: false };
  return { html: html.slice(0, h) + toEol(businessMarkup() + '\n', eol) + html.slice(h), found: true };
}

// initPage({ ... }) 에서 제목·설명·카테고리를 읽는다 (build-related.js 와 같은 방식).
function readPageOpts(html) {
  const m = html.match(/TECHA\.initPage\(\s*\{([\s\S]*?)\}\s*\)/);
  if (!m) return null;
  const body = m[1];
  const str = (k) => {
    const mm = body.match(new RegExp(k + '\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    return mm ? mm[1] : null;
  };
  return { title: str('title'), desc: str('desc'), category: str('category') };
}

function headerMarkup(shopUrl) {
  return [
    HEADER_BEGIN,
    '  <div class="wrap">',
    // 2026-09-22 메인 개편: 영문 로고 위 · 한글 이름 아래 한 덩어리, 메뉴 5개, 검색, 스토어, 휴대폰 메뉴 (docs/DESIGN-kkotgongbang.md)
    '    <a class="brand-lock" href="/" aria-label="TECHA 꽃 공방 홈"><img src="/assets/icons/techa-wordmark.png" alt="TECHA" width="287" height="90"><span class="brand-descriptor">꽃 공방</span></a>',
    '    <nav class="header-nav" aria-label="주요 메뉴"><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a><a href="/blog/">매거진</a><a href="/space/">공간 스타일링</a><a href="/contact/">기업·단체 주문</a><a href="/about/">공방 소개·방문</a></nav>',
    '    <div class="header-search">',
    '      <button type="button" class="header-search-toggle" id="header-search-toggle" aria-label="도구·매거진 검색" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>',
    '      <div class="header-search-panel" id="header-search-panel">',
    '        <input type="text" id="header-search-input" placeholder="도구·매거진 검색..." autocomplete="off">',
    '        <div class="header-search-results" id="header-search-results"></div>',
    '      </div>',
    '    </div>',
    '    <a class="header-shop-link" href="' + esc(shopUrl) + '" target="_blank" rel="noopener">스마트스토어 <span aria-hidden="true">↗</span></a>',
    '    <details class="header-menu"><summary><span class="header-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="header-menu-label">메뉴</span></summary><nav aria-label="전체 메뉴"><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a><a href="/blog/">매거진</a><a href="/space/">공간 스타일링</a><a href="/contact/">기업·단체 주문</a><a href="/about/">공방 소개·방문</a><a href="/care/">꽃 관리법</a></nav></details>',
    '  </div>',
    '  ' + HEADER_END
  ].join('\n');
}

// 2026-09-27 푸터 개편: 채널·상담·공방·기업 주문·사업자 정보를 정적으로 둔다.
// 사업자 정보(전자상거래법 표시 의무)의 출처는 사장님이 준 techa-main-october.html 이다.
// site.js 의 footerHtml() 이 같은 마크업을 갖고 있다 — 한쪽을 고치면 다른 쪽도 고친다.
function footerMarkup(isTool, shopUrl) {
  return [
    FOOTER_BEGIN,
    '  <div class="wrap">',
    '    <div class="sf-brand">',
    '      <div><p class="sf-logo"><img src="/assets/icons/techa-wordmark.png" alt="TECHA" width="287" height="90"><span class="brand-descriptor">꽃 공방</span></p>' +
      '<p class="sf-tagline">시들지 않는 꽃으로 오래 남는 마음을 전합니다.</p><p class="sf-brand-family">테차(TECHA)는 고양시 덕양구에서 시들지 않는 꽃 선물을 만드는 꽃공방 브랜드입니다. 차 이야기는 <a href="https://techa.co.kr/" target="_blank" rel="noopener">TECHA Tea ↗</a>에서 나눕니다.</p></div>',
    '      <nav class="sf-sns" aria-label="테차 채널">' +
      '<a href="https://www.instagram.com/techa_flower/" target="_blank" rel="noopener">인스타그램</a>' +
      '<a href="https://talk.naver.com/W4GQDO" target="_blank" rel="noopener">네이버 톡톡 상담</a>' +
      '<a href="https://www.youtube.com/@%ED%94%84%EB%A6%AC%EC%A0%80%EB%B8%8C%EB%93%9C%EA%BD%83%EB%8B%A4%EB%B0%9C" target="_blank" rel="noopener">유튜브</a>' +
      '<a href="https://www.facebook.com/techagongbang/" target="_blank" rel="noopener">페이스북</a>' +
      '<a href="' + esc(shopUrl) + '" target="_blank" rel="noopener">스마트스토어 <span aria-hidden="true">↗</span></a></nav>',
    '    </div>',
    '    <div class="sf-cols">',
    '      <div><p class="sf-h">고객 상담</p><p><a class="sf-big" href="tel:031-817-3147">031-817-3147</a><br>상담 시간 09:00 – 18:00<br>' +
      '<a href="https://talk.naver.com/W4GQDO" target="_blank" rel="noopener">네이버 톡톡으로 문의하기 →</a></p></div>',
    '      <div><p class="sf-h">공방 방문 · 방문 수령</p><p>경기도 고양시 덕양구 은빛로 53<br>코스미온빌 301호<br>맞춤 제작 상담과 플라워 클래스도 공방에서 함께합니다.</p></div>',
    '      <div><p class="sf-h">기업·단체 주문</p><p>10개부터 수백 개까지 목적과 예산에 맞춰 제작합니다.<br>행사일 일주일 전까지 문의해 주세요.</p>' +
      '<a class="sf-cta" href="/contact/#contact-form">단체 주문 상담하기 →</a></div>',
    '    </div>',
    '    <nav class="sf-nav" aria-label="사이트 메뉴"><a href="/">홈</a><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a>' +
      '<a href="/space/">공간 스타일링·구독</a><a href="/contact/">기업·단체 주문</a><a href="/about/">공방 소개·방문</a>' +
      '<a href="/blog/">테차 매거진</a><a href="/care/">꽃 관리법</a><a href="/ko/">일상 도구</a></nav>',
    '    <div class="sf-biz">',
    '      <p><span>상호 테차(TECHA)</span><span>대표 임광진</span><span>사업자등록번호 196-01-02121</span></p>',
    '      <p><span>통신판매업 제2025-고양덕양구-1847호</span><span>개인정보보호책임자 김은진</span></p>',
    '      <p><span>경기도 고양시 덕양구 은빛로 53 코스미온빌 301호</span><span><a href="mailto:bigcarl@naver.com">bigcarl@naver.com</a></span></p>',
    '      <p class="sf-legal"><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a></p>',
    '    </div>',
    // 연도는 비워 둔다 — 정적 HTML에 박으면 해가 바뀔 때마다 게이트가 울린다. site.js 가 채운다.
    // 계산 결과 안내는 도구 페이지(/ko/)에만 둔다 — 꽃공방 메인·매거진에는 맞지 않는 문구다 (2026-09-22)
    '    <div class="disclaimer">' + (isTool ? '본 사이트의 계산 결과는 참고용이며, 정확한 판단이 필요한 경우 전문가·공식기관에 확인하세요. ' : '') +
      '© <span id="footer-year"></span> 테차 꽃공방</div>',
    '  </div>',
    '  ' + FOOTER_END
  ].join('\n');
}

function pageHeadMarkup(opts, cats, isBlogPost) {
  const cat = opts.category && cats[opts.category];
  let crumb = '<a href="/">홈</a> › ';
  // 매거진 글에는 목록으로 돌아가는 단을 둔다. JS 판에는 없던 것인데,
  // /blog/ 로 가는 정적 링크가 사이트 전체에 1개뿐이었고 독자도 이걸 기대한다.
  if (isBlogPost) crumb += '<a href="/blog/">테차 매거진</a> › ';
  else if (cat) crumb += '<a href="/#cat-' + esc(opts.category) + '">' + esc(cat.title) + '</a> › ';
  crumb += '<span>' + esc(opts.title) + '</span>';

  return [
    HEAD_BEGIN,
    '  <div class="wrap">',
    '    <div class="breadcrumb">' + crumb + '</div>',
    '    <div class="page-head"><h1>' + esc(opts.title) + '</h1>' +
      (opts.desc ? '<p class="lead">' + esc(opts.desc) + '</p>' : '') + '</div>',
    '  </div>',
    '  ' + HEAD_END
  ].join('\n');
}

// 두 번째 실행부터는 BEGIN/END 주석 사이만 갈아끼운다.
// 태그로 잡으면 page-head 처럼 안에 <div> 가 중첩된 경우 첫 </div> 에 걸려
// 실행할 때마다 결과가 달라진다(멱등성이 깨진다).
function fill(html, tag, id, begin, end, markup, eol) {
  const b = html.indexOf(begin);
  if (b !== -1) {
    const e = html.indexOf(end, b);
    if (e === -1) return { html, found: false };
    return { html: html.slice(0, b) + toEol(markup, eol) + html.slice(e + end.length), found: true };
  }
  // 첫 실행: 아직 비어 있는 <tag id="x"></tag> 를 채운다.
  const re = new RegExp('(<' + tag + '\\s+id="' + id + '"[^>]*>)\\s*(</' + tag + '>)');
  const m = html.match(re);
  if (!m) return { html, found: false };
  const body = toEol('\n  ' + markup + '\n', eol);
  return { html: html.replace(re, m[1] + body + m[2]), found: true };
}

function listPages() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'docs'].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') out.push(p);
    }
  })(ROOT);
  return out.sort();
}

function main() {
  const check = process.argv.includes('--check');
  const { CATS } = readRegistry();
  const site = fs.readFileSync(path.join(ROOT, 'assets/js/site.js'), 'utf8');
  const shopUrl = (site.match(/shopUrl:\s*"([^"]+)"/) || [])[1];
  if (!shopUrl) { console.error('❌ site.js 에서 shopUrl 을 못 찾았습니다.'); process.exit(1); }

  const pages = listPages();
  const changed = [];
  const errors = [];
  let headers = 0, heads = 0, footers = 0, bizs = 0;

  for (const file of pages) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    const eol = eolOf(html);
    let next = html;

    let r = fill(next, 'header', 'site-header', HEADER_BEGIN, HEADER_END, headerMarkup(shopUrl), eol);
    if (r.found) { next = r.html; headers++; }

    r = fill(next, 'footer', 'site-footer', FOOTER_BEGIN, FOOTER_END, footerMarkup(rel.startsWith('ko/'), shopUrl), eol);
    if (r.found) { next = r.html; footers++; }
    else errors.push(rel + ': site-footer 를 못 찾음');

    if (BIZ_PAGES.includes(rel)) {
      r = fillBusiness(next, eol);
      if (r.found) { next = r.html; bizs++; }
      else errors.push(rel + ': </head> 를 못 찾아 업체 스키마를 못 넣음');
    }

    if (/<div\s+id="page-head"[^>]*>/.test(next)) {
      const opts = readPageOpts(next);
      if (!opts || !opts.title) {
        errors.push(rel + ': page-head 는 있는데 initPage 의 title 을 못 읽음');
      } else {
        const isBlogPost = rel.startsWith('blog/') && rel !== 'blog/index.html';
        r = fill(next, 'div', 'page-head', HEAD_BEGIN, HEAD_END, pageHeadMarkup(opts, CATS, isBlogPost), eol);
        if (r.found) { next = r.html; heads++; }
      }
    }

    if (next !== html) {
      if (!check) fs.writeFileSync(file, next);
      changed.push(rel);
    }
  }

  if (errors.length) {
    errors.forEach((e) => console.error('❌ ' + e));
    process.exit(1);
  }
  if (changed.length && check) {
    console.error(`❌ 공통 껍데기가 어긋난다 (${changed.length}쪽). node scripts/build-chrome.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length
    ? `✅ ${changed.length}쪽 갱신 — 헤더 ${headers} · 제목 ${heads} · 푸터 ${footers} · 업체 스키마 ${bizs} 를 정적 HTML로 생성`
    : `✅ 최신 상태 — ${pages.length}쪽 (헤더 ${headers} · 제목 ${heads} · 푸터 ${footers} · 업체 스키마 ${bizs})`);
}

main();
