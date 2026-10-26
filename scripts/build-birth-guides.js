#!/usr/bin/env node
/* Generate only the two monthly guides. Shared chrome/related blocks remain intact. */
const fs = require('fs');
const path = require('path');
const {ROOT,esc} = require('./lib/site-registry');
const {data,context,view} = require('./lib/birth-guide');
const check = process.argv.includes('--check');
const BEGIN = '<!-- BEGIN birth-guide (생성: scripts/build-birth-guides.js) -->';
const END = '<!-- END birth-guide -->';
const source = x => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)} ↗</a>`;
function faq(kind) {
  const flower = [
    ['자료마다 탄생화가 다른 이유는 무엇인가요?','탄생화는 세계 공통으로 정해진 하나의 목록이 아닙니다. 이 페이지는 알마낙의 월별 목록을 기본으로, Interflora의 가이드와 함께 살폈습니다. 자료에 따라 같은 달에 다른 꽃이 소개될 수 있습니다.'],
    ['국내에서 보던 탄생화와 다른데 틀린 건가요?','먼저 어떤 자료를 기준으로 한 목록인지 살펴보세요. 국내외 웹사이트가 서로 다른 목록을 인용하기도 합니다. 이 페이지는 알마낙의 월별 안내를 기준으로 삼았으며, 특정 국가의 공인 목록으로 소개하지 않습니다.'],
    ['생일 날짜나 음력·양력까지 입력해야 하나요?','이 페이지는 날짜별 탄생화가 아닌 월별 안내입니다. 선물을 준비하며 기억하고 싶은 생일의 달로 찾아보세요. 날짜별 탄생화나 음양력 변환 결과를 계산하는 기능은 아닙니다.'],
    ['탄생화가 들어 있지 않은 꽃을 선물해도 되나요?','받는 분이 좋아하는 꽃과 색을 고르셔도 좋습니다. 꽃이 같으면 탄생화를 담았다고, 다른 꽃이라면 탄생화의 색이나 의미에서 떠올린 선물이라고 설명해 주세요.'],
    ['같은 꽃이면 프리저브드·비누꽃도 모두 생화인가요?','소재가 다릅니다. 프리저브드는 천연 꽃을 보존 가공한 소재이고, 비누꽃은 비누 성분으로 꽃 모양을 만든 장식용 소재입니다. 상품별 구성과 소재를 확인하고 골라 주세요.']
  ];
  const stone = [
    ['한 달에 탄생석이 여러 개인가요?','GIA와 AGS가 안내하는 목록에는 3월·6월·8월·10월·11월·12월처럼 여러 보석을 함께 소개하는 달이 있습니다. 이 페이지는 이들 보석을 함께 보여줍니다.'],
    ['탄생석의 색이 사진이나 사이트마다 다른 이유는 무엇인가요?','같은 이름의 보석에도 여러 색이 있을 수 있고, 사진은 특정 표본을 보여주기 때문입니다. 아래 팔레트는 꽃 선물에 참고할 색의 예이며 보석의 색 범위 전체를 뜻하지 않습니다.'],
    ['보석을 지니면 행운이 오거나 건강에 도움이 되나요?','행운이나 보호에 관한 이야기는 옛 믿음과 상징입니다. 이 페이지는 생일에 의미를 더하는 문화 이야기로 소개하며, 실제 효능을 뜻하지 않습니다.'],
    ['소개한 꽃 상품에 탄생석이 포함되나요?','포함되지 않습니다. 탄생석에서 떠올린 색이나 분위기를 꽃으로 표현하는 제안입니다. 상품에 사용된 실제 소재와 구성은 스마트스토어에서 확인해 주세요.'],
    ['생일의 달보다 좋아하는 색으로 골라도 되나요?','좋습니다. 탄생석은 선물을 고르는 실마리로 활용하시고, 받는 분의 취향과 놓아둘 공간을 함께 살펴보세요.']
  ];
  return (kind==='flower'?flower:stone).map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');
}
function mainMarkup(ctx, related) {
 const kind=ctx.kind, flower=kind==='flower', entry=ctx.entries.find(x=>x.month===ctx.defaultMonth);
 const overview=ctx.entries.map(x=>`<li id="month-${x.month}-summary"><a data-birth-month="${x.month}" href="#birth-month-picker"><b>${x.month}월</b><span><strong>${esc(view.allNames(x))}</strong><small>${esc(x.meanings.join(' · '))}</small></span></a></li>`).join('\n');
 const keys=flower?['almanac','interflora','nihhs','rhs']:['gia','ags'];
 return `<main class="wrap birth-guide" data-birth-guide="${kind}">\n${BEGIN}
