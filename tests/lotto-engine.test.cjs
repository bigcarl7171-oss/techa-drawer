const assert=require('node:assert/strict');
const e=require('../assets/js/lotto-engine.js');
assert.equal(e.choose(45,6),8145060);
for(let i=0;i<1000;i++){
 const rows=e.generate(10,[7,21],[3,14,45],[]);
 assert.equal(new Set(rows.map(r=>r.main.join(','))).size,10);
 for(const r of rows){assert(e.validNumbers(r.main,6));assert(r.main.includes(7)&&r.main.includes(21));assert(r.main.every(n=>![3,14,45].includes(n)));assert.deepEqual(r.main,r.main.slice().sort((a,b)=>a-b));assert(!('bonus'in r));}
}
const excluded=Array.from({length:39},(_,i)=>i+7);
assert.deepEqual(e.generate(1,[],excluded,[])[0].main,[1,2,3,4,5,6]);
assert.throws(()=>e.generate(2,[],excluded,[]),/서로 다른/);
assert.throws(()=>e.generate(1,[],excluded,[[1,2,3,4,5,6]]),/서로 다른/);
assert.throws(()=>e.generate(1,[1],[1],[]));
const sevenExcluded=Array.from({length:38},(_,i)=>i+8);
const all=e.generate(7,[],sevenExcluded,[],()=>0);
assert.equal(new Set(all.map(r=>r.main.join(','))).size,7);
assert(e.generate(1,[],sevenExcluded,[all[0].main],()=>0)[0].main.join(',')!==all[0].main.join(','));
console.log('PASS: 10,000 combinations, fixed/excluded constraints, distinct games, exact small pool enumeration, locked exclusions, impossible requests.');
