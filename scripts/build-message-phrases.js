#!/usr/bin/env node
/**
 * /message/ 의 카드 문구를 정적 HTML로 찍는다.
 *
 * 왜 만들었나 — 2026-09-20 점검:
 *   문구 24개가 전부 <script> 안에 있어 크롤러에는 "상황과 말투를 고르세요" 라는
 *   안내문(403자)만 보였다. '환갑 축하 문구' 같은 검색어가 이 페이지의 존재 이유인데
 *   정작 그 내용이 소스에 없었다. 도구 목록·상품 CTA·전역 내비게이션과 같은 병이다.
 *
 * 설계 — 문구를 두 벌 두지 않는다:
 *   생성기가 상황×말투별 문구를 HTML로 찍고, 페이지 스크립트는 그 DOM 을 읽어
 *   보여줄 것만 고른다. 사람이 보는 것과 크롤러가 보는 것이 같은 하나의 원본이다.
 *
 * 단일 출처: data/message-phrases.json
 * 사용: node scripts/build-message-phrases.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const PAGE = path.join(ROOT, 'message', 'index.html');
const DATA_FILE = path.join(ROOT, 'data', 'message-phrases.json');

const CHOICE_BEGIN = '<!-- BEGIN message-occasions (생성: scripts/build-message-phrases.js — 직접 고치지 말 것) -->';
const CHOICE_END = '<!-- END message-occasions -->';
const LIST_BEGIN = '<!-- BEGIN message-phrases (생성: scripts/build-message-phrases.js — 직접 고치지 말 것) -->';
const LIST_END = '<!-- END message-phrases -->';

function buildChoices(data) {
  const occ = data.occasions
    .map((o) => `<button class="choice-btn" type="button" data-occasion="${esc(o.key)}">${esc(o.label)}</button>`)
    .join('');
  const tones = Object.entries(data.tones)
    .map(([k, label]) => `<button class="choice-btn" type="button" data-tone="${esc(k)}">${esc(label)}</button>`)
    .join('');
  return [
    CHOICE_BEGIN,
    '      <div class="choice-row" id="occasionChoices">' + occ + '</div>',
    '      <div class="choice-row" id="toneChoices">' + tones + '</div>',
    '      ' + CHOICE_END
  ].join('\n');
}

function buildList(data) {
  const out = [LIST_BEGIN];
  let n = 0;
  for (const o of data.occasions) {
    const tones = Object.keys(data.tones).filter((t) => o.phrases[t]);
    out.push(`    <section class="msg-group" data-occasion="${esc(o.key)}">`);
    out.push(`      <h3>${esc(o.label)} 카드 문구</h3>`);
    out.push(`      <p class="msg-lead">${esc(o.lead)}</p>`);
    for (const t of tones) {
      out.push(`      <div class="msg-tone" data-tone="${esc(t)}">`);
      out.push(`        <h4>${esc(data.tones[t])}</h4>`);
      for (const p of o.phrases[t]) {
        n++;
        out.push(
          '        <div class="msg-item"><p>' + esc(p) + '</p>' +
          '<span class="msg-len">' + [...p].length + '자</span>' +
          '<button class="copy-btn" type="button">복사하기</button></div>'
        );
      }
      out.push('      </div>');
    }
    out.push('    </section>');
  }
  out.push('    ' + LIST_END);
  return { markup: out.join('\n'), count: n };
}

function replaceBlock(html, begin, end, markup) {
  const b = html.indexOf(begin);
  const e = html.indexOf(end);
  if (b === -1 || e === -1 || e < b) return null;
  return html.slice(0, b) + markup + html.slice(e + end.length);
}

function main() {
  const check = process.argv.includes('--check');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // 어긋난 조합 방어 — tones 에 없는 말투를 쓰면 화면에서 버튼 없이 사라진다
  const errors = [];
  for (const o of data.occasions) {
    const tones = Object.keys(o.phrases);
    if (!tones.length) errors.push(`${o.key}: 문구가 하나도 없다`);
    for (const t of tones) {
      if (!data.tones[t]) errors.push(`${o.key}: tones 에 없는 말투 '${t}'`);
      if (!Array.isArray(o.phrases[t]) || !o.phrases[t].length) errors.push(`${o.key}/${t}: 문구가 비었다`);
    }
  }
  if (errors.length) { errors.forEach((e) => console.error('❌ ' + e)); process.exit(1); }

  const html = fs.readFileSync(PAGE, 'utf8');
  const eol = eolOf(html);
  const list = buildList(data);

  let next = replaceBlock(html, CHOICE_BEGIN, CHOICE_END, toEol(buildChoices(data), eol));
  if (next === null) { console.error('❌ message/index.html 에 message-occasions 마커가 없습니다.'); process.exit(1); }
  next = replaceBlock(next, LIST_BEGIN, LIST_END, toEol(list.markup, eol));
  if (next === null) { console.error('❌ message/index.html 에 message-phrases 마커가 없습니다.'); process.exit(1); }
  next = toEol(next, eol);

  const combos = data.occasions.reduce((s, o) => s + Object.keys(o.phrases).length, 0);
  if (next === html) {
    console.log(`✅ 최신 상태 — 상황 ${data.occasions.length} · 조합 ${combos} · 문구 ${list.count}개`);
    return;
  }
  if (check) {
    console.error(`❌ 카드 문구가 data/message-phrases.json 과 다릅니다. node scripts/build-message-phrases.js 를 실행하세요.`);
    process.exit(1);
  }
  fs.writeFileSync(PAGE, next);
  console.log(`✅ message/index.html 갱신 — 상황 ${data.occasions.length} · 조합 ${combos} · 문구 ${list.count}개를 정적 HTML로 생성`);
}

main();
