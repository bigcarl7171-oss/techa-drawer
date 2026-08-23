#!/usr/bin/env node
/*
  초안(docs/drafts/YYYY-MM-DD-<slug>.md) → 발행본 + 목록·메인·사이트맵 반영.

  왜 스크립트인가: blog-seo-guide.md "새 글 발행 절차" 1~4번은 판단이 필요 없는데도
  매번 손으로 했다. 캐러셀 3개·위젯 5개 상한과 transition-delay 재부여처럼 빠뜨리기
  쉬운 규칙이 섞여 있어서, 규칙 문장을 더 쓰는 대신 코드로 고정한다.
  판단이 필요한 5~7번(이미지 선택·내부링크·검증)은 techa-publish 스킬이 맡는다.

  사용법:
    node scripts/publish-draft.js <slug> --emoji 🌷 --tag "꽃 고르기" \
         --desc "목록 카드에 들어갈 한 줄" [--cta "CTA 문구"] [--dry-run]

  멱등: 이미 반영된 슬러그면 중복으로 넣지 않고 해당 블록을 갈아끼운다.
  마지막에 한 일을 JSON 으로 뱉는다 (스킬이 읽는다).
*/
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./lib/draft");
const { ROOT, readText, writeText, setEol, die, rel } = D;

// ── 인자
const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith("-"));
const opt = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : dflt;
};
const DRY = argv.includes("--dry-run");
if (!slug) die("사용법: node scripts/publish-draft.js <slug> --emoji 🌷 --tag 태그 --desc 설명");

const emoji = opt("emoji", "🌸");
const tag = opt("tag", "테차 매거진");
const cardDesc = opt("desc", null);
const ctaText = opt("cta", null);

// ── 1. 초안
const d = D.loadDraft(slug);
const { title, summary, date } = d;
const cover = d.images[0];

// ── 2. 본문 마크다운 → article HTML
const bodyHtml = mdToHtml(d.bodyMd);

// ── 3. 발행본 생성
const tplPath = path.join(ROOT, "docs", "blog-post-template.html");
let page = readText(tplPath);
const coverUrl = `https://www.techa.kr/blog/${slug}/cover.jpg`;

page = page
  .split("{{글 제목}}").join(esc(title))
  .split("{{150자 내외 요약. 핵심 키워드를 자연스럽게 포함}}").join(esc(summary))
  .split("{{한 줄 요약, page-head 아래 소개문으로 노출}}").join(esc(summary))
  .split("{{요약}}").join(esc(summary))
  .split("{{YYYY-MM-DD}}").join(date)
  .split("{{slug}}").join(slug)
  // og-default 대신 글마다 자기 대표 이미지를 쓴다 (지금까지 전 게시글이 기본값으로 나갔다)
  .split("https://www.techa.kr/assets/og/og-default.png").join(coverUrl);

const article = [
  `    <figure>`,
  `      <img src="/blog/${slug}/cover.jpg" alt="${esc(cover.alt)}" width="1200" height="800" loading="eager">`,
  `    </figure>`,
  ``,
  bodyHtml,
  ...(ctaText ? [``, `    <div id="techa-cta" data-text="${esc(ctaText)}"></div>`] : []),
].join("\n");

page = page.replace(
  /(<article class="article">\n)[\s\S]*?(\n  <\/article>)/,
  (_m, a, b) => a + article + b
);
const leftovers = [...page.matchAll(/\{\{[^}]*\}\}/g)].map((m) => m[0]);
if (leftovers.length) die("템플릿 치환이 덜 됐다: " + leftovers.join(", "));

// ── 4. 목록·메인·사이트맵
const listPath = path.join(ROOT, "blog", "index.html");
const homePath = path.join(ROOT, "index.html");
const mapPath = path.join(ROOT, "sitemap.xml");

let list = readText(listPath);
let home = readText(homePath);
let map = readText(mapPath);

const wasPresent = list.includes(`/blog/${slug}/`);

// 4-1. blog/index.html 카드
list = dropBlock(list, `<a class="app-card post-card" href="/blog/${slug}/">`);
list = list.replace(/[ \t]*<div class="magazine-empty">[\s\S]*?<\/div>\n/, "");
list = insertAfter(list, '<div class="grid post-grid">', [
  `      <a class="app-card post-card" href="/blog/${slug}/">`,
  `        <div class="emoji">${emoji}</div>`,
  `        <div class="name">${esc(title)}</div>`,
  `        <div class="desc">${esc(cardDesc || summary)}</div>`,
  `        <div class="post-date">${date}</div>`,
  `      </a>`,
].join("\n"));

