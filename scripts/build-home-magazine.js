#!/usr/bin/env node
/**
 * 홈 "테차 매거진" 블록(대표 글 1 + 최근 글 4)을 blog/index.html 목록에서 생성한다.
 *
 * 왜 생성기인가 — 예전에는 publish-draft.js 가 발행할 때마다 홈 캐러셀에 카드를 끼워
 * 넣고 3개로 잘랐다. 날짜가 카드에 없어서 매일 새 글이 올라와도 홈에서는 티가 안 났고,
 * 글을 고치거나 내리면 홈 카드가 따로 놀았다 (2026-10-05 메인 개편).
 * 단일 출처는 build-posts.js 와 같이 blog/index.html 의 카드다.
 *
 * 사용: node scripts/build-home-magazine.js [--check]
 *   --check  파일을 고치지 않고 최신 상태인지만 확인한다 (게이트용, 어긋나면 exit 1)
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const INDEX = path.join(ROOT, 'index.html');
const BLOG_INDEX = path.join(ROOT, 'blog', 'index.html');
const BEGIN = '<!-- BEGIN home-magazine (생성: scripts/build-home-magazine.js — 직접 고치지 말 것) -->';
const END = '<!-- END home-magazine -->';
const COUNT = 5;

const CARD = /<a class="app-card post-card" href="\/blog\/([a-z0-9-]+)\/">\s*<div class="emoji">[^<]*<\/div>\s*<div class="name">([\s\S]*?)<\/div>\s*<div class="desc">([\s\S]*?)<\/div>\s*<div class="post-date">([^<]*)<\/div>/g;

const unesc = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// "2026-10-05" → "10월 5일"
const korDate = (iso) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;

function coverAlt(slug) {
  const page = path.join(ROOT, 'blog', slug, 'index.html');
  if (!fs.existsSync(path.join(ROOT, 'blog', slug, 'cover.jpg'))) throw new Error(`커버 사진이 없습니다: /blog/${slug}/cover.jpg`);
  const html = fs.readFileSync(page, 'utf8');
  const m = html.match(new RegExp(`<img src="/blog/${slug}/cover\\.jpg" alt="([^"]*)"`));
  return m ? unesc(m[1]) : '';
}

function readPosts() {
  const html = fs.readFileSync(BLOG_INDEX, 'utf8');
  const posts = [];
  for (const m of html.matchAll(CARD)) {
    const date = m[4].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`날짜 형식이 아닙니다: /blog/${m[1]}/ ${date}`);
    posts.push({ slug: m[1], title: unesc(m[2]), desc: unesc(m[3]), date });
    if (posts.length === COUNT) break;
  }
  if (posts.length < COUNT) throw new Error(`blog/index.html 카드가 ${COUNT}개보다 적습니다 (${posts.length}개).`);
  return posts;
}

function render(posts) {
  const [lead, ...rest] = posts;
  const meta = (p) => `<span class="hm-new" data-date="${p.date}" hidden>NEW</span><time datetime="${p.date}">${korDate(p.date)}</time>`;
  const feature = [
    `      <a class="hm-feature" href="/blog/${lead.slug}/">`,
    `        <img src="/blog/${lead.slug}/cover.jpg" alt="${esc(coverAlt(lead.slug))}" width="1200" height="800" loading="lazy">`,
    `        <div class="hm-feature-body">`,
    `          <p class="hm-meta">${meta(lead)}</p>`,
    `          <b class="hm-title">${esc(lead.title)}</b>`,
    `          <span class="hm-desc">${esc(lead.desc)}</span>`,
    `          <span class="hm-read">읽어 보기 <span aria-hidden="true">→</span></span>`,
    `        </div>`,
    `      </a>`,
  ];
  const list = rest.map((p) => [
    `        <li><a href="/blog/${p.slug}/">`,
    `          <img src="/blog/${p.slug}/cover.jpg" alt="" width="1200" height="800" loading="lazy">`,
    `          <span class="hm-item"><span class="hm-meta">${meta(p)}</span><b>${esc(p.title)}</b></span>`,
    `        </a></li>`,
  ].join('\n'));
  return [
    `    <div class="hm-grid">`,
    ...feature,
    `      <ol class="hm-list">`,
    ...list,
    `      </ol>`,
    `    </div>`,
  ].join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const html = fs.readFileSync(INDEX, 'utf8');
  const b = html.indexOf(BEGIN);
  const e = html.indexOf(END);
  if (b === -1 || e === -1 || e < b) throw new Error('index.html 에 home-magazine 생성 마커가 없습니다.');
  const posts = readPosts();
  let next = html.slice(0, b) + `${BEGIN}\n${render(posts)}\n    ${END}` + html.slice(e + END.length);
  next = toEol(next, eolOf(html));
  if (next === html) {
    console.log(`✅ 최신 상태 — 홈 매거진 (${posts[0].date} ${posts[0].slug})`);
    return;
  }
  if (check) {
    console.error('❌ 홈 매거진이 blog/index.html 과 다릅니다. node scripts/build-home-magazine.js 를 실행하세요.');
    process.exit(1);
  }
  fs.writeFileSync(INDEX, next);
  console.log(`✅ index.html 갱신 — 홈 매거진 (${posts[0].date} ${posts[0].slug} 외 ${posts.length - 1}편)`);
}

main();
