"use strict";
/*
  초안(docs/drafts/YYYY-MM-DD-<slug>.md) 파서 — publish-draft.js 와 prepare-images.js 가
  같은 규칙으로 읽어야 해서 한 곳에 둔다. 이미지 슬롯 정의가 두 스크립트에서 어긋나면
  발행본이 참조하는 파일명과 실제로 만든 파일명이 달라진다.
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

/** `# 제목` 부터 다음 `# ` 직전까지 */
function section(text, heading) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === `# ${heading}`);
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^# \S/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end).join("\n");
}

/** 섹션 안의 `## 이름` 한 줄짜리 값 */
function sub(sec, name) {
  const m = sec.match(new RegExp(`^## ${name}\\s*\\n+([^\\n]+)`, "m"));
  return m ? m[1].trim() : null;
}

/** 섹션 안의 `## 본문` 이하 전체 (하위 `## ` 소제목 포함) */
function subBody(sec, name) {
  const i = sec.search(new RegExp(`^## ${name}\\s*$`, "m"));
  if (i < 0) return null;
  return sec.slice(i).replace(new RegExp(`^## ${name}\\s*\\n`), "").replace(/\n*---\s*$/, "").trim();
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
  const manuscript = section(text, "초안 원고");
  if (!manuscript) die(`초안에 "# 초안 원고" 섹션이 없다: ${rel(file)}`);

  const title = sub(manuscript, "제목");
  const summary = sub(manuscript, "한 줄 요약");
  const bodyMd = subBody(manuscript, "본문");
  if (!title) die("초안에 `## 제목` 이 없다");
  if (!summary) die("초안에 `## 한 줄 요약` 이 없다");
  if (!bodyMd) die("초안에 `## 본문` 이 없다");

  const cover = {
    slot: "cover",
    file: "cover.jpg",
    desc: sub(manuscript, "대표 이미지 alt") || title,
    alt: sub(manuscript, "대표 이미지 alt") || title,
    prompt: sub(manuscript, "대표 이미지 프롬프트"),
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
  findDraft, parseFrontmatter, section, sub, subBody, parseMarker, loadDraft,
};
