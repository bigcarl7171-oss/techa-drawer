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

// 상황 아이콘 — 1.6px 선 그림(docs/DESIGN-kkotgongbang.md: 이모지 대신 선 아이콘). 없는 id 는 꽃 아이콘.
const ICONS = {
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
  house: '<path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5"/>',
  book: '<path d="M3 6c3-1 6-1 9 1 3-2 6-2 9-1v12c-3-1-6-1-9 1-3-2-6-2-9-1zM12 7v12"/>',
  cake: '<path d="M4 20h16M5 20v-7h14v7M5 16c2 1.5 4 1.5 7 0s5-1.5 7 0M12 13V9M12 6.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5"/>',
  heart: '<path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z"/>',
  rise: '<path d="M4 19h16M6 15l4-4 3 3 5-6M15 8h3v3"/>',
  sprout: '<path d="M12 13v7M9 20h6M12 13c-3 0-4-2-4-4 2 0 4 1 4 4zM12 13c3 0 4-2 4-4-2 0-4 1-4 4z"/><circle cx="12" cy="6" r="2"/>',
  cap: '<path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v5"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"/>',
  coin: '<rect x="3" y="7" width="18" height="11" rx="1"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10v5M18 10v5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  box: '<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>',
  lamp: '<path d="M8 4h8l-1 3a5 5 0 0 1 2 4v6H7v-6a5 5 0 0 1 2-4z"/><path d="M6 20h12M12 11v2"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/>',
  flower: '<circle cx="12" cy="9" r="2"/><path d="M12 7c0-2.5 3-2.5 3 0M12 7c0-2.5-3-2.5-3 0M14 9c2.5 0 2.5 3 0 3M10 9c-2.5 0-2.5 3 0 3M12 11v9M12 17c2-2 4-2 5-1"/>',
};
const ICON_OF = {
  corporate: 'trophy', event: 'trophy', 'yearend-event': 'trophy', business: 'trophy',
  recital: 'music', housewarming: 'house', autumn: 'house', opening: 'house',
  suneung: 'book', graduation: 'cap', 'graduation-review': 'cap',
  parents: 'cake', chuseok: 'coin', money: 'coin', promotion: 'rise',
  anniversary: 'heart', recovery: 'sprout', teacher: 'gift', single: 'gift', thanks: 'gift',
  summer: 'sun', delivery: 'box', moodlamp: 'lamp', christmas: 'star', gift: 'flower',
};
function situationIcon(id) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[ICON_OF[id] || 'flower']}</svg>`;
}

function build(month) {
  const profileId = DATA.months[String(month)];
  const profile = DATA.profiles[profileId];
  if (!profile || profile.situations.length !== 4 || profile.products.length !== 5) throw new Error(`${month}월 큐레이션 구성이 올바르지 않습니다.`);
  const catalog = new Map(PRODUCTS.map(p => [p.id, p]));
  const allowedLinks = new Set([STORE.store_home, ...Object.values(STORE.products).map(p => p.link)]);

  // 2026-10-05 메인 v2: 상황 칸은 사진 대신 선 아이콘 8칸 — 이달 4칸(달 표시) + 늘 찾는 상황(evergreen)으로 채운다.
  // 사진 카드(상품)와 모양을 달리해 어디가 상품인지 한눈에 구분되게 하려는 것.
  const seen = new Set(profile.situations.map(item => item.id));
  const evergreen = (DATA.evergreen || []).filter(item => !seen.has(item.id)).slice(0, 8 - profile.situations.length);
  const cell = (item, tag) => {
    validateHref(item.href);
    return `      <a class="v2-situ-item" href="${esc(item.href)}" data-situation="${esc(item.id)}">${situationIcon(item.id)}<b>${esc(item.title)}</b><span>${esc(item.desc)}</span>${tag ? `<em>${tag}</em>` : ''}</a>`;
  };
  const situations = profile.situations.map(item => cell(item, `${month}월`))
    .concat(evergreen.map(item => cell(item, '')))
    .join('\n');

  const products = profile.products.map(item => {
    const p = catalog.get(item.id);
    if (!p) throw new Error(`상품 데이터에 없는 ID: ${item.id}`);
    if (!allowedLinks.has(p.shopUrl)) throw new Error(`store-links.json에 없는 상품 링크: ${item.id}`);
    // 순서: 그 달 항목에 직접 적은 image → 상품 id 별 실사(productImages) → 선물 추천 상품 사진
    const real = (DATA.productImages || {})[item.id];
    const image = item.image || (real && real.src) || p.image1;
    const alt = item.imageAlt || (!item.image && real && real.alt) || `테차 ${p.name}`;
    if (!image.startsWith('/') || image.includes('..') || !fs.existsSync(path.join(ROOT, image))) throw new Error(`상품 이미지가 없습니다: ${image}`);
    return `        <a class="home-product-card" href="${esc(p.shopUrl)}" target="_blank" rel="noopener">\n          <img src="${esc(image)}" alt="${esc(alt)}" loading="lazy">\n          <span>${esc(item.label)}</span><b>${esc(p.name)}</b><small>${esc(item.desc)}</small><strong>상품 보러가기 →</strong>\n        </a>`;
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
    console.log(`  ${String(m).padStart(2, '0')}월 ${built.profileId} — 상황 4 · 상품 5 OK`);
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