// 4-2. index.html 캐러셀 (상한 3, transition-delay 재부여)
home = dropBlock(home, `href="/blog/${slug}/">`, '<a class="shell-mag-card');
home = insertAfter(home, '<div class="shell-carousel">', [
  `      <a class="shell-mag-card reveal" href="/blog/${slug}/">`,
  `        <img src="/blog/${slug}/cover.jpg" alt="${esc(cover.alt)}" loading="lazy">`,
  `        <span class="shell-mag-tag">${emoji} ${esc(tag)}</span>`,
  `        <div class="shell-mag-body">`,
  `          <div class="shell-mag-title">${esc(title)}</div>`,
  `          <div class="shell-mag-byline"><span class="shell-mag-avatar">🌿</span> 테차 매거진</div>`,
  `        </div>`,
  `      </a>`,
].join("\n"));
home = capBlocks(home, '<a class="shell-mag-card', 3, (block, i) => {
  const styled = i === 0 ? "" : ` style="transition-delay:.${String(i * 6).padStart(2, "0")}s"`;
  return block.replace(/^(\s*<a class="shell-mag-card reveal")(?: style="[^"]*")?/, `$1${styled}`);
});

// 4-3. index.html 위젯 (상한 5)
home = dropBlock(home, `<a class="shell-mag-row" href="/blog/${slug}/">`);
home = insertAfter(home, '<div class="shell-widget-head">테차 매거진', [
  `      <a class="shell-mag-row" href="/blog/${slug}/">`,
  `        <span class="shell-mag-row-icon">${emoji}</span>`,
  `        <div><div class="shell-mag-row-title">${esc(title)}</div><div class="shell-mag-row-date">${date}</div></div>`,
  `      </a>`,
].join("\n"));
home = capBlocks(home, '<a class="shell-mag-row"', 5);

// 4-4. sitemap.xml
map = map.split("\n").filter((l) => !l.includes(`/blog/${slug}/</loc>`)).join("\n");
map = map.replace(
  /(<url><loc>https:\/\/www\.techa\.kr\/blog\/<\/loc><lastmod>)[\d-]+(<)/,
  `$1${date}$2`
);
map = insertAfter(map, "<loc>https://www.techa.kr/blog/</loc>",
  `  <url><loc>https://www.techa.kr/blog/${slug}/</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);

// ── 5. 쓰기
const outDir = path.join(ROOT, "blog", slug);
const postPath = path.join(outDir, "index.html");
setEol(postPath, tplPath);
const writes = [[postPath, page], [listPath, list], [homePath, home], [mapPath, map]];
if (!DRY) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [p, c] of writes) writeText(p, c);
}

// 본문 분량: check-publish.sh 와 같은 기준(문단·목록·소제목의 텍스트)으로 센다
const bodyChars = (bodyHtml.match(/<(?:p|li|h2|h3)>[^<]*/g) || [])
  .join("").replace(/<[^>]*>/g, "").length;

const missing = d.images.filter((im) => !fs.existsSync(path.join(outDir, im.file)));
console.log(JSON.stringify({
  slug, date, title,
  draft: rel(d.file),
  dryRun: DRY,
  republished: wasPresent,
  post: rel(postPath),
  bodyChars,
  images: d.images.map((im) => ({ slot: im.slot, file: im.file, alt: im.alt })),
  missingImages: missing.map((im) => im.file),
  written: DRY ? [] : writes.map(([p]) => rel(p)),
  warnings: [
    bodyChars < 1800 ? `본문 약 ${bodyChars}자 — 매거진 목표는 1,800~2,800자` : null,
    missing.length ? `이미지 파일 없음: ${missing.map((im) => im.file).join(", ")} — prepare-images.js 먼저` : null,
  ].filter(Boolean),
}, null, 2));

// ────────────────────────── helpers

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 본문 마크다운 → article 안에 들어갈 HTML */
function mdToHtml(md) {
  const out = [];
  let ul = null;
  const flush = () => { if (ul) { out.push(`    <ul>\n${ul.join("\n")}\n    </ul>`); ul = null; } };

  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }

    const img = D.parseMarker(line);
    if (img) {
      flush();
      out.push(`    <figure>`);
      out.push(`      <img src="/blog/${slug}/${img.file}" alt="${esc(img.alt)}" width="1200" height="800" loading="lazy">`);
      out.push(`    </figure>`);
      continue;
    }
    if (line.startsWith("### ")) { flush(); out.push(`    <h3>${esc(line.slice(4).trim())}</h3>`); continue; }
    if (line.startsWith("## ")) { flush(); out.push(`    <h2>${esc(line.slice(3).trim())}</h2>`); continue; }
    // **Q. …** 한 줄 = FAQ 질문
    const q = line.match(/^\*\*(.+)\*\*$/);
    if (q) { flush(); out.push(`    <h3>${esc(q[1].trim())}</h3>`); continue; }
    if (line.startsWith("- ")) { (ul = ul || []).push(`      <li>${inline(line.slice(2).trim())}</li>`); continue; }
    flush();
    out.push(`    <p>${inline(line)}</p>`);
  }
  flush();
  return out.join("\n");
}
function inline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** `<a …>` 로 시작해 같은 들여쓰기의 `</a>` 로 끝나는 블록을 지운다 */
function dropBlock(text, marker, openPrefix) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(marker)) continue;
    if (openPrefix && !lines[i].includes(openPrefix)) continue;
    const indent = lines[i].match(/^\s*/)[0];
    for (let j = i; j < lines.length; j++) {
      if (lines[j] === indent + "</a>") return lines.slice(0, i).concat(lines.slice(j + 1)).join("\n");
    }
  }
  return text;
}

/** 앵커 줄 바로 뒤에 블록을 끼워 넣는다 */
function insertAfter(text, anchor, block) {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.includes(anchor));
  if (i < 0) die(`삽입 위치를 못 찾았다: ${anchor}`);
  lines.splice(i + 1, 0, block);
  return lines.join("\n");
}

/** 같은 종류의 `<a>` 블록을 최신 n개만 남긴다. transform(block, index) 로 재가공 가능 */
function capBlocks(text, marker, max, transform) {
  const lines = text.split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(marker)) continue;
    const indent = lines[i].match(/^\s*/)[0];
    for (let j = i; j < lines.length; j++) {
      if (lines[j] === indent + "</a>") { blocks.push([i, j]); i = j; break; }
    }
  }
  // 뒤에서부터 지워야 인덱스가 안 밀린다
  for (let k = blocks.length - 1; k >= 0; k--) {
    const [s, e] = blocks[k];
    if (k >= max) { lines.splice(s, e - s + 1); continue; }
    if (transform) {
      const block = lines.slice(s, e + 1).join("\n");
      lines.splice(s, e - s + 1, ...transform(block, k).split("\n"));
    }
  }
  return lines.join("\n");
}
