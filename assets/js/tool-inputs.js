/* Shared progressive enhancement. Existing input IDs, values and calculation
 * listeners remain the source of truth. No stored dates or remote requests. */
(function () {
  'use strict';
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const pad=n=>String(n).padStart(2,'0');
  const parse=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?d:null;};
  function emit(input){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
  function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  function button(text,fn){const b=node('button','',text);b.type='button';b.addEventListener('click',fn);return b;}
  function select(label,blank,max,suffix){const l=node('label','tool-part'),s=node('select');l.append(node('span','',label),s);s.add(new Option(blank,''));for(let i=1;i<=max;i++)s.add(new Option(i+suffix,String(i)));return {label:l,input:s};}
  const syncs=[];
  function dateControl(input){
    if(input.dataset.dateEnhanced)return;input.dataset.dateEnhanced='true';
    const title=(input.labels[0]?.textContent||'날짜').trim().replace(/\s+/g,' ');
    const wrap=node('div','tool-date-control');wrap.setAttribute('role','group');wrap.setAttribute('aria-label',title+' 선택');
    const fields=node('div','tool-date-parts'),yl=node('label','tool-part'),year=node('input');
    year.type='number';year.id=input.id+'-year';year.inputMode='numeric';year.placeholder=/생년|생일/.test(title)?'예: 1990':'예: '+today().slice(0,4);year.min=input.min?.slice(0,4)||'1000';year.max=input.max?.slice(0,4)||'9990';
    yl.append(node('span','','연도'),year);const month=select('월','월 선택',12,'월'),day=select('일','일 선택',31,'일');fields.append(yl,month.label,day.label);
    const help=node('p','tool-date-help');help.setAttribute('role','status');help.id=input.id+'-date-help';year.setAttribute('aria-describedby',help.id);
    const originalRequired=input.required;input.required=false;[year,month.input,day.input].forEach(el=>el.required=originalRequired);
    const native=node('details','tool-native-calendar');native.append(node('summary','','달력으로 직접 고르기'));input.before(wrap);wrap.append(fields);native.append(input);wrap.append(native);
    const min=input.min,max=input.max;let last='',editing=false;
    function days(){const y=Number(year.value),m=Number(month.input.value),old=day.input.value;if(!y||!m)return false;const lastDay=new Date(0);lastDay.setUTCFullYear(y,m,0);const n=lastDay.getUTCDate();day.input.replaceChildren(new Option('일 선택',''));for(let i=1;i<=n;i++)day.input.add(new Option(i+'일',String(i)));day.input.value=old&&Number(old)>n?String(n):old;return old&&Number(old)>n;}
    function sync(){if(last===input.value)return;last=input.value;const parts=(input.value||'').split('-');year.value=parts[0]||'';month.input.value=parts[1]?String(Number(parts[1])):'';days();day.input.value=parts[2]?String(Number(parts[2])):'';help.textContent=input.value?'선택한 날짜: '+input.value.replaceAll('-','. '):'연도는 직접 입력하고 월·일을 골라주세요.';}
    function apply(){const clamped=days();let date='';if(year.value&&month.input.value&&day.input.value)date=year.value.padStart(4,'0')+'-'+pad(month.input.value)+'-'+pad(day.input.value);let msg='';if(date&&(!parse(date)||Number(year.value)<Number(year.min)||Number(year.value)>Number(year.max)||(min&&date<min)||(max&&date>max))){msg='선택 가능한 날짜 범위를 확인해 주세요.';date='';}input.value=date;last=date;editing=true;emit(input);editing=false;help.textContent=msg||(clamped?'이 달의 마지막 날짜로 맞췄어요.':date?'선택한 날짜: '+date.replaceAll('-','. '):'연·월·일을 모두 선택해 주세요.');}
    [year,month.input,day.input].forEach(el=>el.addEventListener('input',apply));
    function set(value){if((min&&value<min)||(max&&value>max)){help.textContent='선택 가능한 날짜 범위의 끝입니다.';return;}input.value=value;last=null;sync();emit(input);}
    const nav=node('div','tool-date-nav');
    [-1,0,1].forEach(n=>nav.append(button(n<0?'← 하루 전':n>0?'다음 날 →':'오늘',()=>{let d=parse(input.value)||parse(today());if(n)d.setUTCDate(d.getUTCDate()+n);set(n?d.toISOString().slice(0,10):today());})));
    nav.append(button('비우기',()=>{input.value='';last=null;sync();emit(input);year.focus();}));wrap.append(nav,help);
    input.addEventListener('input',()=>{if(!editing){last=null;sync();}});input.addEventListener('change',()=>{if(!editing){last=null;sync();}});
    const existing=document.querySelector('label[for="'+input.id+'"]');if(existing)existing.htmlFor=year.id;
    // The calendar stays available as a genuine alternate native control.
    year.setAttribute('aria-label',title+' 연도');month.input.setAttribute('aria-label',title+' 월');day.input.setAttribute('aria-label',title+' 일');
    input.setAttribute('aria-label',title+' 달력');
    if(existing)new MutationObserver(()=>{const name=existing.textContent.trim().replace(/\s+/g,' ');wrap.setAttribute('aria-label',name+' 선택');year.setAttribute('aria-label',name+' 연도');month.input.setAttribute('aria-label',name+' 월');day.input.setAttribute('aria-label',name+' 일');}).observe(existing,{childList:true,subtree:true,characterData:true});
    last=null;sync();syncs.push(sync);
  }
  function timeControl(input){
    const title=(input.labels[0]?.textContent||'시각').trim(),wrap=node('div','tool-time-control'),hour=select(title+' · 시 (24시간)','시 선택',0,''),minute=select('분','분 선택',0,'');
    for(let i=0;i<24;i++)hour.input.add(new Option(pad(i)+'시',pad(i)));for(let i=0;i<60;i++)minute.input.add(new Option(pad(i)+'분',pad(i)));
    wrap.append(hour.label,minute.label);input.before(wrap);input.hidden=true;input.required=false;
    let last='';function sync(){if(last===input.value)return;last=input.value;const parts=input.value.split(':');hour.input.value=parts[0]||'';minute.input.value=parts[1]||'';}
    function apply(){input.value=hour.input.value&&minute.input.value?hour.input.value+':'+minute.input.value:'';last=input.value;emit(input);}
    [hour.input,minute.input].forEach(el=>el.addEventListener('change',apply));
    const quick=node('div','tool-time-presets');['06:00','18:00','21:00'].forEach(t=>quick.append(button(t,()=>{input.value=t;last=null;sync();emit(input);})));wrap.append(quick);input.addEventListener('input',()=>{last=null;sync();});sync();syncs.push(sync);
  }
  function init(){
    document.querySelectorAll('main input[type=date]').forEach(dateControl);
    document.querySelectorAll('main input[type=time]').forEach(timeControl);
    const path=location.pathname;
    if(/\/(birth-flower|birth-stone)\//.test(path)){
      const month=document.getElementById('month');if(month){const nav=node('div','tool-month-nav');[-1,0,1].forEach(n=>nav.append(button(n<0?'← 이전 달':n>0?'다음 달 →':'이번 달',()=>{month.value=n?((Number(month.value)-1+n+12)%12)+1:Number(today().slice(5,7));emit(month);})));month.after(nav);}
    }
    if(/\/milestone-age\//.test(path))document.querySelectorAll('#birth-year,#celebration-year').forEach(input=>{const nav=node('div','tool-year-nav');[-1,1].forEach(n=>nav.append(button(n<0?'이전 연도':'다음 연도',()=>{let y=Number(input.value)||Number(today().slice(0,4));y+=n;if((input.min&&y<Number(input.min))||(input.max&&y>Number(input.max)))return;input.value=y;emit(input);})));input.after(nav);});
    if(/\/(date-diff|workdays)\//.test(path)){
      const start=document.getElementById('d1'),end=document.getElementById('d2'),nav=node('div','tool-range-presets');[7,30].forEach(n=>nav.append(button('시작일에서 '+n+'일 뒤',()=>{if(!parse(start.value)){start.focus();const h=document.getElementById('d1-date-help');if(h)h.textContent='먼저 시작 날짜를 선택해 주세요.';return;}const d=parse(start.value);d.setUTCDate(d.getUTCDate()+n);end.value=d.toISOString().slice(0,10);emit(end);})));end.closest('.tool-date-control').after(nav);
    }
    document.addEventListener('click',()=>setTimeout(()=>syncs.forEach(fn=>fn()),0));document.addEventListener('reset',()=>setTimeout(()=>syncs.forEach(fn=>fn()),0));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
