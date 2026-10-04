#!/usr/bin/env node
/**
 * 페이지에 이미 보이는 '자주 묻는 질문'을 FAQPage 스키마(JSON-LD)로 찍는다.
 *
 * 왜 — 2026-10-04 점검: /care/(관리법)에는 스키마가 하나도 없었고, /contact/ 의 FAQ 6개도
 * 화면에만 있었다. 문답을 새로 쓰지 않는다 — 화면의 문답을 그대로 옮긴다. 화면과 스키마가
 * 다르면 검색엔진이 스키마를 무시하므로, 화면 문답을 고치면 이 스크립트를 다시 돌린다.
 * (구글은 2023년부터 FAQ 리치 결과를 정부·의료 사이트에만 보여준다. 그래도 Bing 과
 *  AI 검색은 이 구조를 읽는다 — 2026-10-04 업체 스키마를 넣은 것과 같은 이유다.)
 *
 * 읽는 모양 두 가지:
 *   <h3>Q. 질문</h3> <p>답</p>                          (care, 도구 페이지)
 *   <details><summary>질문</summary><p>답</p></details>  (contact 의 .btob-faq)
 *
 * 사용: node scripts/build-faq-schema.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, eolOf, toEol } = require('./lib/site-registry');

const BEGIN = '<!-- BEGIN faq-schema (생성: scripts/build-faq-schema.js — 직접 고치지 말 것) -->';
const END = '<!-- END faq-schema -->';
const PAGES = ['care/index.html', 'contact/index.html', 'ko/birth-flower/index.html'];

const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

function extract(html) {
  const body = html.slice(html.indexOf('<main'));
  const qa = [];
  for (const m of body.matchAll(/<h3>\s*Q\.\s*([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)) qa.push([text(m[1]), text(m[2])]);
  for (const m of body.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)) qa.push([text(m[1]), text(m[2])]);
  return qa;
}

function markup(qa) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return [BEGIN, '<script type="application/ld+json">', JSON.stringify(data, null, 2), '</script>', END].join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const changed = [];
  let total = 0;
  for (const rel of PAGES) {
    const file = path.join(ROOT, rel);
    const html = fs.readFileSync(file, 'utf8');
    const eol = eolOf(html);
    const qa = extract(html);
    if (!qa.length) { console.error(`❌ ${rel}: 자주 묻는 질문을 못 찾음`); process.exit(1); }
    total += qa.length;
    const block = toEol(markup(qa), eol);
    let next;
    const b = html.indexOf(BEGIN);
    if (b !== -1) next = html.slice(0, b) + block + html.slice(html.indexOf(END, b) + END.length);
    else next = html.replace('</head>', block + eol + '</head>');
    if (next !== html) {
      if (!check) fs.writeFileSync(file, next);
      changed.push(rel);
    }
  }
  if (changed.length && check) {
    console.error(`❌ FAQ 스키마가 화면과 어긋난다 (${changed.join(', ')}). node scripts/build-faq-schema.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length ? `✅ ${changed.length}쪽 갱신 — 문답 ${total}개` : `✅ 최신 상태 — ${PAGES.length}쪽 문답 ${total}개`);
}

main();
