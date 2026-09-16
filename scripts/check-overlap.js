#!/usr/bin/env node
/*
  매거진 원고와 네이버 blog.md 의 문장 겹침을 잰다.

  왜 필요한가: 두 글은 다루는 범위는 같아야 하지만 문장은 새로 써야 한다
  (routine-draft.md S5). 2026-09-16 `flower-gift-review-analysis` 에서 사람이 완성해 온
  블로그 원고 문장을 매거진에 거의 그대로 옮겨 발행했고, 사람이 보고서야 잡혔다.
  같은 글이 두 곳에 있으면 중복 콘텐츠로 한쪽만 색인되거나 순위가 갈린다.
  규칙 문장을 더 쓰는 대신, 겹치면 실패하게 만든다.

  재는 법: 인용부호 안의 후기 원문과 이미지 마커를 뺀 본문을 공백·문장부호 없이 이어 붙이고,
  매거진의 12자 조각 가운데 blog.md 에도 있는 조각의 비율(포함률)을 본다.
  후기 원문 인용은 따로 세어 보고만 한다(같은 후기를 양쪽에 인용하는 것 자체는 허용).

  사용법:
    node scripts/check-overlap.js <slug> --blog <blog.md 경로>
    node scripts/check-overlap.js --mag <magazine.md> --blog <blog.md>   # 저장소 밖 초안끼리
  종료 코드: 0 통과 / 1 기준 초과
*/
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./lib/draft");

// 기준값 보정(2026-09-16, 지난 발행본 8쌍): 제대로 새로 쓴 쌍은 1~12%였다.
// 38%(autumn-flower-gift-offseason)·23%(preserved-flower-volume-guide)는 돌이켜 보면 이미 많이 겹친 편이고,
// 사고 편(flower-gift-review-analysis 첫 발행본)은 78%였다.
const MAX_CONTAINMENT = 0.20;   // 매거진 조각의 20% 넘게 blog.md 에 있으면 실패
const SENT_COPY = 0.6;          // 한 문장의 60% 넘게 겹치면 '옮겨 온 문장'으로 표시
const K = 12;

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const slug = argv.find((a, i) => !a.startsWith("-") && !["--blog", "--mag"].includes(argv[i - 1]));
const blogPath = opt("--blog");
let magPath = opt("--mag");
if (!blogPath || (!slug && !magPath)) D.die("사용법: node scripts/check-overlap.js <slug> --blog <blog.md>  |  --mag <magazine.md> --blog <blog.md>");
if (!magPath) magPath = D.findDraft(slug);
for (const p of [magPath, blogPath]) if (!fs.existsSync(p)) D.die(`파일이 없다: ${p}`);

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

function magazineBody(text) {
  const i = text.search(/^#{1,6}\s*본문\s*$/m);
  return i >= 0 ? text.slice(i).replace(/^.*\n/, "") : text.replace(/^---\n[\s\S]*?\n---\n/, "");
}

const QUOTE = /["“”][^"“”\n]{4,}?["“”]/g;
function prep(text) {
  const quotes = (text.match(QUOTE) || []).map(norm).filter((q) => q.length >= 6);
  const clean = text
    .replace(/\[이미지 자리[^\]]*\]/g, " ")
    .replace(/\[사진[^\]]*\]/g, " ")
    .replace(QUOTE, " ");
  return { clean, quotes };
}
function norm(s) { return s.replace(/[^\p{L}\p{N}]/gu, ""); }
function shingles(s) {
  const out = new Set();
  for (let i = 0; i + K <= s.length; i++) out.add(s.slice(i, i + K));
  return out;
}
function sentences(text) {
  return text.split(/(?<=[.?!。])\s+|\n+/).map((s) => s.trim()).filter((s) => norm(s).length >= 15);
}

const mag = prep(magazineBody(read(magPath)));
const blog = prep(read(blogPath));
const blogSh = shingles(norm(blog.clean));

const magSh = shingles(norm(mag.clean));
let hit = 0;
for (const s of magSh) if (blogSh.has(s)) hit++;
const containment = magSh.size ? hit / magSh.size : 0;

const copied = [];
for (const s of sentences(mag.clean)) {
  const sh = shingles(norm(s));
  if (!sh.size) continue;
  let h = 0;
  for (const x of sh) if (blogSh.has(x)) h++;
  if (h / sh.size >= SENT_COPY) copied.push(s.length > 60 ? s.slice(0, 60) + "…" : s);
}
const sharedQuotes = mag.quotes.filter((q) => blog.quotes.some((b) => b === q)).length;

const pass = containment <= MAX_CONTAINMENT;
console.log(JSON.stringify({
  magazine: D.rel(path.resolve(magPath)),
  blog: path.resolve(blogPath),
  containment: Math.round(containment * 1000) / 10 + "%",
  limit: MAX_CONTAINMENT * 100 + "%",
  copiedSentences: copied.length,
  sharedQuotes,
  pass,
  examples: copied.slice(0, 8),
  note: pass
    ? "통과 — 범위는 같아도 문장은 다르게 쓰였다"
    : "❌ 매거진 문장이 blog.md 와 너무 겹친다 — 범위·사실만 두고 문장·순서·구성을 새로 써라 (routine-draft.md S5)",
}, null, 2));
process.exit(pass ? 0 : 1);
