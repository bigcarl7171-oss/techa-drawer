#!/usr/bin/env node
/**
 * IndexNow 로 Bing(→ ChatGPT 검색)·Naver·Yandex 등에 "이 주소 바뀌었다"고 알린다.
 *
 * 왜 만들었나 — 2026-10-04 AI 검색 노출 점검:
 *   ChatGPT 의 웹검색은 Bing 색인 비중이 크다. 그런데 이 사이트는 Bing 쪽 등록이 전혀 없었다.
 *   IndexNow 는 키 파일 하나로 인증되고, 한 번 보내면 참여 엔진끼리 공유한다.
 *   (구글은 IndexNow 를 쓰지 않는다 — 구글은 서치콘솔 색인 요청 그대로.)
 *
 * 키 파일: 저장소 루트의 <KEY>.txt (내용 = 키). 키를 바꾸면 파일명과 아래 KEY 를 같이 바꾼다.
 * 반드시 배포가 끝난 뒤(라이브 200) 보낸다 — 엔진이 키 파일과 페이지를 바로 확인하러 온다.
 *
 * 사용:
 *   node scripts/indexnow.js blog/<slug>/ about/ [...]       주소 몇 개 (홈은 'home')
 *     ⚠️ 앞에 / 를 붙이지 않는다. 윈도우 Git Bash 가 /about/ 을 C:/Program Files/Git/about/ 로
 *     바꿔 넘긴다(2026-10-04 실제로 422 가 났다). 전체 주소(https://www.techa.kr/...)는 괜찮다.
 *   node scripts/indexnow.js --sitemap                      사이트맵 전체 (처음 한 번, 대규모 개편 뒤)
 *   --dry 를 붙이면 보내지 않고 목록만 출력
 */
const fs = require('fs');
const path = require('path');

const HOST = 'www.techa.kr';
const KEY = 'a29906a1f328835b6d3a7784f646be5e';
const ROOT = path.join(__dirname, '..');

function sitemapUrls() {
  const out = [];
  for (const f of ['sitemap.xml']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) out.push(m[1].trim());
  }
  return [...new Set(out)];
}

function toUrl(a) {
  if (a.startsWith('http')) return a;
  if (a === 'home') return 'https://' + HOST + '/';
  return 'https://' + HOST + '/' + a.replace(/^\/+/, '');
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  if (!fs.existsSync(path.join(ROOT, KEY + '.txt'))) {
    console.error('❌ 키 파일 ' + KEY + '.txt 가 저장소 루트에 없습니다.');
    process.exit(1);
  }
  const urls = args.includes('--sitemap')
    ? sitemapUrls()
    : args.filter((a) => !a.startsWith('--')).map(toUrl);
  const bad = urls.filter((u) => !u.startsWith('https://' + HOST + '/') || u.includes(':/', 'https://'.length));
  if (bad.length) {
    console.error('❌ techa.kr 주소가 아님 (Git Bash 경로 변환?): ' + bad.join(', '));
    process.exit(1);
  }
  if (!urls.length) {
    console.error('사용: node scripts/indexnow.js blog/<slug>/ | home | --sitemap [--dry]');
    process.exit(1);
  }
  if (dry) { urls.forEach((u) => console.log(u)); console.log(`(dry) ${urls.length}개`); return; }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls })
  });
  // 200 = 접수, 202 = 접수(키 확인 대기). 403 = 키 파일을 못 읽음(배포 전이거나 키 불일치)
  if (res.status === 200 || res.status === 202) {
    console.log(`✅ IndexNow ${res.status} — ${urls.length}개 주소 전달`);
  } else {
    console.error(`❌ IndexNow ${res.status} ${await res.text().catch(() => '')}`.trim());
    process.exit(1);
  }
}

main().catch((e) => { console.error('❌ ' + e.message); process.exit(1); });
