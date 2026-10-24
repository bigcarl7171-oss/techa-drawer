#!/usr/bin/env node
/** 홈 도구 영역: 꽃 선물 대표 카드 4개 + 자주 쓰는 일상 도구 바로가기 줄 + /ko/ 허브. */
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
  // 2026-10-24 사장님: "도구 영역도 바로 클릭할 수 있게" — 대표 카드는 선물 도구 4개(이름 궁합 자리에 꽃 사진 꾸미기),
  // 그 아래 자주 쓰는 일상 도구 바로가기 줄(GA 상위: 로또·음력 변환·D-Day 등)을 둔다. 바로가기는 실제 있는 도구만.
  const cards = [...(section[0].match(/<div class="v2-tool-grid">([\s\S]*?)<\/div>/) || [, ''])[1].matchAll(/<a href="([^"]+)"/g)].map(m => m[1]);
  const requiredCards = ['/ko/dday/', '/ko/birth-flower/', '/ko/birth-stone/', '/frame/'];
  const registry = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'site.js'), 'utf8');
  const quick = links.filter(href => href.startsWith('/ko/') && href !== '/ko/' && !requiredCards.includes(href));
  const missingTool = quick.filter(href => !registry.includes('path: "' + href + '"'));
  if (cards.length !== 4 || requiredCards.some(href => !cards.includes(href)) || !links.includes('/ko/') || missingTool.length || section[0].includes('shell-tool-row')) {
    console.error('❌ 홈 도구 영역: 대표 카드 4개(' + requiredCards.join(' ') + ')와 /ko/ 허브, 실제 있는 도구 바로가기만 둡니다.' + (missingTool.length ? ' 없는 도구: ' + missingTool.join(' ') : ''));
    process.exit(1);
  }
  console.log('✅ 최신 상태 — 대표 카드 4개 + 일상 도구 바로가기 ' + quick.length + '개');
}

main();
