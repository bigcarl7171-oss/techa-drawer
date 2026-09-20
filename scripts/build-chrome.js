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
    '    <a class="logo" href="/">테<b>차</b> 서랍</a>',
    '    <div class="header-search">',
    '      <button type="button" class="header-search-toggle" id="header-search-toggle" aria-label="도구·매거진 검색" aria-expanded="false">🔍</button>',
    '      <div class="header-search-panel" id="header-search-panel">',
    '        <input type="text" id="header-search-input" placeholder="도구·매거진 검색..." autocomplete="off">',
    '        <div class="header-search-results" id="header-search-results"></div>',
    '      </div>',
    '    </div>',
    '    <nav class="header-nav">' +
      '<a href="/ko/gift-finder/">선물 추천</a>' +
      '<a href="/message/">꽃 선물 메시지</a>' +
      '<a href="/space/">공간 스타일링·구독</a>' +
      '<a href="/contact/">기업·단체 주문</a>' +
      '<a href="/about/">테차 소개</a>' +
      '<a class="header-shop-link" href="' + esc(shopUrl) + '" target="_blank" rel="noopener">테차 선물 보기</a>' +
      '</nav>',
    '  </div>',
    '  ' + HEADER_END
  ].join('\n');
}

function footerMarkup() {
  return [
    FOOTER_BEGIN,
    '  <div class="wrap">',
    '    <a href="/">홈</a><a href="/ko/gift-finder/">선물 추천</a><a href="/message/">꽃 선물 메시지</a>' +
      '<a href="/space/">공간 스타일링·구독</a><a href="/contact/">기업·단체 주문</a><a href="/about/">테차 소개</a>' +
      '<a href="/blog/">테차 매거진</a><a href="/care/">꽃 관리법</a><a href="/ko/">일상 도구</a>',
    '    <a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a>',
    // 연도는 비워 둔다 — 정적 HTML에 박으면 해가 바뀔 때마다 게이트가 울린다. site.js 가 채운다.
    '    <div class="disclaimer">본 사이트의 계산 결과는 참고용이며, 정확한 판단이 필요한 경우 전문가·공식기관에 확인하세요. © <span id="footer-year"></span> 테차 서랍</div>',
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
  let headers = 0, heads = 0, footers = 0;

  for (const file of pages) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    const eol = eolOf(html);
    let next = html;

    let r = fill(next, 'header', 'site-header', HEADER_BEGIN, HEADER_END, headerMarkup(shopUrl), eol);
    if (r.found) { next = r.html; headers++; }

    r = fill(next, 'footer', 'site-footer', FOOTER_BEGIN, FOOTER_END, footerMarkup(), eol);
    if (r.found) { next = r.html; footers++; }
    else errors.push(rel + ': site-footer 를 못 찾음');

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
    ? `✅ ${changed.length}쪽 갱신 — 헤더 ${headers} · 제목 ${heads} · 푸터 ${footers} 를 정적 HTML로 생성`
    : `✅ 최신 상태 — ${pages.length}쪽 (헤더 ${headers} · 제목 ${heads} · 푸터 ${footers})`);
}

main();
