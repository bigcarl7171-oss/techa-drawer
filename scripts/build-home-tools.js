#!/usr/bin/env node
/**
 * 홈(index.html)의 "전체 도구" 표를 정적 HTML로 구워 넣는다.
 *
 * 왜 필요한가 — 이 표는 원래 site.js의 APPS 레지스트리를 읽어 브라우저에서 그렸다.
 * 그래서 index.html 소스에는 도구 22개 중 7개 주소만 있었고, 나머지 15개는 HTML에
 * 아예 없었다. 크롤러가 홈에서 그 15개로 가는 길을 못 찾는 상태였고, 실제로 그
 * 15개는 구글 색인에 거의 안 잡혀 있다 (2026-09-19 확인).
 *
 * 목록의 단일 출처는 여전히 assets/js/site.js 의 APPS/CATS 다. 이 스크립트는 그걸
 * 읽어 마크업만 생성한다 — 손으로 복붙하면 둘이 어긋나기 때문에 스크립트로 둔다.
 * 도구를 추가·수정했으면 site.js 를 고친 뒤 이 스크립트를 다시 돌린다.
 *
 * 사용: node scripts/build-home-tools.js [--check]
 *   --check  파일을 고치지 않고 최신 상태인지만 확인한다 (게이트용, 어긋나면 exit 1)
 */
const fs = require('fs');
const path = require('path');
const { ROOT, readRegistry, esc, eolOf, toEol } = require('./lib/site-registry');

const INDEX = path.join(ROOT, 'index.html');

const BEGIN = '<!-- BEGIN tool-table (생성: scripts/build-home-tools.js — 직접 고치지 말 것) -->';
const END = '<!-- END tool-table -->';

function buildMarkup({ CATS, APPS }) {
  const lines = [];
  let groupIndex = 0;
  for (const key of Object.keys(CATS)) {
    const apps = APPS.filter((a) => a.cat === key && a.status === 'live');
    if (!apps.length) continue;
    const delay = Math.min(groupIndex, 4) * 0.05;
    lines.push(`      <div class="shell-table-group reveal" id="cat-${key}" style="transition-delay:${delay}s">`);
    lines.push(`        <div class="shell-table-cat">${CATS[key].emoji} ${esc(CATS[key].title)}</div>`);
    for (const a of apps) {
      lines.push(
        `        <a class="shell-tool-row" href="${esc(a.path)}" data-name="${esc((a.name + ' ' + a.desc).toLowerCase())}">` +
        `<span class="shell-tool-emoji" aria-hidden="true">${a.emoji}</span>` +
        `<div class="shell-tool-info"><div class="shell-tool-name">${esc(a.name)}</div>` +
        `<div class="shell-tool-desc">${esc(a.desc)}</div></div></a>`
      );
    }
    lines.push('      </div>');
    groupIndex++;
  }
  return lines.join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const reg = readRegistry();
  const markup = buildMarkup(reg);
  const html = fs.readFileSync(INDEX, 'utf8');

  const b = html.indexOf(BEGIN);
  const e = html.indexOf(END);
  if (b === -1 || e === -1) {
    console.error('❌ index.html 에 tool-table 마커가 없다. BEGIN/END 주석을 먼저 넣을 것.');
    process.exit(1);
  }

  const block = toEol(`${BEGIN}\n${markup}\n    ${END}`, eolOf(html));
  const next = html.slice(0, b) + block + html.slice(e + END.length);

  const count = (markup.match(/class="shell-tool-row"/g) || []).length;
  if (next === html) {
    console.log(`✅ 최신 상태 — 도구 ${count}개`);
    return;
  }
  if (check) {
    console.error(`❌ 홈의 도구 표가 site.js 와 어긋난다. node scripts/build-home-tools.js 를 돌릴 것`);
    process.exit(1);
  }
  fs.writeFileSync(INDEX, next);
  console.log(`✅ index.html 갱신 — 도구 ${count}개를 정적 HTML로 생성`);
}

main();
