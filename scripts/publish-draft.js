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
const FLAGS = ["emoji", "tag", "desc", "cta"];
// 플래그 값을 슬러그로 착각하지 않게 먼저 표시해둔다 —
// `--emoji 🌷 <slug>` 순서로 불러도 🌷 를 슬러그로 잡으면 안 된다.
const taken = new Set();
const opt = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  if (i < 0 || !argv[i + 1] || argv[i + 1].startsWith("--")) return dflt;
  taken.add(i).add(i + 1);
  return argv[i + 1];
};
const values = Object.fromEntries(FLAGS.map((f) => [f, opt(f, null)]));
const slug = argv.find((a, i) => !taken.has(i) && !a.startsWith("-"));
const DRY = argv.includes("--dry-run");
if (!slug) die("사용법: node scripts/publish-draft.js <slug> --emoji 🌷 --tag 태그 --desc 설명");

const emoji = values.emoji || "🌸";
const tag = values.tag || "테차 매거진";
const cardDesc = values.desc;
const ctaText = values.cta;

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

// 본문 분량: check-publish.sh 의 body_chars() 와 똑같은 기준으로 센다 —
// article 에서 태그와 사진 설명을 지우고 공백을 뺀 문자 수. 두 도구가 다른 숫자를
// 내면 어느 쪽을 믿어야 할지 알 수 없게 된다.
const bodyChars = article
  .replace(/<figcaption>[^<]*<\/figcaption>/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s/g, "").length;

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
    bodyChars < 1500 ? `본문 약 ${bodyChars}자 — 매거진 목표는 1,500~2,800자` : null,
    missing.length ? `이미지 파일 없음: ${missing.map((im) => im.file).join(", ")} — prepare-images.js 먼저` : null,
  ].filter(Boolean),
}, null, 2));

// ────────────────────────── helpers

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 본문 마크다운 → article 안에 들어갈 HTML */
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  // 소제목 깊이는 '#' 개수의 절대값이 아니라 본문 안에서의 상대값으로 본다.
  // 루틴이 본문 소제목을 ## 로도 ### 로도 쓴다(2026-08-24 실측: ###).
  // article 안에서 가장 얕은 제목이 <h2> 가 되어야 문서 구조가 맞는다.
  const levels = lines.map((l) => D.heading(l.trim())).filter(Boolean).map((h) => h.level);
  const minHead = levels.length ? Math.min(...levels) : 2;

  const out = [];
  let ul = null;
  const flush = () => {
    if (!ul) return;
    out.push("    <ul>");
    out.push(...ul);
    out.push("    </ul>");
    ul = null;
  };

  for (const raw of lines) {
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

    const h = D.heading(line);
    if (h) {
      flush();
      const tag = h.level <= minHead ? "h2" : "h3";
      out.push(`    <${tag}>${esc(h.title)}</${tag}>`);
      continue;
    }

    // **Q. …** 한 줄 = FAQ 질문. 안쪽에 `**`가 없어야 한다 —
    // "**앞** 가운데 **뒤**" 같은 평범한 문단이 소제목으로 둔갑하던 걸 막는다.
    const q = line.match(/^\*\*([^*]+)\*\*$/);
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
