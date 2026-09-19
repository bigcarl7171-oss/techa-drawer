#!/usr/bin/env node
/** 월별 홈 상황·상품 큐레이션을 정적 HTML로 생성한다. */
const fs = require('fs');
const path = require('path');

const { eolOf, toEol } = require('./lib/site-registry');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const DATA = require(path.join(ROOT, 'data/home-curation.json'));
const PRODUCTS = require(path.join(ROOT, 'assets/data/gift-finder-products.json')).products;
const STORE = require(path.join(ROOT, 'data/store-links.json'));
const SITUATION_BEGIN = '<!-- BEGIN seasonal-situations (생성: scripts/build-home-curation.js — 직접 고치지 말 것) -->';
const SITUATION_END = '<!-- END seasonal-situations -->';
const PRODUCT_BEGIN = '<!-- BEGIN seasonal-products (생성: scripts/build-home-curation.js — 직접 고치지 말 것) -->';
const PRODUCT_END = '<!-- END seasonal-products -->';

const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));

function targetMonth() {
  const arg = process.argv.find(x => x.startsWith('--date='));
  if (arg) {
    const value = arg.slice(7);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('--date는 YYYY-MM-DD 형식이어야 합니다.');
    return Number(value.slice(5, 7));
  }
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: DATA.timezone, month:'numeric' }).format(new Date()));
}

function replaceBlock(html, begin, end, markup) {
  const b = html.indexOf(begin);
  const e = html.indexOf(end);
  if (b === -1 || e === -1 || e < b) throw new Error(`index.html 생성 마커가 없습니다: ${begin}`);
  return html.slice(0, b) + `${begin}\n${markup}\n      ${end}` + html.slice(e + end.length);
}

function validateHref(href) {
  if (href.startsWith('/')) {
    const clean = href.split(/[?#]/)[0];
    const file = clean.endsWith('/') ? path.join(ROOT, clean, 'index.html') : path.join(ROOT, clean);
    if (!fs.existsSync(file)) throw new Error(`존재하지 않는 내부 링크: ${href}`);
    return;
  }
  if (!href.startsWith('https://mkt.shopping.naver.com/link/')) throw new Error(`허용되지 않은 외부 링크: ${href}`);
}

function build(month) {
  const profileId = DATA.months[String(month)];
  const profile = DATA.profiles[profileId];
  if (!profile || profile.situations.length !== 4 || profile.products.length !== 3) throw new Error(`${month}월 큐레이션 구성이 올바르지 않습니다.`);
  const catalog = new Map(PRODUCTS.map(p => [p.id, p]));
  const allowedLinks = new Set([STORE.store_home, ...Object.values(STORE.products).map(p => p.link)]);

  const situations = profile.situations.map(item => {
    validateHref(item.href);
    return `      <a class="shell-situation" href="${esc(item.href)}" data-situation="${esc(item.id)}">\n        <span class="shell-situation-icon" aria-hidden="true">${esc(item.icon)}</span>\n        <b>${esc(item.title)}</b><span>${esc(item.desc)}</span>\n      </a>`;
  }).join('\n');

  const products = profile.products.map(item => {
    const p = catalog.get(item.id);
    if (!p) throw new Error(`상품 데이터에 없는 ID: ${item.id}`);
    if (!allowedLinks.has(p.shopUrl)) throw new Error(`store-links.json에 없는 상품 링크: ${item.id}`);
    if (!fs.existsSync(path.join(ROOT, p.image1))) throw new Error(`상품 이미지가 없습니다: ${p.image1}`);
    return `        <a class="home-product-card" href="${esc(p.shopUrl)}" target="_blank" rel="noopener">\n          <img src="${esc(p.image1)}" alt="테차 ${esc(p.name)}" loading="lazy">\n          <span>${esc(item.label)}</span><b>${esc(p.name)}</b><small>${esc(item.desc)}</small><strong>상품 보러가기 →</strong>\n        </a>`;
  }).join('\n');
  return { profileId, situations, products };
}

// 12개월치를 전부 빌드해 본다. 달이 바뀌는 순간 자동 반영되므로,
// 없는 상품 id 나 끊긴 링크는 그때가 아니라 지금 걸려야 한다.
function verifyAll() {
  const months = Object.keys(DATA.months).map(Number).sort((a, b) => a - b);
  if (months.length !== 12) throw new Error(`months 에 12개월이 모두 있어야 합니다 (현재 ${months.length}개).`);
  for (const m of months) {
    const built = build(m);
    console.log(`  ${String(m).padStart(2)}월 ${built.profileId} — 상황 4 · 상품 3 OK`);
  }
  console.log('✅ 12개월 큐레이션 전부 빌드 가능');
}

function main() {
  if (process.argv.includes('--verify-all')) return verifyAll();
  const check = process.argv.includes('--check');
  const month = targetMonth();
  const built = build(month);
  const html = fs.readFileSync(INDEX, 'utf8');
  let next = replaceBlock(html, SITUATION_BEGIN, SITUATION_END, built.situations);
  next = replaceBlock(next, PRODUCT_BEGIN, PRODUCT_END, built.products);
  // 이 저장소의 HTML은 CRLF다. 생성기가 LF를 섞어 넣으면 --check 가 매번 실패해
  // 게이트가 늑대소년이 된다 (다른 생성기 4종과 같은 처리).
  next = toEol(next, eolOf(html));
  if (next === html) {
    console.log(`✅ 최신 상태 — ${month}월 ${built.profileId} 홈 큐레이션`);
    return;
  }
  if (check) {
    console.error(`❌ 홈 큐레이션이 ${month}월(${built.profileId})과 다릅니다. node scripts/build-home-curation.js 를 실행하세요.`);
    process.exit(1);
  }
  fs.writeFileSync(INDEX, next);
  console.log(`✅ index.html 갱신 — ${month}월 ${built.profileId} 홈 큐레이션`);
}

main();
