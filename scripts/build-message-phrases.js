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
  // 버튼마다 짝이 되는 상대를 함께 찍는다. 화면 스크립트는 이걸 보고 짝이 없는
  // 버튼을 잠근다 — 눌렀더니 결과가 0개인 조합을 사용자가 만나지 않게 하기 위해서다.
  const occ = data.occasions
    .map((o) => {
      const ts = Object.keys(data.tones).filter((t) => o.phrases[t]).join(' ');
      return `<button class="choice-btn" type="button" data-occasion="${esc(o.key)}" data-tones="${esc(ts)}">${esc(o.label)}</button>`;
    })
    .join('');
  const tones = Object.entries(data.tones)
    .map(([k, label]) => {
      const os = data.occasions.filter((o) => o.phrases[k]).map((o) => o.key).join(' ');
      return `<button class="choice-btn" type="button" data-tone="${esc(k)}" data-occasions="${esc(os)}">${esc(label)}</button>`;
    })
    .join('');
  return [
    CHOICE_BEGIN,
    '      <p class="picker-label" id="picker-title">상황</p>',
    '      <div class="choice-row" id="occasionChoices" role="group" aria-labelledby="picker-title">' + occ + '</div>',
    '      <p class="picker-label" id="tone-title">말투</p>',
    '      <div class="choice-row" id="toneChoices" role="group" aria-labelledby="tone-title"><button class="choice-btn tone-all" type="button" data-tone-all>전체</button>' + tones + '</div>',
    '      ' + CHOICE_END
  ].join('\n');
}

// 상황마다 한 묶음, 그 안은 말투 머리 없이 한 줄 목록이다 (2026-09-22 개편).
// 전에는 상황 12 × 말투 6 의 소제목이 전부 펼쳐져 페이지가 끝없이 길었다.
// 말투는 줄마다 data-tone 으로 달고, 화면 스크립트가 고른 상황 한 묶음만 보여준다.
function buildList(data) {
  const out = [LIST_BEGIN];
  const toneKeys = Object.keys(data.tones);
  let n = 0;
  for (const o of data.occasions) {
    out.push(`    <section class="msg-group" id="m-${esc(o.key)}" data-occasion="${esc(o.key)}">`);
    out.push(`      <h3>${esc(o.label)} 카드 문구</h3>`);
    out.push(`      <p class="msg-lead">${esc(o.lead)}</p>`);
    out.push('      <ul class="msg-list">');
    for (const t of toneKeys.filter((k) => o.phrases[k])) {
      for (const p of o.phrases[t]) {
        n++;
        out.push(
          `        <li class="msg-item" data-tone="${esc(t)}"><p>${esc(p)}</p>` +
          `<span class="msg-meta">${esc(data.tones[t])} · ${[...p].length}자</span>` +
          '<button class="copy-btn" type="button">복사</button></li>'
        );
      }
    }
    out.push('      </ul>');
    out.push('    </section>');
  }
  out.push('    ' + LIST_END);
  return { markup: out.join('\n'), count: n };
}

// 페이지 곳곳에 적힌 "문구 NN개" 를 사람이 손으로 맞추면 반드시 틀어진다.
// 2026-09-20에 실제로 44/88 이 박힌 채 데이터만 늘어난 적이 있다. 생성기가 찍는다.
// initPage 의 desc 는 build-chrome.js 가 page-head 로 옮겨 적으므로,
// 이 생성기는 반드시 build-chrome.js 보다 먼저 돌아야 한다(check-publish.sh 순서).
function syncCounts(html, occasions, phrases) {
  return html
    .replace(/카드 문구 \d+개/g, `카드 문구 ${phrases}개`)
    .replace(/상황 \d+가지, 문구 \d+개/g, `상황 ${occasions}가지, 문구 ${phrases}개`);
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
  // _excluded 는 "왜 이 칸이 비어 있는지" 를 적어두는 곳이다. 문구를 채우고 나서도
  // 여기 남아 있으면 설명과 실제가 어긋나므로 잡는다.
  for (const key of Object.keys(data._excluded || {})) {
    const [ok, tk] = key.split('/');
    const o = data.occasions.find((x) => x.key === ok);
    if (!o) errors.push(`_excluded 의 '${key}' — 그런 상황이 없다`);
    else if (o.phrases[tk]) errors.push(`_excluded 의 '${key}' — 문구가 이미 있다. 이 줄을 지우세요`);
  }
  // 빠진 칸은 전부 _excluded 에 이유가 적혀 있어야 한다 (화면에서 잠글 근거가 된다)
  for (const o of data.occasions) {
    for (const t of Object.keys(data.tones)) {
      if (!o.phrases[t] && !(data._excluded || {})[`${o.key}/${t}`]) {
        errors.push(`${o.key}/${t}: 문구도 없고 _excluded 에 이유도 없다`);
      }
    }
  }
  // 카드 한 장 기준(data.card.max) — 실제 주문 문구 평균 25자에서 잡은 상한이다.
  // 이보다 긴 문구는 카드에 두 줄로 안 들어가 손님이 줄여 쓰게 된다.
  const max = (data.card || {}).max;
  if (!max) errors.push('card.max 가 없다');
  for (const o of data.occasions) {
    for (const [t, list] of Object.entries(o.phrases)) {
      for (const p of list || []) {
        if ([...p].length > max) errors.push(`${o.key}/${t}: ${[...p].length}자 — 카드 기준 ${max}자를 넘는다: ${p}`);
      }
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
  next = syncCounts(next, data.occasions.length, list.count);
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
