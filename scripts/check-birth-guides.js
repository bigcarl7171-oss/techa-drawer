#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {ROOT} = require('./lib/site-registry');
const {data,context,view} = require('./lib/birth-guide');
for (const kind of ['flower','stone']) {
  const ctx=context(kind);
  assert.deepEqual(ctx.entries.map(x=>x.month),Array.from({length:12},(_,i)=>i+1));
  for (const e of ctx.entries) {
    assert.equal(e.messages.length,3);
    assert.equal(e.products.length,2);
    assert(new Set(e.products).size===2);
    assert(ctx.credits[e.photo]);
    assert(['CC0 1.0','Public domain'].includes(ctx.credits[e.photo].license));
    assert(fs.statSync(path.join(ROOT,'assets/images/birth-guide',e.photo+'.webp')).size>1000);
    assert(e.sourceUrl.startsWith('https://'));
    e.palette.forEach(p=>assert(/^#[a-f\d]{6}$/i.test(p.hex)));
    for (const id of e.products) {
      const p=ctx.products[id]; assert(p,'Unknown product '+id);
      assert(p.link.startsWith('https://mkt.shopping.naver.com/link/'));
      assert(fs.statSync(path.join(ROOT,p.image)).size>1000);
      if(e.productImages && e.productImages[id]) {
        assert(e.productImages[id].startsWith('/assets/images/home/'));
        assert(fs.statSync(path.join(ROOT,e.productImages[id])).size>1000);
      }
    }
    const markup=view.render(e,ctx);
    assert(markup.includes('/ko/birth-'+(kind==='flower'?'stone':'flower')+'/?month='+e.month));
    assert(!/이번 세션|재검증하지 않고|병과 재해를 막고/.test(markup));
    assert.equal((markup.match(/data-birth-copy=/g)||[]).length,3);
    assert.equal((markup.match(/data-birth-product=/g)||[]).length,2);
  }
  const html=fs.readFileSync(path.join(ROOT,'ko','birth-'+kind,'index.html'),'utf8');
  assert.equal((html.match(/id="month-\d+-summary"/g)||[]).length,12,'All months must exist without JavaScript');
  for(const marker of ['site-header','page-head','site-footer','related'])assert(html.includes('<!-- END '+marker+' -->'),'Missing generated marker '+marker);
  const m=html.match(/<script type="application\/json" id="birth-guide-data">([\s\S]*?)<\/script>/);
  assert(m);assert.deepEqual(JSON.parse(m[1]).entries,ctx.entries);
  assert(!html.includes('id="techa-cta"'),'Duplicate generic shop CTA');
}
assert.equal(data.stone[9].others[0],'투르말린');
assert.deepEqual(data.stone[10].others,['시트린']);
assert.equal(data.stone[11].others.length,2);
console.log('PASS: 24 months, 72 messages, monthly product links, image files, licenses, static fallback and generated data');
