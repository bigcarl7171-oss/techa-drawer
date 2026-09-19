#!/usr/bin/env node
/**
 * 도구 페이지에 스마트스토어 연결을 정적 HTML로 생성한다.
 *
 * 왜 정적인가: 지금까지 CTA 는 site.js 가 스토어 홈 하나를 JS 로 주입하는 것이 전부였고,
 * 크롤러에는 보이지 않았다. 네이버 웹문서 유입 1·3·4위가 전부 도구 페이지인데
 * 살 것이 하나도 안 걸려 있었다 (docs/naver-webmaster-2026-09-20.md).
 *
 * 두 단계로 나눈다 — 노출 크기가 아니라 '선물 의도' 순서다.
 *   gift  : 선물 맥락이 분명한 도구 → 상품 3개 카드
 *   brand : 선물과 무관한 도구 → 상품을 밀지 않고 브랜드 한 줄만
 *
 * 단일 출처:
 *   - 도구별 연결 → data/tool-product-links.json
 *   - 상품명·마케팅 링크 → data/store-links.json
 *
 * 사용: node scripts/build-tool-products.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const TOOL_DIR = path.join(ROOT, 'ko');
const MAP_FILE = path.join(ROOT, 'data', 'tool-product-links.json');
const STORE_FILE = path.join(ROOT, 'data', 'store-links.json');
const BEGIN = '<!-- BEGIN tool-products (생성: scripts/build-tool-products.js — 직접 고치지 말 것) -->';
const END = '<!-- END tool-products -->';

// 왜 이 상품인가. 도구의 맥락에 맞춰 쓴다 — 상품 설명을 그대로 옮기지 않는다.
const REASONS = {
  'superior-rose': '꽃 자체의 존재감이 필요한 기념일과 격식 있는 자리',
  'rose-hydrangea-bouquet': '기념일·졸업·승진처럼 받는 순간이 중요한 자리',
  'hydrangea-bouquet': '취향을 크게 타지 않는 은은한 프리저브드 꽃다발',
  'carnation-rose-bouquet': '부모님께 감사와 축하의 마음을 꽃으로 전할 때',
  'money-cake': '생신·환갑·칠순에 현금과 축하 장면을 함께 준비할 때',
  'rose-money-bouquet': '현금의 실용성과 꽃다발의 정성을 함께 전할 때',
  'glassdome-moodlamp': '낮에는 꽃, 밤에는 조명으로 남는 선물',
  'hydrangea-moodlamp': '은은한 색감과 조명을 오래 두고 보고 싶을 때',
  'cup-moodlamp-single': '작은 공간에 부담 없이 두는 한 송이 꽃 조명',
  'ionantha-moodlamp': '책상·선반에 관리 부담 없이 두는 초록 소품',
  'flower-postcard': '부담 없이 짧은 마음과 꽃을 함께 전할 때'
};

const BRAND_LINE =
  '테차는 프리저브드 플라워와 비누꽃으로 오래 남는 선물을 만듭니다.';

function listTools() {
  return fs.readdirSync(TOOL_DIR).filter(slug =>
    fs.existsSync(path.join(TOOL_DIR, slug, 'index.html'))
  ).sort();
}

function giftMarkup(products) {
  return `    ${BEGIN}\n` +
    '    <section class="tool-products" aria-labelledby="tool-products-title">\n' +
    '      <p class="tool-products-kicker">TECHA PICKS</p>\n' +
    '      <h2 id="tool-products-title">이 도구를 쓰신 김에, 테차의 선물</h2>\n' +
    '      <div class="tool-products-grid">\n' +
    products.map(p =>
      '        <a class="tool-product-card" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' +
      '<span><b>' + esc(p.name) + '</b><small>' + esc(REASONS[p.line] || '테차 스마트스토어에서 구성과 후기를 확인해 보세요.') + '</small></span>' +
      '<strong>상품 보기 →</strong></a>'
    ).join('\n') + '\n' +
    '      </div>\n' +
    '      <p class="tool-products-note">색상·크기·최종 가격은 스마트스토어 상품 페이지에서 확인해 주세요.</p>\n' +
    '    </section>\n' +
    `    ${END}`;
}

function brandMarkup(storeHome) {
  return `    ${BEGIN}\n` +
    '    <section class="tool-brandline" aria-label="테차 소개">\n' +
    '      <p>' + esc(BRAND_LINE) + '</p>\n' +
    '      <a href="/ko/gift-finder/">선물 추천받기 →</a>\n' +
    '      <a href="' + esc(storeHome) + '" target="_blank" rel="noopener noreferrer">테차 선물 보기 →</a>\n' +
    '    </section>\n' +
    `    ${END}`;
}

function insert(html, block, eol) {
  const begin = html.indexOf(BEGIN);
  if (begin !== -1) {
    const end = html.indexOf(END, begin);
    if (end === -1) return null;
    return html.slice(0, begin - 4) + block + html.slice(end + END.length);
  }
  // 도구 페이지는 </article> 로 본문이 끝난다. techa-cta 슬롯이 있으면 그 위에 둔다.
  const slot = /\s*<div id="techa-cta"[^>]*><\/div>/;
  const match = html.match(slot);
  if (match) return html.replace(slot, toEol('\n\n' + block + '\n\n    ' + match[0].trim(), eol));
  if (html.includes('  </article>')) return html.replace('  </article>', toEol('\n\n' + block + '\n  </article>', eol));
  return null;
}

function main() {
  const check = process.argv.includes('--check');
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  const byLine = new Map(Object.values(store.products).map(p => [p.line, p]));

  const tools = listTools();
  const errors = [];
  const changed = [];
  let productTotal = 0;

  const gift = map.gift || {};
  const brand = new Set(map.brand || []);

  for (const slug of Object.keys(gift)) {
    if (!tools.includes(slug)) errors.push(`${slug}: gift 매핑은 있지만 도구 페이지가 없음`);
  }
  for (const slug of brand) {
    if (!tools.includes(slug)) errors.push(`${slug}: brand 목록에 있지만 도구 페이지가 없음`);
  }
  for (const slug of tools) {
    if (!(slug in gift) && !brand.has(slug)) {
      errors.push(`${slug}: gift 나 brand 어느 쪽에도 없음 — tool-product-links.json 에 넣을 것`);
    }
  }

  for (const slug of tools) {
    let block;
    if (slug in gift) {
      const lines = gift[slug];
      if (!Array.isArray(lines) || lines.length < 1 || lines.length > 3) {
        errors.push(`${slug}: 상품은 1~3개여야 함`);
        continue;
      }
      const products = lines.map(line => {
        const p = byLine.get(line);
        if (!p) errors.push(`${slug}: store-links.json 에 없는 line '${line}'`);
        return p ? { ...p, line } : null;
      }).filter(Boolean);
      if (products.length !== lines.length) continue;
      productTotal += products.length;
      block = giftMarkup(products);
    } else if (brand.has(slug)) {
      block = brandMarkup(store.store_home);
    } else {
      continue;
    }

    const file = path.join(TOOL_DIR, slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const eol = eolOf(html);
    const next = insert(html, toEol(block, eol), eol);
    if (next === null) { errors.push(`${slug}: 삽입 지점을 못 찾음`); continue; }
    if (next !== html) {
      if (!check) fs.writeFileSync(file, next);
      changed.push(slug);
    }
  }

  if (errors.length) {
    errors.forEach(e => console.error('❌ ' + e));
    process.exit(1);
  }
  if (changed.length && check) {
    console.error(`❌ 도구 상품 블록이 어긋난다 (${changed.length}개). node scripts/build-tool-products.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length
    ? `✅ 도구 ${changed.length}개 갱신 — 선물 ${Object.keys(gift).length}개에 상품 ${productTotal}개, 브랜드 한 줄 ${brand.size}개`
    : `✅ 최신 상태 — 도구 ${tools.length}개 (선물 ${Object.keys(gift).length} · 브랜드 ${brand.size}), 상품 링크 ${productTotal}개`);
}

main();
