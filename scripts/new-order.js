#!/usr/bin/env node
/*
  다음 매거진 초안 "주문"을 넣는다.

  사람이 하는 일은 둘뿐이다:
    1) 아무 로컬 폴더에 레퍼런스 사진을 모은다 (파일명 자유, 이름순으로 01,02,… 이 된다)
    2) 이 스크립트를 한 번 돌린다

  그러면:
    - 사진을 3:2 · 1200px · q4 jpg 로 압축해 docs/drafts/refs/<slug>/ 에 넣는다
      (원본은 옮기지 않는다. 원본 보관은 각자 클라우드에)
    - docs/drafts/NEXT.md 주문서를 쓴다
    - 커밋·푸시하면 그게 시작 신호다. 다음 날 04:00 초안 루틴이 이걸 읽고 원고를 쓴다

  주문이 없으면(NEXT.md 의 slug 가 비면) 04:00 루틴은 아무것도 하지 않고 쉰다.

  사용법:
    node scripts/new-order.js <사진폴더> --slug <슬러그> [--topic <번호>]
                              [--title "제목 방향"] [--angle "각도 한 줄"] [--note "메모"]
                              [--dry-run]

  폴더 안에 order.md 또는 주제.md 가 있으면 그 내용을 메모로 함께 싣는다.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const die = (m) => { console.error("✖ " + m); process.exit(1); };
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const opt = (name) => { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : null; };
// 값이 따라붙는 플래그. 위치인자(사진폴더)를 고를 때 이 값들을 건너뛴다.
const VALUED = new Set(["slug", "topic", "title", "angle", "note"]);
let srcDir = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) { if (VALUED.has(a.slice(2))) i++; continue; }
  srcDir = a; break;
}

const SRC = srcDir ? path.resolve(srcDir) : null;
const slug = opt("slug");
const topic = opt("topic") || "none";
const title = opt("title") || "";
const angle = opt("angle") || "";
const note = opt("note") || "";

if (!SRC || !slug) die('사용법: node scripts/new-order.js <사진폴더> --slug <슬러그> [--topic N] [--title "…"] [--angle "…"]');
if (!/^[a-z0-9-]+$/.test(slug)) die("슬러그는 영소문자·숫자·하이픈만 쓴다: " + slug);
if (!fs.existsSync(SRC)) die("사진 폴더가 없다: " + SRC);

const EXT = [".jpg", ".jpeg", ".png", ".webp"];
const shots = fs.readdirSync(SRC)
  .filter((f) => EXT.includes(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "ko"));

// 폴더에 메모 파일이 있으면 읽는다
let folderNote = "";
for (const n of ["order.md", "주제.md", "주제.txt", "order.txt"]) {
  const p = path.join(SRC, n);
  if (fs.existsSync(p)) { folderNote = fs.readFileSync(p, "utf8").trim(); break; }
}

const refDir = path.join(ROOT, "docs", "drafts", "refs", slug);
const CROP_3_2 = "w='min(iw,ih*3/2)':h='min(ih,iw*2/3)'";
const FILTER = `crop=${CROP_3_2}:x='(iw-ow)/2':y='(ih-oh)/2',scale=1200:-2`;

const made = [];
if (!DRY) fs.mkdirSync(refDir, { recursive: true });
shots.forEach((f, i) => {
  const out = path.join(refDir, String(i + 1).padStart(2, "0") + ".jpg");
  if (!DRY) {
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(SRC, f), "-vf", FILTER, "-q:v", "4", out]);
    } catch (e) {
      if (e.code === "ENOENT") die("ffmpeg 을 찾을 수 없다 — 설치하거나 PATH 에 넣어야 한다");
      die(`ffmpeg 실패 (${f}): ${e.message}`);
    }
  }
  made.push({
    file: rel(out), from: f,
    kb: !DRY && fs.existsSync(out) ? Math.round(fs.statSync(out).size / 1024) : null,
  });
});

const nextPath = path.join(ROOT, "docs", "drafts", "NEXT.md");
const body = [
  "---",
  `slug: ${slug}`,
  `topic_no: ${topic}`,
  `title_hint: ${title}`,
  `angle: ${angle}`,
  `refs: docs/drafts/refs/${slug}/`,
  `ordered_at: ${new Date().toISOString().slice(0, 10)}`,
  "---",
  "",
  "<!-- 이 아래는 자유 메모. 넣을 것 / 피할 것 / 참고할 후기 등 -->",
  "",
  [note, folderNote].filter(Boolean).join("\n\n") || "(메모 없음)",
  "",
].join("\n");

if (!DRY) fs.writeFileSync(nextPath, body, "utf8");

console.log(JSON.stringify({
  slug, topic_no: topic, dryRun: DRY,
  source: SRC,
  refs: rel(refDir),
  images: made,
  order: rel(nextPath),
  note: made.length ? null : "⚠️ 사진이 0장이다 — 폴더를 확인해라",
  next: `git add docs/drafts/NEXT.md docs/drafts/refs/${slug} && git commit -m "주문: ${slug}" && git push`,
}, null, 2));
