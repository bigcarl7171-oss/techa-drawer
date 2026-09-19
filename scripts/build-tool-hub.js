#!/usr/bin/env node
/**
 * /ko/ 도구 허브의 카테고리·카드 목록을 site.js 의 APPS/CATS 로 찍는다.
 *
 * 왜 만들었나: 이 페이지는 손으로 관리되고 있었고, 2026-09-20 에 도구를 하나
 * 추가하자마자 바로 어긋났다(허브 22개 / APPS 23개). 도구 목록을 다루는 화면 중
 * 여기만 생성기가 없었다 — 정작 목록이 존재 이유인 페이지인데.
 * CLAUDE.md 의 "목록은 손으로 고치지 않는다" 규칙을 이 페이지에도 적용한다.
 *
 * 사용: node scripts/build-tool-hub.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, readRegistry, esc, eolOf, toEol } = require('./lib/site-registry');

const HUB = path.join(ROOT, 'ko', 'index.html');
const BEGIN = '<!-- BEGIN tool-hub (생성: scripts/build-tool-hub.js — 직접 고치지 말 것) -->';
const END = '<!-- END tool-hub -->';
const INTRO_BEGIN = '<!-- BEGIN tool-hub-intro (생성: scripts/build-tool-hub.js) -->';
const INTRO_END = '<!-- END tool-hub-intro -->';

function buildList(apps, cats) {
  const live = apps.filter(a => a.status !== 'hidden');
  const out = [];
  for (const [key, cat] of Object.entries(cats)) {
    const mine = live.filter(a => a.cat === key);
    if (!mine.length) continue;
    out.push(`  <h2 class="cat-title" id="${esc(key)}">${esc(cat.emoji)} ${esc(cat.title)}</h2>`);
    out.push('  <div class="grid">');
    for (const a of mine) {
      out.push(
        `    <a class="app-card" href="${esc(a.path)}">` +
        `<div class="emoji">${esc(a.emoji)}</div>` +
        `<div class="name">${esc(a.name)}</div>` +
        `<div class="desc">${esc(a.desc)}</div></a>`
      );
    }
    out.push('  </div>');
    out.push('');
  }
  // 마지막 빈 줄 제거
  while (out.length && out[out.length - 1] === '') out.pop();
  return BEGIN + '\n' + out.join('\n') + '\n  ' + END;
}

function buildIntro(apps) {
  const n = apps.filter(a => a.status !== 'hidden').length;
  return INTRO_BEGIN + '\n' +
    `    회원가입도 앱 설치도 없이 바로 쓰는 생활 도구 ${n}가지입니다.\n` +
    '    입력한 값은 서버로 보내지 않고 브라우저 안에서만 계산합니다.\n' +
    '    ' + INTRO_END;
}

function replaceBlock(html, begin, end, markup) {
  const b = html.indexOf(begin);
  const e = html.indexOf(end);
  if (b === -1 || e === -1 || e < b) return null;
  return html.slice(0, b) + markup + html.slice(e + end.length);
}

function main() {
  const check = process.argv.includes('--check');
  const { APPS, CATS } = readRegistry();

  // 카테고리 누락 방어 — APPS 의 cat 이 CATS 에 없으면 화면에서 통째로 사라진다
  const unknown = [...new Set(APPS.map(a => a.cat))].filter(c => !CATS[c]);
  if (unknown.length) {
    console.error('❌ CATS 에 없는 카테고리: ' + unknown.join(', '));
    process.exit(1);
  }

  const html = fs.readFileSync(HUB, 'utf8');
  const eol = eolOf(html);
  let next = replaceBlock(html, BEGIN, END, toEol(buildList(APPS, CATS), eol));
  if (next === null) {
    console.error('❌ /ko/index.html 에 tool-hub 마커가 없습니다.');
    process.exit(1);
  }
  const withIntro = replaceBlock(next, INTRO_BEGIN, INTRO_END, toEol(buildIntro(APPS), eol));
  if (withIntro === null) {
    console.error('❌ /ko/index.html 에 tool-hub-intro 마커가 없습니다.');
    process.exit(1);
  }
  next = withIntro;

  // 제목·메타·스키마에 도구 개수가 숫자로 박혀 있다. 2026-09-20 에 도구를 하나 늘리자
  // 다섯 군데가 한꺼번에 22가지로 남았다. 이 파일 안의 '도구 N가지' 는 전부 도구 수를
  // 가리키므로 여기서 같이 맞춘다 (본문의 '5가지 방법' 같은 표현과 달리 '도구' 가 앞에 붙는다).
  next = next.replace(/도구 \d+가지/g, `도구 ${APPS.filter(a => a.status !== 'hidden').length}가지`);
  next = toEol(next, eol);

  const n = APPS.filter(a => a.status !== 'hidden').length;
  if (next === html) {
    console.log(`✅ 최신 상태 — 도구 허브 ${n}개`);
    return;
  }
  if (check) {
    console.error(`❌ 도구 허브가 site.js 와 다릅니다 (도구 ${n}개). node scripts/build-tool-hub.js 를 실행하세요.`);
    process.exit(1);
  }
  fs.writeFileSync(HUB, next);
  console.log(`✅ /ko/index.html 갱신 — 도구 허브 ${n}개`);
}

main();
