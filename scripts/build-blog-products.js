#!/usr/bin/env node
/**
 * 매거진 글 하단에 글 주제와 맞는 스마트스토어 상품 1~3개를 정적 HTML로 생성한다.
 *
 * 단일 출처:
 *   - 글별 상품 선택 → data/blog-product-links.json
 *   - 상품명·마케팅 링크 → data/store-links.json
 *
 * 사용: node scripts/build-blog-products.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const BLOG_DIR = path.join(ROOT, 'blog');
const MAP_FILE = path.join(ROOT, 'data', 'blog-product-links.json');
const STORE_FILE = path.join(ROOT, 'data', 'store-links.json');
const BEGIN = '<!-- BEGIN blog-products (생성: scripts/build-blog-products.js — 직접 고치지 말 것) -->';
const END = '<!-- END blog-products -->';

const REASONS = {
  'flower-class': '직접 꽃을 만들며 특별한 시간을 보내고 싶을 때',
  'superior-rose': '꽃 자체의 존재감이 필요한 기념일과 격식 있는 축하 자리',
  'rebony-trophy-doll-bouquet': '발표회와 졸업식에서 아이가 편하게 들 수 있는 인형 꽃다발',
  'topiary-moodlamp': '집이나 사무실에 오래 두고 보는 꽃 조명 선물',
  'kinderjoy-doll-bouquet': '아이의 발표회와 졸업식에 간식과 꽃을 함께 전할 때',
  'flower-postcard': '부담 없이 짧은 마음과 꽃을 함께 전할 때',
  'money-cake': '부모님 생신·환갑·칠순에 현금과 축하 장면을 함께 준비할 때',
  'hydrangea-moodlamp': '은은한 색감과 조명을 오래 두고 보고 싶을 때',
  'rose-hydrangea-bouquet': '기념일·졸업·승진처럼 받는 순간이 중요한 자리',
  'carnation-rose-bouquet': '부모님께 감사와 축하의 마음을 꽃으로 전할 때',
  'classic-money-box': '현금을 깔끔하게 담아 부담 없는 가격대로 준비할 때',
  'single-stem-soap-box': '여러 분께 나누거나 가볍게 마음을 전할 때',
  'premium-window-money-box': '꽃과 현금이 함께 보이는 용돈 선물을 준비할 때',
  'sunflower-frame': '집들이·개업 선물로 오래 두는 인테리어 소품이 필요할 때',
  'glassdome-moodlamp': '낮에는 꽃, 밤에는 조명으로 남는 선물을 찾을 때',
  'hydrangea-bouquet': '취향을 크게 타지 않는 은은한 프리저브드 꽃다발',
  'sunflower-bouquet': '발표회·졸업·밝은 축하 자리에 화사한 꽃다발이 필요할 때',
  'cup-moodlamp-single': '작은 공간에 부담 없이 두는 한 송이 꽃 조명',
  'rose-money-bouquet': '현금의 실용성과 꽃다발의 정성을 함께 전할 때',
  'ionantha-moodlamp': '현관·책상·선반에 관리 부담 없는 초록 소품을 둘 때',
  'centerpiece': '집들이·개업·행사 테이블에 오래 남는 꽃 장식이 필요할 때'
};

function listPosts() {
  return fs.readdirSync(BLOG_DIR).filter(slug => {
    const file = path.join(BLOG_DIR, slug, 'index.html');
    return fs.existsSync(file);
  }).sort();
}

function buildMarkup(products) {
  return `    ${BEGIN}\n` +
    '    <section class="blog-products" aria-labelledby="blog-products-title">\n' +
    '      <p class="blog-products-kicker">TECHA PICKS</p>\n' +
    '      <h2 id="blog-products-title">이 글과 함께 살펴볼 테차 선물</h2>\n' +
    '      <div class="blog-products-grid">\n' +
    products.map(p =>
      '        <a class="blog-product-card" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' +
      '<span><b>' + esc(p.name) + '</b><small>' + esc(REASONS[p.line] || '테차 스마트스토어에서 구성과 후기를 확인해 보세요.') + '</small></span>' +
      '<strong>상품 보기 →</strong></a>'
    ).join('\n') + '\n' +
    '      </div>\n' +
    '      <p class="blog-products-note">색상·크기·최종 가격은 스마트스토어 상품 페이지에서 확인해 주세요.</p>\n' +
    '    </section>\n' +
    `    ${END}`;
}

function main() {
  const check = process.argv.includes('--check');
  const mapping = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  const byLine = new Map(Object.values(store.products).map(p => [p.line, p]));
  const posts = listPosts();
  const changed = [];
  const errors = [];
  let productTotal = 0;

  for (const slug of posts) {
    const lines = mapping[slug];
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 3) {
      errors.push(`${slug}: 상품 매핑은 1~3개여야 함`);
      continue;
    }
    const products = lines.map(line => {
      const product = byLine.get(line);
      if (!product) errors.push(`${slug}: store-links.json에 없는 line '${line}'`);
      return product ? { ...product, line } : null;
    }).filter(Boolean);
    if (products.length !== lines.length) continue;
    productTotal += products.length;

    const file = path.join(BLOG_DIR, slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const eol = eolOf(html);
    const block = toEol(buildMarkup(products), eol);
    let next;
    const begin = html.indexOf(BEGIN);
    if (begin !== -1) {
      const end = html.indexOf(END, begin);
      if (end === -1) { errors.push(`${slug}: END blog-products 마커 없음`); continue; }
      next = html.slice(0, begin - 4) + block + html.slice(end + END.length);
    } else {
      const slot = /\s*<div id="techa-cta"[^>]*><\/div>/;
      const match = html.match(slot);
      if (match) {
        next = html.replace(slot, toEol('\n\n' + block + '\n\n' + match[0].trim(), eol));
      } else if (html.includes('  </article>')) {
        next = html.replace('  </article>', toEol('\n\n' + block + '\n  </article>', eol));
      } else {
        errors.push(`${slug}: article 종료 지점 없음`);
        continue;
      }
    }
    if (next !== html) {
      if (!check) fs.writeFileSync(file, next);
      changed.push(slug);
    }
  }

  for (const slug of Object.keys(mapping)) {
    if (slug.startsWith('_')) continue;
    if (!posts.includes(slug)) errors.push(`${slug}: 매핑은 있지만 발행 글이 없음`);
  }
  if (errors.length) {
    errors.forEach(e => console.error('❌ ' + e));
    process.exit(1);
  }
  if (changed.length && check) {
    console.error(`❌ 상품 추천 블록이 어긋난다 (${changed.length}편). node scripts/build-blog-products.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length
    ? `✅ 매거진 ${changed.length}편 갱신 — 상품 링크 ${productTotal}개를 정적 HTML로 생성`
    : `✅ 최신 상태 — 매거진 ${posts.length}편, 상품 링크 ${productTotal}개`);
}

main();