<nav class="birth-switch" aria-label="생일의 꽃과 보석"><a data-guide-switch href="/ko/birth-flower/?month=${ctx.defaultMonth}"${flower?' aria-current="page"':''}>탄생화·꽃말</a><a data-guide-switch href="/ko/birth-stone/?month=${ctx.defaultMonth}"${!flower?' aria-current="page"':''}>탄생석·색</a></nav>
<section class="birth-selector" id="birth-month-picker" aria-labelledby="birth-month-title"><h2 id="birth-month-title">생일이 있는 달을 골라보세요</h2><nav class="birth-months" aria-label="월 선택">${ctx.entries.map(x=>`<a data-birth-month="${x.month}" href="#month-${x.month}-summary" aria-current="${x.month===ctx.defaultMonth}">${x.month}월</a>`).join('')}</nav><p class="birth-small">${esc(flower?'월별 목록을 기준으로 안내합니다. 문화와 자료에 따라 다른 꽃이 소개될 수 있어요.':'한 달에 여러 탄생석이 있을 수 있습니다. 이름과 색을 함께 살펴보세요.')}</p></section>
<div id="birth-content">${view.render(entry,ctx)}</div>
<p class="birth-status" id="birth-status" role="status" aria-live="polite" aria-atomic="true"></p><textarea hidden id="birth-copy-fallback" class="birth-copy-fallback" readonly aria-label="복사할 내용"></textarea>
<section class="birth-section" aria-labelledby="birth-overview-title"><p class="birth-label">열두 달 한눈에 보기</p><h2 id="birth-overview-title">다른 달의 ${flower?'꽃':'보석'}도 궁금하다면</h2><p class="birth-small">${esc(flower?'월별 꽃 이름과 상징을 한 번에 비교해 보세요. 자세히 보고 싶은 달을 누르면 위 결과가 바뀝니다.':'각 달에 함께 소개되는 보석을 모았습니다. 사진은 그중 한 보석의 표본을 보여줍니다.')}</p><ul class="birth-overview">${overview}</ul></section>
<section class="birth-section birth-faq" aria-labelledby="birth-faq-title"><h2 id="birth-faq-title">자주 묻는 질문</h2>${faq(kind)}</section>
<section class="birth-section birth-sources" aria-labelledby="birth-sources-title"><h2 id="birth-sources-title">참고 자료와 안내</h2><p class="birth-small">${esc(flower?'탄생화 목록과 꽃말의 해석은 자료마다 다를 수 있습니다. 출처가 다른 해석을 한 가지 정답으로 단정하지 않습니다. 월별 꽃과 국내 꽃말은 서로 다른 기준일 수 있어 참고 자료를 함께 안내합니다.':'GIA와 AGS의 월별 안내를 참고했습니다. 탄생석의 상징은 전통과 해석에 따른 것이며, 성격이나 운명·건강을 판단하는 기준이 아닙니다.')} 카드 문구와 꽃 색 조합은 테차가 제안한 예시입니다.</p><ul>${keys.map(k=>`<li>${source(ctx.sources[k])}</li>`).join('')}</ul><details><summary>자료사진의 출처 보기</summary><ul>${ctx.entries.filter((x,i,a)=>a.findIndex(y=>y.photo===x.photo)===i).map(x=>{const p=ctx.credits[x.photo];return `<li>${esc(x.photoLabel)} — ${source({name:p.author+' / '+p.license,url:p.source})}</li>`}).join('')}</ul></details><p class="birth-small">정보·사진 이용 조건 검토: <time datetime="${ctx.reviewedAt}">${ctx.reviewedAt.replace(/-/g,'.')}</time></p></section>
<script type="application/json" id="birth-guide-data">${JSON.stringify(ctx).replace(/</g,'\\u003c')}</script>
${END}
${related}
</main>`;
}
let changed=0;
for(const kind of ['flower','stone']) {
 const file=path.join(ROOT,'ko','birth-'+kind,'index.html');let html=fs.readFileSync(file,'utf8');const old=html;
 const ctx=context(kind);
 const related = (html.match(/  <div id="related"[\s\S]*?<!-- END related -->\s*<\/div>/) || [''])[0];
 html=html.replace(/<main\b[\s\S]*?<\/main>/,mainMarkup(ctx,related));
 html=html.replace(/<body[^>]*>/,'<body class="birth-guide-page">');
 if(!html.includes('/assets/css/birth-guide.css'))html=html.replace('<link rel="stylesheet" href="/assets/css/style.css">','<link rel="stylesheet" href="/assets/css/style.css">\n<link rel="stylesheet" href="/assets/css/birth-guide.css">');
 const slug='birth-'+kind;
 const init=`<script>TECHA.initPage({title:${JSON.stringify(kind==='flower'?'월별 탄생화·꽃말':'월별 탄생석')},desc:${JSON.stringify(kind==='flower'?'태어난 달의 탄생화와 꽃말을 확인합니다.':'태어난 달의 탄생석과 의미를 확인합니다.')},category:"fortune",slug:"${slug}",related:${JSON.stringify(kind==='flower'?['birth-stone','gift-finder','horoscope']:['birth-flower','gift-finder','zodiac-love'])}});</script>\n<script src="/assets/js/birth-guide.js" defer></script>`;
 html=html.replace(/<script src="\/assets\/js\/site.js"><\/script>[\s\S]*?<\/body>/,`<script src="/assets/js/site.js"></script>\n${init}\n</body>`);
 if(html!==old){changed++;if(!check)fs.writeFileSync(file,html);}
}
if(check&&changed){console.error('Birthday guides are stale. Run node scripts/build-birth-guides.js');process.exit(1);}
console.log(`Birthday guides: ${changed?changed+' generated':'up to date'}; 24 monthly entries`);
