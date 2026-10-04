#!/usr/bin/env node
/**
 * 홈의 구매 후기 블록과 신뢰 띠의 평점을 정적 HTML로 찍는다.
 *
 * 왜 — 2026-10-04 경쟁 점검: 비교한 꽃 브랜드 세 곳이 모두 메인에 후기를 앞세운다.
 * 테차 홈에는 평점 한 줄뿐이었고, 실제 후기 원문은 한 줄도 없었다. 근거 문서
 * (docs/review-analysis-2026-08.md)에 검증된 인용문이 이미 있다. 화면에 후기 건수는 쓰지 않는다.
 *
 * 단일 출처: data/reviews.json — 인용은 근거 문서 §6 의 원문 그대로만 둔다.
 *
 * 사용: node scripts/build-reviews.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const HOME = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'data', 'reviews.json');
const STORE = path.join(ROOT, 'data', 'store-links.json');
const mark = (name) => [
  `<!-- BEGIN ${name} (생성: scripts/build-reviews.js — 직접 고치지 말 것) -->`,
  `<!-- END ${name} -->`,
];
const STAT = mark('review-stat');
const BLOCK = mark('reviews');

function statMarkup(s) {
  return [STAT[0],
    `    <div><b>${esc(s.score)} / ${esc(s.scale)} 이상</b><span>${esc(s.label)}</span></div>`,
    '    ' + STAT[1]].join('\n');
}

function blockMarkup(d, storeHome) {
  const s = d.stats;
  const cards = d.quotes.map((q) =>
    `        <figure class="h-review"><blockquote>${esc(q.text)}</blockquote><figcaption>${esc(q.product)} 구매 후기</figcaption></figure>`);
  return [
    BLOCK[0],
    '  <section class="h-sec h-reviews" aria-labelledby="reviews-heading">',
    '    <div class="h-head">',
    `      <div><p class="h-label">구매 후기</p><h2 id="reviews-heading">받아 보신 분들이 남긴 말</h2></div>`,
    `      <p class="h-reviews-stat"><b>${esc(s.score)}</b> / ${esc(s.scale)} 이상<br><small>${esc(s.label)}</small></p>`,
    '    </div>',
    '    <div class="h-review-grid">',
    ...cards,
    '    </div>',
    `    <p class="h-reviews-note">후기는 고치지 않고 원문 그대로 옮겼습니다. 전체 후기는 <a href="${esc(storeHome)}" target="_blank" rel="noopener">스마트스토어</a>에서 보실 수 있어요.</p>`,
    '  </section>',
    '  ' + BLOCK[1],
  ].join('\n');
}

function fill(html, [begin, end], markup) {
  const b = html.indexOf(begin), e = html.indexOf(end);
  if (b === -1 || e === -1) throw new Error('index.html 에 ' + begin.slice(11, 30) + ' 마커가 없다');
  return html.slice(0, b) + markup + html.slice(e + end.length);
}

function main() {
  const check = process.argv.includes('--check');
  const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const storeHome = JSON.parse(fs.readFileSync(STORE, 'utf8')).store_home;
  const html = fs.readFileSync(HOME, 'utf8');
  const eol = eolOf(html);
  let next = fill(html, STAT, toEol(statMarkup(d.stats), eol));
  next = fill(next, BLOCK, toEol(blockMarkup(d, storeHome), eol));
  if (next !== html) {
    if (check) {
      console.error('❌ 홈 후기 블록이 data/reviews.json 과 어긋난다. node scripts/build-reviews.js 를 돌릴 것');
      process.exit(1);
    }
    fs.writeFileSync(HOME, next);
    console.log(`✅ 홈 갱신 — 후기 ${d.quotes.length}개 · 평점 ${d.stats.score}/${d.stats.scale} 이상`);
  } else {
    console.log(`✅ 최신 상태 — 후기 ${d.quotes.length}개 · 평점 ${d.stats.score}/${d.stats.scale} 이상`);
  }
}

main();
