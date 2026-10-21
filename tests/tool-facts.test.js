const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function html(slug){return fs.readFileSync(path.join(root,'ko',slug,'index.html'),'utf8');}
function boot(slug,values={}){
 const elements=new Map();
 function el(id){if(elements.has(id))return elements.get(id);const x={value:values[id]??'',checked:false,style:{},dataset:{},textContent:'',innerHTML:'',listeners:{},children:[],classList:{add(){},remove(){},toggle(){}},addEventListener(k,f){(this.listeners[k]??=[]).push(f);},querySelectorAll(){return [];},appendChild(o){this.children.push(o);if(!this.value)this.value=o.value;},closest(){return this;},setSelectionRange(){}};elements.set(id,x);return x;}
 const document={getElementById:el,createElement:()=>({}),querySelectorAll:()=>[]};
 const ctx=vm.createContext({document,TECHA:{initPage(){}},TextEncoder,Date,setTimeout(){},clearTimeout(){},navigator:{}});
 for(const m of html(slug).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/src=|ld\+json/.test(m[1]))vm.runInContext(m[2],ctx);
 return {el,fire(id,event='change'){for(const f of el(id).listeners[event]??[])f.call(el(id),{preventDefault(){}});},ctx};
}
test('all 24 tools have parseable inline scripts and JSON metadata',()=>{
 let count=0;for(const d of fs.readdirSync(path.join(root,'ko'),{withFileTypes:true}).filter(x=>x.isDirectory())){const file=path.join(root,'ko',d.name,'index.html');if(!fs.existsSync(file))continue;const text=html(d.name);if(!/slug:\s*"/.test(text))continue;count++;for(const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/src=/.test(m[1]))continue;if(/ld\+json/.test(m[1]))JSON.parse(m[2]);else new vm.Script(m[2],{filename:d.name});}}assert.equal(count,24);
});
test('month-end and leap-day calendar differences never yield negative days',()=>{
 for(const [a,b,result] of [['2026-01-31','2026-03-01','1개월 1일'],['2024-02-29','2025-02-28','1년 0일'],['2026-01-31','2026-02-28','1개월 0일']]){const p=boot('date-diff',{d1:a,d2:b});p.fire('d1');assert.equal(p.el('ymd').textContent,result);p.el('incl').checked=true;p.fire('incl');assert.equal(p.el('ymd').textContent,result);}
});
test('VAT: lodging rate, daily late payment and weekend-adjusted deadlines',()=>{
 const p=boot('vat',{amt:'100000',siYearSales:'50000000',siRate:'25',siPurchase:'0',siCard:'0',gsTax:'1000000',gsType:'none',gsMonths:'30',gsReduction:'0'});
 assert.equal(p.el('siSalesTax').textContent,'1,250,000원');assert.equal(p.el('gsPenalty2').textContent,'6,600원');assert.equal(p.el('gsPenalty1').textContent,'200,000원');
 p.el('gsReduction').value='.5';p.fire('gsReduction');assert.equal(p.el('gsPenalty1').textContent,'100,000원');p.el('gsType').value='fraud';p.fire('gsType');assert.equal(p.el('gsPenalty1').textContent,'400,000원');
 assert.match(p.el('deadlines').innerHTML,/2026-04-27/);assert.match(p.el('deadlines').innerHTML,/2026-10-26/);
});
test('workday totals match every monthly table cell; unsupported years are explicit',()=>{
 const p=boot('workdays');p.el('exHol').checked=true;const totals=[];
 for(const y of [2026,2027,2028]){let total=0;for(let m=1;m<=12;m++){p.el('d1').value=`${y}-${String(m).padStart(2,'0')}-01`;p.el('d2').value=`${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`;p.fire('d1');const n=Number(p.el('result').innerHTML.match(/big">(\d+)/)[1]);total+=n;const row=html('workdays').match(new RegExp(`<tr><td>${m}월</td><td>(\\d+)일</td><td>(\\d+)일</td><td>(\\d+)일</td>`));assert.ok(row);assert.equal(n,Number(row[y-2025]),`${y}-${m}`);}totals.push(total);}assert.deepEqual(totals,[245,246,243]);
 p.el('d1').value='2025-01-01';p.fire('d1');assert.match(p.el('result').textContent,/2026~2028년만/);
});
test('UTF-8 byte counts correctly handle Hangul, emoji and lone surrogates',()=>{
 const p=boot('char-counter');for(const [s,chars,bytes] of [['안녕하세요',5,15],['😀',2,4],['\ud800',1,3],['a b\n',4,4]]){p.el('text').value=s;p.fire('text','input');assert.equal(p.el('withSpace').textContent,String(chars));assert.equal(p.el('bytes').textContent,String(bytes));}
});
test('data units distinguish decimal and binary; speed ratios are precise',()=>{
 const p=boot('unit-converter');p.el('cat').value='데이터';p.fire('cat');p.el('from').value='바이트(B)';p.el('val').value='1024';p.fire('val','input');const rows=p.el('out').children.map(r=>r.innerHTML);assert.ok(rows.some(r=>r.includes('kB (10진)')&&r.includes('1.024')));assert.ok(rows.some(r=>r.includes('KiB (2진)')&&r.includes('>1<')));
});
test('loan zero-interest, fee exemption and monthly-compound examples',()=>{
 const p=boot('loan',{p:'1200000',r:'0',y:'12',grace:'0',peAmount:'10000000',peDays:'365',peRate:'0',dsrIncome:'50000000',dsrOther:'10000000',dsrThis:'10000000',dsrLimit:'40'});assert.equal(p.el('totalInt').textContent,'0원');assert.match(p.el('result').innerHTML,/100,000원/);assert.match(p.el('peResult').innerHTML,/0원/);assert.match(p.el('dsrResult').innerHTML,/40%/);
 const c=boot('compound',{p:'1000000',m:'100000',r:'0',y:'1'});assert.equal(c.el('deposit').textContent,'2,200,000원');assert.equal(c.el('interest').textContent,'0원');
});
