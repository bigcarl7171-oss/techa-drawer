#!/usr/bin/env node
/**
 * 도구 페이지 하단의 "관련 도구" 블록을 정적 HTML로 구워 넣는다.
 *
 * 왜 필요한가 — 관련 도구 링크는 원래부터 있었다. 다만 site.js 의 renderRelated()가
 * 브라우저에서 <div id="related"> 안을 채우는 방식이라 HTML 소스에는 한 줄도 없었다.
 * 그래서 도구 22개 중 15개가 사이트 안에서 정적 피링크 1개(=/ko/ 목록)짜리로 남았고,
 * 그 15개는 구글 색인에도 거의 안 잡혀 있다 (2026-09-19 확인).
 *
 * 목록·연결 관계의 단일 출처는 그대로다:
 *   - 어떤 도구가 있는가        → assets/js/site.js 의 APPS
 *   - 어느 도구끼리 묶이는가    → 각 도구 페이지의 initPage({ related:[...] })
 *                                 (지정 안 했으면 같은 카테고리 자동 — JS와 같은 규칙)
 *
 * 사용: node scripts/build-related.js [--check]
 *   --check  파일을 고치지 않고 최신 상태인지만 확인한다 (게이트용, 어긋나면 exit 1)
 */
const fs = require('fs');
const path = require('path');
const { ROOT, readRegistry, esc, eolOf, toEol } = require('./lib/site-registry');

const BEGIN = '<!-- BEGIN related (생성: scripts/build-related.js — 직접 고치지 말 것) -->';
const END = '<!-- END related -->';

// initPage({ ... }) 에서 이 페이지의 slug/category/related 를 읽는다.
function readPageOpts(html) {
  const m = html.match(/TECHA\.initPage\(\s*\{([\s\S]*?)\}\s*\)/);
  if (!m) return null;
  const body = m[1];
  const str = (k) => {
    const mm = body.match(new RegExp(k + '\\s*:\\s*"([^"]*)"'));
    return mm ? mm[1] : null;
  };
  const rel = body.match(/related\s*:\s*\[([^\]]*)\]/);
  return {
    slug: str('slug'),
    category: str('category'),
    related: rel
      ? rel[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : null,
  };
}

// site.js 의 renderRelated() 와 같은 규칙: related 지정이 있으면 그 순서대로,
// 없으면 같은 카테고리의 나머지 도구.
function pickRelated(opts, APPS) {
  const byslug = (s) => APPS.find((a) => a.slug === s);
  const list = opts.related
    ? opts.related.map(byslug).filter(Boolean)
    : APPS.filter((a) => a.cat === opts.category && a.slug !== opts.slug);
  return list.filter((a) => a.status === 'live');
}

function buildMarkup(list) {
  if (!list.length) return '';
  return (
    '    <h2>관련 도구</h2>\n    <div class="related-list">' +
    list.map((a) => `<a href="${esc(a.path)}">${a.emoji} ${esc(a.name)}</a>`).join('') +
    '</div>'
  );
}

function main() {
  const check = process.argv.includes('--check');
  const { APPS } = readRegistry();
  const koDir = path.join(ROOT, 'ko');

  let changed = [];
  let linkTotal = 0;
  let skipped = [];

  for (const slug of fs.readdirSync(koDir)) {
    const file = path.join(koDir, slug, 'index.html');
    if (!fs.statSync(path.join(koDir, slug)).isDirectory() || !fs.existsSync(file)) continue;

    const html = fs.readFileSync(file, 'utf8');
    const opts = readPageOpts(html);
    if (!opts || !opts.slug) { skipped.push(slug + ' (initPage 없음)'); continue; }

    const list = pickRelated(opts, APPS);
    if (!list.length) { skipped.push(slug + ' (관련 도구 0개)'); continue; }
    linkTotal += list.length;

    const eol = eolOf(html);
    const block = toEol(`${BEGIN}\n${buildMarkup(list)}\n    ${END}`, eol);
    let next;
    const b = html.indexOf(BEGIN);
    if (b !== -1) {
      const e = html.indexOf(END);
      next = html.slice(0, b) + block + html.slice(e + END.length);
    } else {
      // 빈 슬롯을 처음 채우는 경우. class="related" 는 JS가 붙이던 것이라 여기서 박아둔다.
      const empty = '<div id="related"></div>';
      if (!html.includes(empty)) { skipped.push(slug + ' (related 슬롯 없음)'); continue; }
      next = html.replace(empty,
        toEol('<div id="related" class="related">\n    ', eol) + block + toEol('\n  </div>', eol));
    }

    if (next !== html) {
      if (!check) fs.writeFileSync(file, next);
      changed.push(slug);
    }
  }

  if (skipped.length) console.log('  건너뜀: ' + skipped.join(', '));
  if (changed.length && check) {
    console.error(`❌ 관련 도구 블록이 어긋난다 (${changed.length}개: ${changed.join(', ')}). node scripts/build-related.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length
    ? `✅ ${changed.length}개 페이지 갱신 — 관련 도구 링크 ${linkTotal}개를 정적 HTML로 생성`
    : `✅ 최신 상태 — 관련 도구 링크 ${linkTotal}개`);
}

main();
