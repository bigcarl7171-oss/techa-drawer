#!/usr/bin/env node
/**
 * 홈 검색용 매거진 레지스트리(site.js 의 POSTS)를 blog/index.html 목록에서 생성한다.
 *
 * 왜 필요한가 — POSTS 는 "새 글 추가 시 이 배열과 blog/index.html 의 카드를 함께
 * 추가할 것"이라는 주석만 붙은 수동 목록이었다. 발행 스크립트는 blog/index.html 만
 * 갱신하고 POSTS 는 건드리지 않아서, 2026-08-12 이후 발행한 25편이 홈 검색에서
 * 통째로 빠져 있었다 (2026-09-19 확인). 사람이 기억해야 하는 목록은 결국 어긋난다.
 *
 * 단일 출처는 blog/index.html 의 카드다 — 발행 스크립트가 이미 거기에 쓴다.
 * 이 스크립트는 그걸 읽어 POSTS 를 다시 찍는다.
 *
 * 사용: node scripts/build-posts.js [--check]
 *   --check  파일을 고치지 않고 최신 상태인지만 확인한다 (게이트용, 어긋나면 exit 1)
 */
const fs = require('fs');
const path = require('path');
const { ROOT, eolOf, toEol } = require('./lib/site-registry');

const SITE_JS = path.join(ROOT, 'assets', 'js', 'site.js');
const BLOG_INDEX = path.join(ROOT, 'blog', 'index.html');

const CARD = /<a class="app-card post-card" href="(\/blog\/[a-z0-9-]+\/)">\s*<div class="emoji">([^<]*)<\/div>\s*<div class="name">([\s\S]*?)<\/div>\s*<div class="desc">([\s\S]*?)<\/div>\s*<div class="post-date">([^<]*)<\/div>/g;

const unesc = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const jsStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

function readCards() {
  const html = fs.readFileSync(BLOG_INDEX, 'utf8');
  const out = [];
  for (const m of html.matchAll(CARD)) {
    out.push({
      path: m[1],
      emoji: unesc(m[2]),
      title: unesc(m[3]),
      desc: unesc(m[4]),
      date: unesc(m[5]),
    });
  }
  // 목록 페이지는 최신순으로 쓰지만, 사람이 순서를 흐트러뜨려도 결과가 같도록 한 번 더 정렬한다.
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function buildArray(posts) {
  const body = posts.map((p) =>
    `    { title: ${jsStr(p.title)}, emoji: ${jsStr(p.emoji)},\n` +
    `      desc: ${jsStr(p.desc)}, path: ${jsStr(p.path)}, date: ${jsStr(p.date)} }`
  ).join(',\n');
  return '  var POSTS = [\n' + body + '\n  ];';
}

function main() {
  const check = process.argv.includes('--check');
  const posts = readCards();
  if (!posts.length) {
    console.error('❌ blog/index.html 에서 카드를 하나도 못 읽었다 — 카드 마크업이 바뀌었는지 확인할 것');
    process.exit(1);
  }

  const src = fs.readFileSync(SITE_JS, 'utf8');
  const start = src.indexOf('  var POSTS = [');
  if (start === -1) { console.error('❌ site.js 에서 POSTS 선언을 못 찾았다'); process.exit(1); }
  const endMark = '\n  ];';
  const end = src.indexOf(endMark, start);
  if (end === -1) { console.error('❌ POSTS 선언이 닫히지 않았다'); process.exit(1); }

  const next = src.slice(0, start) + toEol(buildArray(posts), eolOf(src)) + src.slice(end + endMark.length);

  if (next === src) { console.log(`✅ 최신 상태 — 매거진 ${posts.length}편`); return; }
  if (check) {
    console.error(`❌ 홈 검색용 POSTS 가 매거진 목록과 어긋난다 (목록 ${posts.length}편). node scripts/build-posts.js 를 돌릴 것`);
    process.exit(1);
  }
  fs.writeFileSync(SITE_JS, next);
  console.log(`✅ site.js 갱신 — 홈 검색 레지스트리에 매거진 ${posts.length}편 반영`);
}

main();
