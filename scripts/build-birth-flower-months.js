#!/usr/bin/env node
/**
 * 월별 탄생화 페이지 12개(/ko/birth-flower/1/ ~ /12/)를 찍는다.
 *
 * 왜 — 2026-10-04 경쟁 점검: "N월 탄생화" 검색 1페이지는 블로그·나무위키의 월별 표가
 * 차지한다. 테차는 도구 한 쪽(/ko/birth-flower/)에 12달을 JS 로만 보여줘서, 달마다
 * 들어갈 정적 문서가 없었다. 달마다 한 쪽을 두고 그 달 꽃에 맞는 상품을 붙인다.
 *
 * 단일 출처 (여기서 새로 쓰는 꽃 정보는 없다):
 *   - 꽃 이름·꽃말·유래·어울리는 사람·추천 문구 → ko/birth-flower/index.html 의 var FLOWERS
 *   - 미국식 탄생화 → 같은 페이지의 "나라마다 다른 탄생화" 비교표
 *   - 달별 상품 → data/birth-flower-months.json (+ data/store-links.json)
 * 도구 페이지의 꽃 정보를 고쳤으면 이 스크립트를 다시 돌린다. 게이트가 --check 로 잡는다.
 *
 * 페이지 파일은 처음 한 번 뼈대를 만들고, 그 뒤로는 BEGIN/END 사이만 갈아끼운다
 * (헤더·푸터는 build-chrome.js 몫이라 건드리지 않는다).
 *
 * 사용: node scripts/build-birth-flower-months.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const TOOL = path.join(ROOT, 'ko', 'birth-flower', 'index.html');
const MONTHS_FILE = path.join(ROOT, 'data', 'birth-flower-months.json');
const STORE_FILE = path.join(ROOT, 'data', 'store-links.json');
const BASE = 'https://www.techa.kr';

const mark = (name) => [
  `<!-- BEGIN ${name} (생성: scripts/build-birth-flower-months.js — 직접 고치지 말 것) -->`,
  `<!-- END ${name} -->`,
];
const HEAD = mark('birth-month-head');
const BODY = mark('birth-month');
const INIT = mark('birth-month-init');

// 해당 달을 직접 다룬 매거진 글 — 있으면 본문 끝에 건다
const POSTS = {
  10: ['/blog/october-birth-flower/', '10월 탄생화가 국화·코스모스·금잔화로 곳마다 다르게 나오는 이유'],
};

function readTool() {
  const html = fs.readFileSync(TOOL, 'utf8');
  const start = html.indexOf('var FLOWERS=');
  if (start === -1) throw new Error('도구 페이지에서 var FLOWERS 를 못 찾았다');
  const open = html.indexOf('{', start);
  let depth = 0, end = -1;
  for (let i = open; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) { end = i; break; }
  }
  const FLOWERS = eval('(' + html.slice(open, end + 1) + ')');

  const us = {};
  const sec = html.slice(html.indexOf('<h2>나라마다 다른 탄생화</h2>'));
  for (const m of sec.matchAll(/<tr><td>(\d+)월<\/td><td>.*?<\/td><td>([^<]+)<\/td><\/tr>/g)) us[m[1]] = m[2].trim();
  for (let m = 1; m <= 12; m++) {
    if (!FLOWERS[m]) throw new Error(`FLOWERS 에 ${m}월이 없다`);
    if (!us[m]) throw new Error(`비교표에 ${m}월 미국식 탄생화가 없다`);
  }
  return { FLOWERS, us };
}

function title(m, f) { return `${m}월 탄생화 ${f.n} — 꽃말·유래와 선물 고르는 법`; }

function headMarkup(m, f, us) {
  const url = `${BASE}/ko/birth-flower/${m}/`;
  const desc = `${m}월 탄생화는 ${f.n}, 꽃말은 ${f.m}입니다. 꽃말이 생긴 이야기와 미국식 ${m}월 탄생화(${us}), 생일 선물로 고를 때 참고할 점을 정리했습니다.`;
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: '월별 탄생화·꽃말', item: BASE + '/ko/birth-flower/' },
      { '@type': 'ListItem', position: 3, name: `${m}월 탄생화 ${f.n}`, item: url },
    ],
  };
  return [
    HEAD[0],
    `<title>${esc(title(m, f))} | 테차 꽃공방</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:image" content="https://www.techa.kr/assets/og/og-default.png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:image" content="https://www.techa.kr/assets/og/og-default.png">',
    '<meta property="og:type" content="article">',
    `<meta property="og:title" content="${esc(m + '월 탄생화 ' + f.n + ' · 꽃말 ' + f.m)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    '<script type="application/ld+json">',
    JSON.stringify(breadcrumb),
    '</script>',
    HEAD[1],
  ].join('\n');
}

function bodyMarkup(m, f, us, products, byLine) {
  const cards = products.map(([line, why]) => {
    const p = byLine[line];
    if (!p) throw new Error(`${m}월 상품 line "${line}" 이 store-links.json 에 없다`);
    return `        <a class="tool-product-card" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer"><span><b>${esc(p.name)}</b><small>${esc(why)}</small></span><strong>상품 보기 →</strong></a>`;
  });
  const nav = [];
  for (let i = 1; i <= 12; i++) {
    nav.push(i === m
      ? `<span class="bf-month is-current" aria-current="page">${i}월</span>`
      : `<a class="bf-month" href="/ko/birth-flower/${i}/">${i}월</a>`);
  }
  const prev = m === 1 ? 12 : m - 1, next = m === 12 ? 1 : m + 1;
  const post = POSTS[m] ? `    <p><a href="${POSTS[m][0]}">${esc(POSTS[m][1])} →</a></p>` : null;
  return [
    BODY[0],
    '  <section class="card">',
    `    <div class="result"><div class="big">${f.e} ${esc(f.n)}</div><div class="sub">꽃말 · ${esc(f.m)}</div></div>`,
    `    <p class="bf-lead">${esc(f.c)}.</p>`,
    '    <section class="tool-products" aria-labelledby="bf-products-title">',
    '      <p class="tool-products-kicker">TECHA PICKS</p>',
    `      <h2 id="bf-products-title">${m}월 탄생화 선물로 고르기 좋은 것</h2>`,
    '      <div class="tool-products-grid">',
    ...cards,
    '      </div>',
    '      <p class="tool-products-note">색상·크기·최종 가격은 스마트스토어 상품 페이지에서 확인해 주세요.</p>',
    '    </section>',
    '  </section>',
    '',
    '  <article class="article">',
    `    <h2>${esc(f.n)} 꽃말의 유래</h2>`,
    `    <p>${esc(f.o)}</p>`,
    '',
    '    <h2>이런 분께 어울려요</h2>',
    `    <p>${esc(f.t)}</p>`,
    '',
    `    <h2>나라마다 다른 ${m}월 탄생화</h2>`,
    `    <p>탄생화는 국제 표준이 없어서 나라와 자료마다 다른 꽃을 씁니다. 국내에 널리 알려진 ${m}월 탄생화는 <b>${esc(f.n)}</b>이고, 미국 등 서구권에서 많이 쓰는 ${m}월 탄생화는 <b>${esc(us)}</b>입니다. 선물로 쓰실 때는 받는 분이 알고 있을 쪽을 고르시거나, 두 꽃을 함께 소개해 주시면 됩니다.</p>`,
    '',
    '    <h2>제철이 아닐 때</h2>',
    '    <p>생일에 그 달의 꽃을 생화로 구하기 어려울 때가 있습니다. 이럴 때는 계절을 타지 않는 <b>프리저브드 플라워나 비누꽃</b>으로 같은 분위기를 준비하거나, 그 꽃의 색을 살린 다른 구성으로 대신할 수 있습니다. 꽃말을 카드에 한 줄 적어 함께 건네면 왜 이 꽃을 골랐는지가 전해집니다.</p>',
    '',
    '    <h2>다른 달 탄생화</h2>',
    `    <nav class="bf-months" aria-label="월별 탄생화">${nav.join('')}</nav>`,
    `    <p class="hint"><a href="/ko/birth-flower/${prev}/">← ${prev}월 탄생화</a> · <a href="/ko/birth-flower/">달을 골라 보는 탄생화 도구</a> · <a href="/ko/birth-flower/${next}/">${next}월 탄생화 →</a></p>`,
    post,
    '    <p><a href="/ko/birth-stone/">같은 달의 탄생석도 함께 보기 →</a></p>',
    '  </article>',
    BODY[1],
  ].filter((l) => l !== null).join('\n');
}

function initMarkup(m, f) {
  return [
    INIT[0],
    '<script>',
    `TECHA.initPage({ title:${JSON.stringify(`${m}월 탄생화 ${f.n}`)}, desc:${JSON.stringify(`꽃말 · ${f.m}`)}, category:"fortune" });`,
    '</script>',
    INIT[1],
  ].join('\n');
}

// 처음 만들 때만 쓰는 뼈대. 헤더·브레드크럼·푸터는 비워 두면 build-chrome.js 가 채운다.
function skeleton(m) {
  const tool = fs.readFileSync(TOOL, 'utf8');
  const top = tool.slice(0, tool.indexOf('<title>'));
  return [
    top.trimEnd(),
    HEAD[0], HEAD[1],
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap">',
    '<link rel="stylesheet" href="/assets/css/style.css">',
    '</head>',
    '<body>',
    '<header id="site-header"></header>',
    '<div id="page-head"></div>',
    '',
    '<main class="wrap">',
    BODY[0], BODY[1],
    '</main>',
    '',
    '<footer id="site-footer"></footer>',
    '',
    '<script src="/assets/js/site.js"></script>',
    INIT[0], INIT[1],
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function replace(html, [begin, end], markup, rel) {
  const b = html.indexOf(begin), e = html.indexOf(end);
  if (b === -1 || e === -1) throw new Error(`${rel}: ${begin.slice(11, 40)}… 마커를 못 찾음`);
  return html.slice(0, b) + markup + html.slice(e + end.length);
}

function main() {
  const check = process.argv.includes('--check');
  const { FLOWERS, us } = readTool();
  const months = JSON.parse(fs.readFileSync(MONTHS_FILE, 'utf8')).months;
  const byLine = {};
  for (const p of Object.values(JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')).products)) byLine[p.line] = p;

  const changed = [];
  for (let m = 1; m <= 12; m++) {
    const rel = `ko/birth-flower/${m}/index.html`;
    const file = path.join(ROOT, rel);
    const exists = fs.existsSync(file);
    if (!exists && check) { changed.push(rel + '(없음)'); continue; }
    const html = exists ? fs.readFileSync(file, 'utf8') : toEol(skeleton(m), eolOf(fs.readFileSync(TOOL, 'utf8')));
    const eol = eolOf(html);
    const f = FLOWERS[m];
    if (!months[m]) throw new Error(`data/birth-flower-months.json 에 ${m}월이 없다`);
    let next = replace(html, HEAD, toEol(headMarkup(m, f, us[m]), eol), rel);
    next = replace(next, BODY, toEol(bodyMarkup(m, f, us[m], months[m], byLine), eol), rel);
    next = replace(next, INIT, toEol(initMarkup(m, f), eol), rel);
    if (next !== html || !exists) {
      if (!check) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, next);
      }
      changed.push(rel);
    }
  }
  if (changed.length && check) {
    console.error(`❌ 월별 탄생화 ${changed.length}쪽이 어긋난다. node scripts/build-birth-flower-months.js 를 돌릴 것 (새로 만든 쪽은 build-chrome.js 도)`);
    process.exit(1);
  }
  console.log(changed.length ? `✅ ${changed.length}쪽 갱신 — 월별 탄생화 12쪽` : '✅ 최신 상태 — 월별 탄생화 12쪽');
}

main();
