#!/usr/bin/env node
/** 홈에는 꽃 선물과 직접 관련된 대표 도구 4개만 노출되는지 확인한다. */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/site-registry');

const INDEX = path.join(ROOT, 'index.html');

function main() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const section = html.match(/<section class="home-section home-tools-section[\s\S]*?<\/section>/);
  if (!section) throw new Error('홈 대표 도구 영역이 없습니다.');
  const links = [...section[0].matchAll(/<a href="([^"]+)"/g)].map(m => m[1]);
  // 2026-09-22: 메시지·선물 추천은 홈 위쪽 칸과 겹쳐서, 겹치지 않는 선물 도구로 바꿨다
  // (선물 맥락 도구 — techa-publish S3 의 birth-flower·birth-stone·dday·name-match).
  const required = ['/ko/dday/', '/ko/birth-flower/', '/ko/birth-stone/', '/ko/name-match/', '/ko/'];
  const unrelated = links.filter(href => href.startsWith('/ko/') && !required.includes(href));
  if (required.some(href => !links.includes(href)) || unrelated.length || section[0].includes('shell-tool-row')) {
    console.error('❌ 홈에는 선물 관련 대표 도구 4개와 /ko/ 허브 링크만 있어야 합니다.');
    process.exit(1);
  }
  console.log('✅ 최신 상태 — 선물 관련 대표 도구 4개');
}

main();
