"use strict";
/*
  초안(docs/drafts/YYYY-MM-DD-<slug>.md) 파서 — publish-draft.js 와 prepare-images.js 가
  같은 규칙으로 읽어야 해서 한 곳에 둔다. 이미지 슬롯 정의가 두 스크립트에서 어긋나면
  발행본이 참조하는 파일명과 실제로 만든 파일명이 달라진다.

  ⚠️ 제목의 '#' 개수에 의존하지 않는다. 초안을 쓰는 건 매일 도는 루틴이고, 같은 지시로도
  전부 `##` 로 평평하게 쓸 때가 있다(2026-08-24 실제로 그래서 파서가 멈췄다).
  절을 이름으로 찾고, 끝나는 지점은 '같거나 더 얕은 레벨의 다음 제목'으로 잡는다.
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

// 저장소 HTML·XML은 CRLF다. \n 으로 정규화해 다루고, 쓸 때 원래 줄바꿈으로 되돌린다
// (안 그러면 한 줄 고쳐도 파일 전체가 diff 로 잡힌다).
const EOL = new Map();
function readText(p) {
  const raw = fs.readFileSync(p, "utf8");
  EOL.set(p, raw.includes("\r\n") ? "\r\n" : "\n");
  return raw.replace(/\r\n/g, "\n");
}
function writeText(p, text) {
  fs.writeFileSync(p, EOL.get(p) === "\r\n" ? text.replace(/\n/g, "\r\n") : text);
}
function setEol(p, like) { EOL.set(p, EOL.get(like) || "\n"); }

function die(msg) { console.error("✖ " + msg); process.exit(1); }
function rel(p) { return path.relative(ROOT, p).split(path.sep).join("/"); }
function assertRepo() {
  if (!fs.existsSync(path.join(ROOT, "techa-brand-rules.md"))) {
    die("여기는 techa-drawer 저장소가 아니다: " + ROOT);
  }
}

/** docs/drafts/ 에서 <slug> 초안 파일을 찾는다 (네이버판 제외, 최신 날짜 우선) */
function findDraft(slug) {
  const dir = path.join(ROOT, "docs", "drafts");
  const hits = fs.readdirSync(dir)
    .filter((f) => f.endsWith(`-${slug}.md`) && !f.endsWith("-naver.md"))
    .sort().reverse();
  if (!hits.length) die(`docs/drafts/ 에 *-${slug}.md 초안이 없다`);
  return path.join(dir, hits[0]);
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

/** 제목 줄이면 {level, title}, 아니면 null */
function heading(line) {
  const m = line.match(/^(#{1,6})\s+(.*?)\s*$/);
  return m ? { level: m[1].length, title: m[2] } : null;
}

/**
 * 이름으로 절을 찾는다. '#' 개수는 상관없다.
 * 절은 같거나 더 얕은 레벨의 다음 제목 직전에서 끝난다.
 * @returns {{level:number, body:string}|null}
 */
function section(text, name) {
  const lines = text.split("\n");
  let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = heading(lines[i]);
    if (h && h.title === name) { start = i; level = h.level; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const h = heading(lines[i]);
    if (h && h.level <= level) { end = i; break; }
  }
  return { level, body: lines.slice(start + 1, end).join("\n") };
}

/** 이름으로 찾은 절의 첫 내용 줄 (제목·요약처럼 한 줄짜리 값) */
function sectionLine(text, name) {
  const s = section(text, name);
  if (!s) return null;
  const line = s.body.split("\n").map((l) => l.trim()).find(Boolean);
  return line || null;
}

/*
  이미지 자리 마커
    [이미지 자리 1: 설명 — alt: 대체텍스트 — prompt: English generation prompt]
  `— ` 로 끊고 `키: 값` 을 찾는다. alt·prompt 는 없어도 된다(없으면 설명을 alt 로 쓰고,
  prompt 가 없으면 자동 생성 대상에서 빠져 사람이 사진을 넣어야 한다).

  구분자는 em dash 가 규격이지만 en dash·하이픈도 받는다 — 초안을 쓰는 쪽이 글자를
  바꿔 쓰면 alt·prompt 가 통째로 설명에 먹혀 조용히 사라지기 때문이다.
*/
const IMG_MARKER = /^\[이미지 자리\s*(\d+)\s*:\s*(.+?)\]$/;
function parseMarker(line) {
  const m = line.trim().match(IMG_MARKER);
  if (!m) return null;
  const parts = m[2].split(/\s+[—–-]\s+/);
  const slot = Number(m[1]);
  const out = { slot, file: `img-${slot}.jpg`, desc: parts[0].trim(), alt: null, prompt: null };
  for (const p of parts.slice(1)) {
    const kv = p.match(/^(alt|prompt)\s*:\s*([\s\S]+)$/i);
    if (kv) out[kv[1].toLowerCase()] = kv[2].trim();
  }
  out.alt = out.alt || out.desc;
  return out;
}

/** 초안 한 벌을 읽어 발행에 필요한 것만 뽑는다 */
function loadDraft(slug) {
  assertRepo();
  const file = findDraft(slug);
  const text = readText(file);
  const fm = parseFrontmatter(text);

  // '초안 원고' 절은 있으면 그 안에서, 없으면 문서 전체에서 찾는다.
  // 루틴이 전부 같은 레벨로 평평하게 쓰면 '초안 원고' 절이 바로 다음 제목에서
  // 끝나버려 비어 보인다 — 그때는 문서 전체를 훑는 쪽이 맞다.
  const ms = section(text, "초안 원고");
  const scope = ms && ms.body.includes("## ") ? ms.body : text;

  const title = sectionLine(scope, "제목");
  const summary = sectionLine(scope, "한 줄 요약");
  const bodySec = section(scope, "본문");
  if (!title) die(`초안에 "제목" 절이 없다: ${rel(file)}`);
  if (!summary) die(`초안에 "한 줄 요약" 절이 없다: ${rel(file)}`);
  if (!bodySec) die(`초안에 "본문" 절이 없다: ${rel(file)}`);
  const bodyMd = bodySec.body.replace(/\n*---\s*$/, "").trim();

  const coverAlt = sectionLine(scope, "대표 이미지 alt") || title;
  const cover = {
    slot: "cover",
    file: "cover.jpg",
    desc: coverAlt,
    alt: coverAlt,
    prompt: sectionLine(scope, "대표 이미지 프롬프트"),
  };
  const body = bodyMd.split("\n").map(parseMarker).filter(Boolean);

  return {
    slug, file, text, fm,
    date: fm.date || new Date().toISOString().slice(0, 10),
    status: fm.status || "draft",
    title, summary, bodyMd,
    images: [cover, ...body],
  };
}

module.exports = {
  ROOT, readText, writeText, setEol, die, rel, assertRepo,
  findDraft, parseFrontmatter, heading, section, sectionLine, parseMarker, loadDraft,
};
