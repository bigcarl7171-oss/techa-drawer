#!/usr/bin/env node
/*
  초안의 이미지 자리를 실제 파일로 채운다.

  슬롯은 초안이 정한다:
    ## 대표 이미지 alt        → cover.jpg
    [이미지 자리 N: …]        → img-N.jpg
  (publish-draft.js 와 같은 파서를 쓴다 — scripts/lib/draft.js)

  소스 (파일명은 cover.* / 1.* / 2.* … , img-1.* 도 받는다):
    --from <dir>          기본은 AI 생성분 취급 — 우하단 워터마크를 잘라낸다(좌상단 기준 3:2 크롭)
    --from <dir> --photo  직접 촬영본 취급 — 워터마크가 없으니 가운데 기준 3:2 크롭
    docs/drafts/images/<slug>/  로컬 스크래치(gitignore). 있으면 --from 보다 우선, 가운데 크롭.

  없는 슬롯은 missing 으로 보고한다 → 스킬이 그 슬롯만 힉스필드로 생성한다.
  원본 PNG·고해상도 사진은 저장소에 옮기지 않는다.

  사용법:
    node scripts/prepare-images.js <slug> --from <스크래치폴더> [--photo] [--dry-run]
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const D = require("./lib/draft");
const { ROOT, die, rel } = D;

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith("-"));
const DRY = argv.includes("--dry-run");
const PHOTO = argv.includes("--photo");   // --from 을 직접 촬영본으로 취급(가운데 크롭)
const fromIdx = argv.indexOf("--from");
const FROM = fromIdx >= 0 ? path.resolve(argv[fromIdx + 1] || "") : null;
if (!slug) die("사용법: node scripts/prepare-images.js <slug> --from <dir> [--photo]");
if (FROM && !fs.existsSync(FROM)) die(`--from 폴더가 없다: ${FROM}`);

const d = D.loadDraft(slug);
const shotDir = path.join(ROOT, "docs", "drafts", "images", slug);   // 로컬 스크래치(gitignore)
const outDir = path.join(ROOT, "blog", slug);

// 3:2 크롭 — 치수를 미리 몰라도 되게 ffmpeg 표현식으로 계산한다(ffprobe 불필요).
const CROP_3_2 = "w='min(iw,ih*3/2)':h='min(ih,iw*2/3)'";
const FILTER = {
  // AI 생성분: 워터마크가 우하단에 있으니 좌상단(0:0)에서 자른다
  watermark: `crop=${CROP_3_2}:x=0:y=0,scale=1200:-2`,
  // 직접 촬영본: 가운데를 남긴다
  photo: `crop=${CROP_3_2}:x='(iw-ow)/2':y='(ih-oh)/2',scale=1200:-2`,
};

const EXT = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];
function findSource(dir, im) {
  if (!dir || !fs.existsSync(dir)) return null;
  const stems = im.slot === "cover" ? ["cover"] : [String(im.slot), `img-${im.slot}`];
  for (const stem of stems) {
    for (const ext of EXT) {
      const p = path.join(dir, stem + ext);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const filled = [];
const kept = [];
const missing = [];
if (!DRY) fs.mkdirSync(outDir, { recursive: true });

for (const im of d.images) {
  const fromSrc = findSource(FROM, im);
  const shot = findSource(shotDir, im);
  const src = shot || fromSrc;         // 로컬 스크래치 > --from
  // shotDir 는 항상 직접 촬영본. --from 은 --photo 면 촬영본, 아니면 AI(워터마크).
  const mode = shot || PHOTO ? "photo" : "watermark";
  const dest = path.join(outDir, im.file);

  if (!src) {
    // 소스는 없지만 발행 폴더에 이미 파일이 있으면 그대로 둔다 (재발행·부분 재실행)
    if (fs.existsSync(dest)) { kept.push({ slot: im.slot, file: im.file, alt: im.alt }); continue; }
    missing.push({ slot: im.slot, file: im.file, alt: im.alt, desc: im.desc, prompt: im.prompt });
    continue;
  }
  if (!DRY) {
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", FILTER[mode], "-q:v", "4", dest]);
    } catch (e) {
      if (e.code === "ENOENT") die("ffmpeg 을 찾을 수 없다 — 설치하거나 PATH 에 넣어야 이미지를 만들 수 있다");
      die(`ffmpeg 실패 (${rel(src)} → ${rel(dest)}): ${e.message}`);
    }
  }
  filled.push({
    slot: im.slot, file: im.file, alt: im.alt,
    from: rel(src), mode,
    kb: !DRY && fs.existsSync(dest) ? Math.round(fs.statSync(dest).size / 1024) : null,
  });
}

console.log(JSON.stringify({
  slug, dryRun: DRY,
  sources: { localScratch: rel(shotDir), from: FROM ? rel(FROM) : null, fromMode: PHOTO ? "photo" : "watermark" },
  filled, kept, missing,
  note: missing.length
    ? `빈 슬롯 ${missing.length}개 — prompt 로 생성한 뒤 --from 으로 다시 실행`
    : "모든 슬롯 채움",
}, null, 2));
