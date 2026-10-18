(function(){
  var $ = function(id){return document.getElementById(id)};
  var S = {photos:[], tpl:'gallery', sel:0, logo:null, tone:{k:'orig', s:0, f:0}};
  var Q = {}; new URLSearchParams(location.search).forEach(function(v, k){ Q[k] = v; });
  var MODES = ['giver','thanks'], SOURCES = ['hello','leaflet','frame','care','message','qr','gift','gift_link','instagram','kakao','naver','direct'];
  function allowed(v, list){ return list.indexOf(v) >= 0 ? v : ''; }
  var appContext = 'browser';
  // 앱 안 브라우저 감지 전에 준비한다. URL·문구·파일명은 측정에 넣지 않는다.
  (function(){
    var id = 'G-SEQ155EHQ7'; window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, {page_location: location.origin + location.pathname, page_referrer: '', send_page_view: false});
    var sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(sc);
  })();
  function track(name, params){
    var safe = {from: allowed(Q.from, SOURCES), mode: allowed(Q.mode, MODES), app: appContext};
    var enums = {kind:['photo','video','gif','square'], intent:['save','share'], route:['jpg','webcodecs','recorder','gif'], mime:['jpg','mp4','webm','gif'], error:['cancel','timeout','unsupported','media','encode','share'], place:['header','intro','ready'], status:['ready','unavailable']};
    Object.keys(params || {}).forEach(function(k){
      var v = params[k];
      if (k === 'tpl' && TechaFrame.templates.concat(TechaFrame.squares).some(function(t){ return t.id === v; })) safe[k] = v;
      else if (k === 'photos' && Number.isInteger(v) && v >= 0 && v <= 8) safe[k] = v;
      else if (k === 'seconds' && typeof v === 'number' && v >= 0 && v <= 8) safe[k] = Math.round(v * 10) / 10;
      else if (enums[k] && enums[k].indexOf(v) >= 0) safe[k] = v;
    });
    try { window.gtag('event', name, safe); } catch (e) {}
  }
  if (Q.tpl && TechaFrame.templates.some(function(t){ return t.id === Q.tpl; })) S.tpl = Q.tpl;
  var today = new Date();
  $('recv').value = /^\d{4}-\d{2}-\d{2}$/.test(Q.recv || '') ? Q.recv : today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');

  var modalStack = [];
  function refreshModal(){
    var top = modalStack.length ? modalStack[modalStack.length - 1].el : null;
    [].forEach.call(document.body.children, function(el){ if (el.tagName !== 'SCRIPT') el.inert = !!top && el !== top && !el.contains(top); });
  }
  function showModal(el, focus){
    if (!modalStack.some(function(m){ return m.el === el; })) modalStack.push({el:el, back:document.activeElement});
    el.classList.remove('hidden'); refreshModal();
    var first = focus || el.querySelector('button:not(:disabled), input:not(:disabled), [tabindex="0"]'); if (first) first.focus();
  }
  function closeModal(el){
    var item = null; modalStack = modalStack.filter(function(m){ if (m.el === el) { item = m; return false; } return true; });
    el.classList.add('hidden'); refreshModal();
    if (item && item.back && item.back.isConnected && !item.back.closest('.hidden')) item.back.focus();
  }
  document.addEventListener('keydown', function(e){
    var m = modalStack[modalStack.length - 1]; if (!m) return;
    if (e.key === 'Escape') { e.preventDefault(); if (m.el.id === 'ready') $('rClose').click(); else if (m.el.id === 'vsheet') $('vsClose').click(); else if (m.el.dismiss) m.el.dismiss(); return; }
    if (e.key !== 'Tab') return;
    var items = [].filter.call(m.el.querySelectorAll('button:not(:disabled), input:not(:disabled), select, textarea, a[href], [tabindex="0"]'), function(x){ return x.getClientRects().length > 0; });
    if (!items.length) { e.preventDefault(); return; }
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !m.el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !m.el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  function dialog(t, m, action){
    var d = document.createElement('div'); d.className = 'dialog';
    d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-label',t);
    d.innerHTML = '<div class="box"><b></b><span></span><button type="button">확인</button></div>';
    d.querySelector('b').textContent = t; d.querySelector('span').textContent = m;
    d.dismiss=function(){closeModal(d);d.remove()};
    if(action){var cancel=document.createElement('button');cancel.type='button';cancel.textContent='여기서 계속하기';cancel.onclick=d.dismiss;d.querySelector('.box').appendChild(cancel);d.querySelector('button').textContent='다른 브라우저로 열기';}
    d.querySelector('button').onclick = function(){ closeModal(d); d.remove(); if(action) action(); }; document.body.appendChild(d); showModal(d);
  }
  var toastTimer;
  function toast(m){var t=$('toast');clearTimeout(toastTimer);t.textContent=m;t.classList.add('show');toastTimer=setTimeout(function(){t.classList.remove('show')},4000);}
  function loadImg(src){return new Promise(function(r){var i=new Image(), timer=setTimeout(function(){done(null)},15000);function done(v){clearTimeout(timer);i.onload=i.onerror=null;r(v)} i.onload=function(){done(i)};i.onerror=function(){done(null)};i.src=src;});}

  // 큰 사진은 긴 변 2000px 로 줄여 메모리를 아낀다
  function shrink(img){
    var m = 2000, w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w,h) <= m) return Promise.resolve(img);
    var k = m / Math.max(w,h), c = document.createElement('canvas'); c.width = Math.round(w*k); c.height = Math.round(h*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return loadImg(c.toDataURL('image/jpeg',0.92));
  }

  function opts(){
    var d = $('recv').value ? new Date($('recv').value+'T00:00:00') : today;
    var caps = still() ? [] : [$('txt').value, $('cap2').value, $('cap3').value];
    return {photos:S.photos, text:$('txt').value, caps:caps, omitText:!!($('noCaption') && $('noCaption').checked), from:$('from').value.trim(), received:d, today:today,
      mark:$('mk').checked, logo:S.logo, bright:+$('bright').value, warm:+$('warm').value, sat:S.tone.s, fade:S.tone.f};
  }

  /* ---------- 문구 고르기: 받은 사람의 한마디(frame-phrases.json) · 카드 문구(data/message-phrases.json) ---------- */
  var PH = {mine: null, card: null}, src = 'mine', target = 'txt';
  ['txt','cap2','cap3'].forEach(function(id){ $(id).addEventListener('focus', function(){ target = id; }); });
  function fill(id, v){ if ($('noCaption')) { $('noCaption').checked = false; captionState(); } $(id).value = v; $(id).dispatchEvent(new Event('input')); $(id).dispatchEvent(new Event('change')); }
  function captionState(){ if ($('textFields')) $('textFields').classList.toggle('hidden', $('noCaption').checked); draw(); buildGrid(); }
  if ($('noCaption')) $('noCaption').addEventListener('change', captionState);
  function nextTarget(){
    if (still()) return 'txt';
    var ids = ['txt','cap2','cap3'];
    if ($(target).value.trim() === '') return target;
    for (var i = 0; i < ids.length; i++) if (!$(ids[i]).value.trim()) return ids[i];
    return target;
  }
  async function loadPhrases(){
    if (!PH.mine) { try { PH.mine = await (await fetch('/frame/frame-phrases.json')).json(); } catch (e) { PH.mine = {groups: []}; } }
    // 카드 문구는 /message/ 페이지에서 읽는다. 원본 data/message-phrases.json 은 공개 자산이 아니고(.assetsignore),
    // 그 페이지가 원본으로 찍은 정적 HTML 이라 문구를 고치면 여기에도 그대로 반영된다.
    if (!PH.card) {
      try {
        var doc = new DOMParser().parseFromString(await (await fetch('/message/')).text(), 'text/html');
        var labels = {}, tones = {};
        [].forEach.call(doc.querySelectorAll('#occasionSelect option'), function(op){ labels[op.value] = op.textContent.trim(); });
        [].forEach.call(doc.querySelectorAll('#toneChoices [data-tone]'), function(b){ tones[b.dataset.tone] = b.textContent.trim(); });
        var occ = [].map.call(doc.querySelectorAll('section.msg-group[data-occasion]'), function(sec){
          var ph = {};
          [].forEach.call(sec.querySelectorAll('li.msg-item'), function(li){ var t = li.dataset.tone, p = li.querySelector('p'); if (t && p) (ph[t] = ph[t] || []).push(p.textContent.trim()); });
          return {key: sec.dataset.occasion, label: labels[sec.dataset.occasion] || sec.dataset.occasion, phrases: ph};
        });
        PH.card = {occasions: occ, tones: tones};
      } catch (e) { PH.card = {occasions: [], tones: {}}; }
    }
  }
  function groups(){
    if (src === 'mine') return PH.mine.groups.map(function(g){ return {key: g.key, label: g.label}; });
    return PH.card.occasions.map(function(o){ return {key: o.key, label: o.label}; });
  }
  function buildOcc(){
    var sel = $('occ'), prev = sel.value || (src === 'mine' ? S.phraseGroup : ''); sel.innerHTML = '';
    groups().forEach(function(g){ var op = document.createElement('option'); op.value = g.key; op.textContent = g.label; sel.appendChild(op); });
    if ([].some.call(sel.options, function(o){ return o.value === prev; })) sel.value = prev;
    buildList();
  }
  function btn(label, cls, on){ var b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (cls) b.className = cls; b.onclick = on; return b; }
  function sub(t){ var d = document.createElement('div'); d.className = 'sub'; d.textContent = t; return d; }
  function buildList(){
    var L = $('plist'), key = $('occ').value; L.innerHTML = '';
    if (src === 'mine') {
      var g = PH.mine.groups.filter(function(x){ return x.key === key; })[0]; if (!g) return;
      if (!still() && g.flows && g.flows.length) {
        L.appendChild(sub('영상용 세 줄 흐름 — 누르면 세 칸이 한 번에 채워져요'));
        g.flows.forEach(function(f){ L.appendChild(btn(f.join('  →  '), 'flow', function(){ fill('txt', f[0]); fill('cap2', f[1] || ''); fill('cap3', f[2] || ''); toast('세 줄을 넣었어요'); })); });
        L.appendChild(sub('한 줄 문구'));
      }
      g.lines.forEach(function(t){ L.appendChild(btn(t, '', function(){ var id = nextTarget(); fill(id, t); toast('문구를 넣었어요'); })); });
    } else {
      var o = PH.card.occasions.filter(function(x){ return x.key === key; })[0]; if (!o) return;
      Object.keys(o.phrases).forEach(function(tk){
        L.appendChild(sub(PH.card.tones[tk] || tk));
        o.phrases[tk].forEach(function(t){ L.appendChild(btn(t, '', function(){ var id = nextTarget(); fill(id, t); toast('문구를 넣었어요'); })); });
      });
    }
  }
  $('pickPhrase').onclick = async function(){
    var P = $('picker'); if (!P.classList.contains('hidden')) { P.classList.add('hidden'); return; }
    await loadPhrases(); buildOcc(); P.classList.remove('hidden');
  };
  [].forEach.call(document.querySelectorAll('.tabs button'), function(b){ b.onclick = function(){
    src = b.dataset.src; [].forEach.call(document.querySelectorAll('.tabs button'), function(x){ x.classList.toggle('on', x === b); });
    $('pickNote').textContent = src === 'mine' ? '누르면 지금 고른 칸에 들어가요.' : '받은 카드의 말을 그대로 옮기고 싶을 때 써요. 누르면 지금 고른 칸에 들어가요.';
    buildOcc(); }; });
  $('occ').onchange = buildList;

  function thumb(id, target){ TechaFrame.render(target, id, opts(), 0.25); }

  // 정사각(카톡 프사) 미리보기는 남는 칸의 짧은 변에 맞춰 정확히 동그랗게
  function fitPreview(){
    var c = $('main'), pv = $('pv'), ratio = S.kind === 'square' ? 1 : 9 / 16;
    var h = Math.max(1, Math.min(pv.clientHeight, pv.clientWidth / ratio));
    c.style.width = Math.round(h * ratio) + 'px'; c.style.height = Math.round(h) + 'px';
  }
  window.addEventListener('resize', fitPreview);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitPreview).observe($('pv'));
  if(window.visualViewport)window.visualViewport.addEventListener('resize',fitPreview);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitPreview).observe($('pv'));
  function buildGrid(){
    TechaFrame.loadFonts(textNow()).then(buildGridNow);
  }
  function buildGridNow(){
    var g = $('grid'); g.innerHTML = '';
    g.classList.toggle('sq', S.kind === 'square'); $('pv').classList.toggle('sq', S.kind === 'square');
    fitPreview();
    $('tplNote').textContent = S.kind === 'square' ? "카톡 프사용 정사각 틀 3가지예요. 세로 틀 15가지는 위에서 '사진'을 고르면 다시 보여요." : '틀 15가지 · 옆으로 넘기며 눌러 보세요';
    list().forEach(function(t, i){
      var b = document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed', String(t.id===S.tpl)); if (t.id===S.tpl) b.className='on';
      var c = document.createElement('canvas'); var s = document.createElement('span'); s.textContent = t.name; b.title = (i+1) + '. ' + t.name + (t.photos > 1 ? ' (사진 ' + t.photos + '장)' : '');
      b.appendChild(c); b.appendChild(s); g.appendChild(b);
      b.onclick = function(){ S.tpl=t.id; [].forEach.call(g.children,function(x){x.className='';x.setAttribute('aria-pressed',String(x===b))}); b.className='on'; draw(); b.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); };
      setTimeout(function(){ thumb(t.id, c); }, 30*i);
    });
    // 고른 틀이 줄 가운데 보이게 (예시를 눌러 들어온 경우 등)
    setTimeout(function(){ var on = g.querySelector('.on'); if (on) g.scrollLeft = on.offsetLeft - (g.clientWidth - on.clientWidth) / 2; }, 60);
  }

  // 미리보기: 사진은 한 번 그리고, 영상·GIF 는 반복 재생한다 (절반 크기로 그려 가볍게)
  S.kind = 'photo';
  function still(){ return S.kind === 'photo' || S.kind === 'square'; }
  function list(){ return S.kind === 'square' ? TechaFrame.squares : TechaFrame.templates; }
  var DUR = {video:6000, gif:4000};
  var raf = 0, anim = 0, t0 = 0;
  function textNow(){ var o = opts(); return [o.text, (o.caps || []).join(''), o.from].join(''); }
  function draw(){
    var t = textNow();
    if (t !== draw.last) { draw.last = t; TechaFrame.loadFonts(t).then(function(){ drawNow(); }); }
    drawNow();
  }
  function drawNow(){
    cancelAnimationFrame(raf);
    if (still() && !S.clip) { cancelAnimationFrame(anim); anim = 0; raf = requestAnimationFrame(function(){ TechaFrame.render($('main'), S.tpl, opts()); }); return; }
    if (!anim) { t0 = performance.now(); tick(); }
  }
  function tick(){
    var d = DUR[S.kind] || 6000, o = opts(); o.anim = !still(); o.t = ((performance.now() - t0) % d) / d;
    if (S.clip) { clipLoop(); o.clip = true; o.t = Math.min(0.999, Math.max(0, (S.clip.el.currentTime - S.clip.start) / S.clip.len)); }
    if (!o.anim && !S.clip) { anim = 0; TechaFrame.render($('main'), S.tpl, o); return; }
    TechaFrame.render($('main'), S.tpl, o, 0.5);
    anim = requestAnimationFrame(tick);
  }

  // 녹화 MIME와 실제 WebCodecs 출력 설정을 확인해 영상 선택을 연다.
  var VIDEO_MIME = (function(){
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return '';
    var c = ['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i];
    return '';
  })();
  var capability = {settled:false, video:false, audio:false}, capabilityPromise;
  $('kVideo').disabled = true; $('vtClipBtn').disabled = true; $('vsClip').disabled = true;
  var NOTE = {
    photo: '움직이지 않는 사진으로 만들어요.',
    video: '움직이는 영상 · 인스타 스토리·릴스에 잘 맞아요 (일부 휴대폰은 어려울 수 있어요)',
    gif: '반복되는 움직이는 사진 · 카톡에 잘 맞아요 (인스타는 영상 추천)',
    square: '카톡 프로필용 정사각 사진 · 동그라미로 잘려도 글자가 보여요'
  };
  var SAVE = {photo:'저장', video:'저장', gif:'저장', square:'저장'};
  function setKind(k){
    if (k === 'video' && !capability.video) { toast(capability.settled ? '이 기기에서는 사진이나 GIF로 만들어 주세요' : '영상 지원을 확인하고 있어요'); return; }
    var wasSq = S.kind === 'square';
    S.kind = k;
    // 정사각 ↔ 세로 틀을 바꿀 때 고르던 틀을 기억해 둔다
    if (k === 'square' && !wasSq) { S.storyTpl = S.tpl; S.tpl = S.sqTpl || 'sq-full'; }
    if (k !== 'square' && wasSq) { S.sqTpl = S.tpl; S.tpl = S.storyTpl || 'gallery'; }
    if (k === 'square' || wasSq) buildGrid();
    [].forEach.call($('kind').querySelectorAll('button[data-k]'), function(x){ x.classList.toggle('on', x.dataset.k === k); x.setAttribute('aria-checked',String(x.dataset.k===k)); x.tabIndex=x.dataset.k===k ? 0 : -1; });
    $('kindNote').textContent = NOTE[k]; $('saveBtn').textContent = SAVE[k];
    $('motion').classList.toggle('hidden', k !== 'video' && k !== 'gif');
    $('moreCaps').classList.toggle('hidden', still()); $('capLabel').textContent = still() ? '문구' : '문구 1';
    if (!$('picker').classList.contains('hidden')) buildList();
    draw();
    requestAnimationFrame(fitPreview);
  }
  $('kind').setAttribute('role','radiogroup');
  [].forEach.call($('kind').querySelectorAll('button[data-k]'), function(b){ b.setAttribute('role','radio'); b.setAttribute('aria-checked',String(b.dataset.k===S.kind)); b.tabIndex=b.dataset.k===S.kind?0:-1; b.onclick = function(){ setKind(b.dataset.k); }; });
  $('kind').addEventListener('keydown', function(e){ if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].indexOf(e.key)<0)return; var bs=[].filter.call(this.querySelectorAll('button'),function(b){return !b.disabled&&!b.classList.contains('hidden')});var i=bs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();var next=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(/Left|Up/.test(e.key)?-1:1)+bs.length)%bs.length;bs[next].click();bs[next].focus(); });

  function buildWhich(){
    var w = $('which'); w.innerHTML='';
    S.photos.forEach(function(p,i){ var b=document.createElement('button'); b.type='button'; b.textContent='사진 '+(i+1);b.setAttribute('aria-pressed',String(i===S.sel)); if(i===S.sel) b.className='on';
      b.onclick=function(){S.sel=i; buildWhich(); $('zoom').value=S.photos[i].adj.zoom;}; w.appendChild(b); });
    $('whichWrap').classList.toggle('hidden', S.photos.length < 2);
  }

  var MAXP = 8;
  function disposePhoto(p){if(p&&!p.isVideo&&p.ownedURL)URL.revokeObjectURL(p.ownedURL)}
  function photosChanged(){ S.sel = Math.min(S.sel, S.photos.length - 1); buildThumbs(); buildWhich(); buildGrid(); draw(); if (typeof showAgain === 'function') showAgain(); }
  function buildThumbs(){
    var th = $('thumbs'); th.innerHTML='';
    S.photos.forEach(function(p,i){
      var tile = document.createElement('div'); tile.className = 'tile';
      var b=document.createElement('button'); b.type='button'; b.title= i===0 ? '첫 번째 사진' : '이 사진을 첫 번째로';
      var im=document.createElement('img'); im.src=p.poster || p.img.src; var n=document.createElement('i'); n.textContent=i+1;
      b.appendChild(im); b.appendChild(n); if(i===0) b.className='on';
      if (p.isVideo) { var vb = document.createElement('span'); vb.className = 'vbadge'; vb.textContent = '▶ ' + S.clip.len.toFixed(0) + '초'; b.appendChild(vb); }
      b.onclick=function(){ if(i===0) return; S.photos.unshift(S.photos.splice(i,1)[0]); S.sel=0; photosChanged(); };
      tile.appendChild(b);
      if (S.photos.length > 1) { var x=document.createElement('button'); x.type='button'; x.className='x'; x.textContent='×'; x.setAttribute('aria-label', (i+1)+'번 사진 빼기');
        x.onclick=function(){ var gone = S.photos.splice(i,1)[0]; if (gone && gone.isVideo) dropClip();else disposePhoto(gone); photosChanged(); toast(gone && gone.isVideo ? '영상을 뺐어요' : '사진을 뺐어요'); }; tile.appendChild(x); }
      th.appendChild(tile); });
    if (S.photos.length < MAXP) { var a=document.createElement('button'); a.type='button'; a.className='add'; a.innerHTML='<b>+</b>더하기';
      a.onclick=function(){ S.adding = true; $('file').click(); }; th.appendChild(a); }
    else { var f=document.createElement('div'); f.className='full'; f.textContent='8장이 꽉 찼어요'; th.appendChild(f); }
    $('pcount').textContent = S.photos.length + '/' + MAXP + ' · 누르면 첫 번째 사진이 돼요';
    $('thumbNote').textContent = S.photos.length>1 ? '여러 장을 쓰는 틀(폴라로이드·필름·네 컷·스크랩)은 순서대로 들어가고, 영상·GIF에서는 모든 사진이 차례로 바뀌어요.' : '사진을 더하면 영상·GIF에서 사진이 차례로 바뀌어요.';
  }

  $('pickBtn').onclick = function(){ S.adding = false; $('file').click(); };
  [].forEach.call(document.querySelectorAll('.samples [data-tpl]'), function(b){ b.onclick = function(){ S.tpl = b.dataset.tpl; S.adding = false; $('file').click(); }; });
  $('pickBtn2').onclick = function(){ S.adding = false; $('file').click(); };
  /* ---------- 보정: 필터(한 번 누르기) + 직접 조정 ---------- */
  S.tone = {k: 'orig', s: 0, f: 0};
  var PRESETS = [
    {k: 'orig', n: '원본', b: 0, w: 0, s: 0, f: 0},
    {k: 'auto', n: '자동'},
    {k: 'bright', n: '화사하게', b: 0.5, w: 0.12, s: 0, f: 0},
    {k: 'warm', n: '따뜻하게', b: 0.12, w: 0.8, s: 0, f: 0},
    {k: 'calm', n: '차분하게', b: 0, w: -0.35, s: 0.5, f: 0.08},
    {k: 'film', n: '필름', b: 0.1, w: 0.45, s: 0.35, f: 0.3},
    {k: 'mono', n: '흑백', b: 0.08, w: 0, s: 1, f: 0.05}
  ];
  // 현재 크롭의 중앙값을 사진마다 구한다. 밝은 꽃잎이 충분하면 더 밝히지 않는다.
  function autoTone(){
    var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d', {willReadFrequently:true}), values=[];
    S.photos.forEach(function(p){
      try {
        var im=p.img, iw=im.naturalWidth||im.videoWidth||im.width, ih=im.naturalHeight||im.videoHeight||im.height, a=p.adj||{}, ratio=S.kind==='square'?1:9/16;
        if(!iw||!ih)return;
        var sw=iw/ih>ratio?ih*ratio:iw, sh=sw/ratio, z=Math.max(1,a.zoom||1);sw/=z;sh/=z;
        var sx=Math.max(0,Math.min(iw-sw,(iw-sw)/2*(1+(a.dx||0)))),sy=Math.max(0,Math.min(ih-sh,(ih-sh)/2*(1+(a.dy||0))));
        x.drawImage(im,sx,sy,sw,sh,0,0,32,32);var d=x.getImageData(0,0,32,32).data,hist=new Uint32Array(256);
        for(var i=0;i<d.length;i+=4)hist[Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2])]++;
        function quantile(q){var total=0;for(var n=0;n<256;n++){total+=hist[n];if(total>=1024*q)return n/255}return 1}
        var med=quantile(.5),high=quantile(.9),b=Math.max(-.2,Math.min(.35,(.54-med)*1.25));
        if(high>.88&&b>0)b=Math.min(b,Math.max(0,(.95-high)*1.5));values.push(b);
      } catch(e) {}
    });
    c.width=c.height=0; values.sort(function(a,b){return a-b});
    return {b:values.length?values[Math.floor(values.length/2)]:0,w:0,s:0,f:0};
  }
  function applyPreset(p){
    var v = p.k === 'auto' ? autoTone() : p;
    $('bright').value = v.b; $('warm').value = v.w; S.tone = {k: p.k, s: v.s, f: v.f};
    markFilter(); draw();
  }
  function markFilter(){ [].forEach.call($('filters').children, function(b){ b.classList.toggle('on', b.dataset.k === S.tone.k); b.setAttribute('aria-pressed',String(b.dataset.k === S.tone.k)); }); }
  function buildFilters(){
    var box = $('filters'); box.innerHTML = '';
    PRESETS.forEach(function(p){
      var b = document.createElement('button'); b.type = 'button'; b.dataset.k = p.k;
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var v = p.k === 'auto' ? autoTone() : p;
      if (S.photos[0]) TechaFrame.swatch(c, S.photos[0], {bright: v.b, warm: v.w, sat: v.s, fade: v.f});
      var sp = document.createElement('span'); sp.textContent = p.n;
      b.appendChild(c); b.appendChild(sp); b.onclick = function(){ applyPreset(p); };
      box.appendChild(b);
    });
    markFilter();
  }
  ['bright','warm'].forEach(function(id){ $(id).addEventListener('input', function(){ S.tone.k = 'custom'; markFilter(); }); });

  // 아래 탭: 문구 · 사진 · 보정 — 한 번에 하나만 보인다
  [].forEach.call(document.querySelectorAll('.ptabs button'), function(b){
    b.id='tab-'+b.dataset.p;b.setAttribute('role','tab');b.setAttribute('aria-controls',b.dataset.p);b.setAttribute('aria-selected',String(b.classList.contains('on')));b.tabIndex=b.classList.contains('on')?0:-1;
    $(b.dataset.p).setAttribute('role','tabpanel');$(b.dataset.p).setAttribute('aria-labelledby',b.id);
    b.onclick = function(){
    [].forEach.call(document.querySelectorAll('.ptabs button'), function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-selected',String(x===b));x.tabIndex=x===b?0:-1;$(x.dataset.p).classList.toggle('hidden', x !== b); });
    document.querySelector('.panels').scrollTop=0;
    if (b.dataset.p === 'pTone') buildFilters();
    requestAnimationFrame(fitPreview);
  }; });
  document.querySelector('.ptabs').addEventListener('keydown',function(e){if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)<0)return;var bs=[].slice.call(this.querySelectorAll('button')),i=bs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();var n=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(e.key==='ArrowLeft'?-1:1)+bs.length)%bs.length;bs[n].click();bs[n].focus()});
  async function usePhotos(srcs, add){
    var room = add ? MAXP - S.photos.length : MAXP;
    if (room <= 0) { dialog('사진은 ' + MAXP + '장까지예요', '이미 ' + MAXP + '장이 들어 있어요. 사진을 빼고(×) 다시 더해 주세요.'); return; }
    if (srcs.length > room) dialog('사진은 ' + MAXP + '장까지예요', srcs.length + '장을 고르셔서 앞의 ' + room + '장만 넣었어요. 다른 사진으로 바꾸려면 사진 칸에서 빼고(×) 다시 더해 주세요.');
    var list = [];
    var chosen=srcs.slice(0,room),failed=0;
    for (var s of chosen){ var im = await loadImg(s), small=im?await shrink(im):null; if(small) list.push({img:small,ownedURL:small===im&&/^blob:/.test(s)?s:'',adj:{zoom:1,dx:0,dy:0}});else failed++;if(/^blob:/.test(s)&&(!small||small!==im))URL.revokeObjectURL(s); }
    srcs.slice(room).forEach(function(s){if(/^blob:/.test(s))URL.revokeObjectURL(s)});
    if(!list.length){ toast('사진을 열 수 없어요. 다른 사진으로 해 볼까요?'); return; }
    if(failed)toast(chosen.length+'장 중 '+list.length+'장을 열었어요. 나머지는 다른 사진으로 골라 주세요');
    if (add && S.photos.length) { S.photos = S.photos.concat(list); photosChanged(); toast(list.length + '장을 더했어요'); return; }
    S.photos.forEach(disposePhoto);S.photos = list; S.sel = 0; dropClip();
    enterEditor();
  }
  function enterEditor(){
    S.sel = 0;
    buildThumbs(); buildWhich();
    $('s1').classList.add('hidden'); $('introBar').classList.add('hidden'); document.body.classList.add('editing');
    setTimeout(function(){ $('hint').classList.add('fade'); }, 3000);
    ['s2','bar'].forEach(function(id){$(id).classList.remove('hidden')});
    buildGrid(); draw();
    goTab('pTpl');
    window.scrollTo(0, 0);
    track('frame_editor_enter',{tpl:S.tpl,kind:S.kind,photos:S.photos.length});requestAnimationFrame(fitPreview);
  }
  $('file').onchange = function(e){
    var all = [].slice.call(e.target.files||[]);
    var vids = all.filter(function(f){ return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(f.name); });
    var files = all.filter(function(f){ return vids.indexOf(f) < 0 && (/^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(f.name)); });
    e.target.value = '';
    var add = !!S.adding && S.photos.length > 0; S.adding = false;
    if (vids.length > 1) toast('동영상은 한 편만 넣을 수 있어요. 첫 번째 것을 열게요');
    var after = vids.length ? function(){ openVideo(vids[0]); } : null;
    if (files.length) usePhotos(files.map(function(f){return URL.createObjectURL(f)}), add).then(after || function(){});
    else if (after) after();
  };
  /* ---------- 동영상: 장면 뽑기 · 영상 그대로 넣기(최대 8초, 소리 포함) ---------- */
  var CLIP_MAX = 8;
  S.clip = null;
  function mediaError(code){var e=new Error(code||'media');e.code=code||'media';return e}
  function once(el, ev, timeout){
    if(el.error)return Promise.reject(mediaError('media'));
    if((ev==='loadedmetadata'&&el.readyState>=1)||(ev==='loadeddata'&&el.readyState>=2))return Promise.resolve();
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){finish(mediaError('timeout'))},timeout||15000);
      function done(){finish()}function bad(){finish(mediaError('media'))}
      function finish(err){clearTimeout(timer);el.removeEventListener(ev,done);el.removeEventListener('error',bad);el.removeEventListener('abort',bad);err?reject(err):resolve()}
      el.addEventListener(ev,done);el.addEventListener('error',bad);el.addEventListener('abort',bad);
    });
  }
  function seekTo(v,t){
    if(v.error||!Number.isFinite(t))return Promise.reject(mediaError('media'));
    var target=Math.max(0,Math.min(t,isFinite(v.duration)?Math.max(0,v.duration-.001):t));
    if(Math.abs(v.currentTime-target)<.01&&!v.seeking)return Promise.resolve();
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){finish(mediaError('timeout'))},10000);
      function done(){finish()}function bad(){finish(mediaError('media'))}
      function finish(err){clearTimeout(timer);v.removeEventListener('seeked',done);v.removeEventListener('error',bad);v.removeEventListener('abort',bad);err?reject(err):resolve()}
      v.addEventListener('seeked',done);v.addEventListener('error',bad);v.addEventListener('abort',bad);
      try{v.currentTime=target}catch(e){finish(mediaError('media'))}
    });
  }
  function releaseVideo(v){if(!v)return;try{v.pause();v.removeAttribute('src');v.load()}catch(e){}}
  function mmss(t){ t = Math.max(0, t); return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'); }
  function frameURL(v, max){
    var w = v.videoWidth, h = v.videoHeight, k = Math.min(1, (max || 2000) / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.9);
  }
  var VS = {file: null, url: '', dur: 0, start: 0, len: CLIP_MAX, frames: [], picked: [], vt: 'clip', fv: null, prepared: false};
  function canClip(){ return capability.settled && capability.video; }
  function vsWin(){
    var d = VS.dur || 1; $('vsWin').style.left = (VS.start / d * 100) + '%'; $('vsWin').style.width = (VS.len / d * 100) + '%';
    $('vsPos').textContent = mmss(VS.start) + ' ~ ' + mmss(VS.start + VS.len) + ' (' + Math.round(VS.len) + '초)';
    if($('vsStart')){$('vsStart').max=Math.max(0,VS.dur-VS.len);$('vsStart').value=VS.start;$('vsStart').disabled=VS.dur<=VS.len;}
  }
  function setVt(t){
    VS.vt = t;
    [].forEach.call(document.querySelectorAll('.vtabs button'), function(b){ b.classList.toggle('on', b.dataset.vt === t); b.setAttribute('aria-pressed',String(b.dataset.vt===t)); });
    $('vtClip').classList.toggle('hidden', t !== 'clip'); $('vtStill').classList.toggle('hidden', t !== 'still');
    var v = $('vsv');
    if (t === 'clip') { v.currentTime = VS.start; v.play().catch(function(){}); } else v.pause();
  }
  [].forEach.call(document.querySelectorAll('.vtabs button'), function(b){ b.onclick = function(){ setVt(b.dataset.vt); }; });
  if($('vsStart'))$('vsStart').addEventListener('input',function(){VS.start=+this.value;vsWin();$('vsv').currentTime=VS.start});
  // 고른 구간만 반복 재생
  $('vsv').addEventListener('timeupdate', function(){ var v = $('vsv'); if (VS.vt === 'clip' && (v.currentTime >= VS.start + VS.len - 0.05 || v.currentTime < VS.start - 0.3)) v.currentTime = VS.start; });
  // 장면 띠: 누르거나 끌면 그 자리가 구간 가운데가 된다
  (function(){
    var f = $('vsFilm'), on = false;
    function at(e){ var r = f.getBoundingClientRect(), x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      VS.start = Math.min(Math.max(0, x * VS.dur - VS.len / 2), Math.max(0, VS.dur - VS.len)); vsWin(); $('vsv').currentTime = VS.start; }
    f.addEventListener('pointerdown', function(e){ if (VS.dur <= VS.len) return; on = true; f.setPointerCapture(e.pointerId); at(e); });
    f.addEventListener('pointermove', function(e){ if (on) at(e); });
    ['pointerup','pointercancel'].forEach(function(n){ f.addEventListener(n, function(){ on = false; $('vsv').play().catch(function(){}); }); });
  })();
  [].forEach.call(document.querySelectorAll('#vsLens button'), function(b){ b.onclick = function(){
    VS.len = Math.min(+b.dataset.l, VS.dur); VS.start = Math.min(VS.start, Math.max(0, VS.dur - VS.len));
    [].forEach.call(document.querySelectorAll('#vsLens button'), function(x){ x.classList.toggle('on', x === b); }); vsWin(); $('vsv').currentTime = VS.start;
  }; });
  // 장면 12개를 고르게 뽑아 띠·격자에 쓴다 (작게 — 넣을 때 큰 그림으로 다시 뽑는다)
  var videoGeneration=0;
  async function makeFrames(generation){
    releaseVideo(VS.fv);
    var fv = VS.fv = document.createElement('video'); fv.src = VS.url; fv.muted = true; fv.playsInline = true; fv.setAttribute('playsinline', ''); fv.preload = 'auto';
    await once(fv, 'loadeddata');
    VS.frames = [];
    for (var i = 0; i < 12; i++) { if(generation!==videoGeneration)throw mediaError('cancel');var t = (i + 0.5) * VS.dur / 12; await seekTo(fv, t);if(generation!==videoGeneration)throw mediaError('cancel'); VS.frames.push({t: t, url: frameURL(fv, 260)}); }
  }
  function room(){ return MAXP - S.photos.length; }
  function renderFrames(){
    var g = $('vsFrames'); g.innerHTML = '';
    VS.frames.forEach(function(fr, idx){
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = '<img alt=""><b></b><i></i>'; b.querySelector('img').src = fr.url; b.querySelector('i').textContent = mmss(fr.t) + (fr.own ? ' · 직접' : '');
      var k = VS.picked.indexOf(idx); if (k >= 0) { b.classList.add('on'); b.querySelector('b').textContent = k + 1; }
      b.setAttribute('aria-label',mmss(fr.t)+' 장면');b.setAttribute('aria-pressed',String(k>=0));
      var done = S.photos.some(function(p){ return p.vf === VS.url + '#' + idx; });
      if (done) { b.classList.add('done'); b.querySelector('b').textContent = '넣음'; b.disabled = true; }
      b.onclick = function(){
        var j = VS.picked.indexOf(idx);
        if (j >= 0) VS.picked.splice(j, 1);
        else if (VS.picked.length >= room()) { dialog('사진은 ' + MAXP + '장까지예요', '지금 ' + room() + '장을 더 넣을 수 있어요. 다른 장면을 빼고 골라 주세요.'); return; }
        else VS.picked.push(idx);
        renderFrames();
      };
      g.appendChild(b);
    });
    var n = VS.picked.length;
    $('vsPickNote').textContent = '넣을 장면을 눌러 고르세요 · 고른 순서대로 들어가요 · 남은 자리 ' + (room() - n) + '장';
    $('vsStill').textContent = n ? '고른 ' + n + '장 넣기' : '장면을 골라 주세요'; $('vsStill').disabled = !n;
  }
  async function openVideo(file){
    var generation=++videoGeneration;
    VS.prepared=false;
    releaseVideo(VS.fv);VS.fv=null;
    if (VS.url && (!S.clip || VS.url!==S.clip.url)) URL.revokeObjectURL(VS.url);
    VS.file = file; VS.url = URL.createObjectURL(file); VS.picked = []; VS.frames = [];
    var v = $('vsv'); v.src = VS.url; showModal($('vsheet'),$('vsClose'));
    $('vsClip').disabled=true;$('vtClipBtn').disabled=true;
    $('vsPickNote').textContent = '장면을 고르는 중이에요…'; $('vsFrames').innerHTML = ''; $('vsStill').disabled = true;
    try {
    await once(v, 'loadedmetadata');if(generation!==videoGeneration)return;
    if (!v.duration || !isFinite(v.duration) || !v.videoWidth) throw mediaError('media');
    VS.dur = v.duration; VS.start = 0; VS.len = Math.min(CLIP_MAX, VS.dur);
    $('vsFrames').style.setProperty('--va', v.videoWidth + '/' + v.videoHeight);
    $('vsRange').max = VS.dur.toFixed(2); $('vsRange').value = 0;
    // 8초 이하 영상은 고를 것 없이 전체
    var short = VS.dur <= CLIP_MAX + 0.05;
    $('vsLens').classList.toggle('hidden', short);
    $('vsClipNote').textContent = (short ? '영상 전체 '+VS.dur.toFixed(1)+'초를 넣어요.' : '장면 띠나 시작 위치로 구간을 골라 주세요.')+' 소리는 기기에 따라 빠질 수 있어요.';
    [].forEach.call(document.querySelectorAll('#vsLens button'), function(x){ x.disabled = +x.dataset.l > VS.dur + 0.5; x.classList.toggle('on', +x.dataset.l === CLIP_MAX); });
    if(capabilityPromise)await capabilityPromise;if(generation!==videoGeneration)return;
    $('vtClipBtn').disabled = !canClip();$('vsClip').disabled=!canClip();$('vsClip').textContent='이 구간 넣기';
    vsWin();
    setVt(canClip() ? 'clip' : 'still');
    try { await makeFrames(generation); } catch (e) { if(e.code==='cancel')return;toast('장면 미리보기를 다 열지 못했어요. 직접 찾기를 써 주세요'); }
    if(generation!==videoGeneration)return;
    var film = $('vsFilm'); [].slice.call(film.querySelectorAll('img')).forEach(function(i){ i.remove(); });
    VS.frames.forEach(function(fr){ var im = document.createElement('img'); im.src = fr.url; im.alt = ''; film.insertBefore(im, $('vsWin')); });
    renderFrames();
    VS.prepared=true;
    } catch(e){
      if(generation!==videoGeneration)return;
      releaseVideo(v);releaseVideo(VS.fv);VS.fv=null;
      if(VS.url&&(!S.clip||VS.url!==S.clip.url))URL.revokeObjectURL(VS.url);VS.url='';VS.file=null;closeModal($('vsheet'));
      toast(e.code==='timeout'?'동영상을 여는 데 시간이 걸려요. 다른 동영상이나 사진을 골라 주세요':'이 동영상은 열 수 없어요. 다른 동영상이나 사진을 골라 주세요');
      track('frame_media_error',{error:e.code==='timeout'?'timeout':'media'});
    }
  }
  function showAgain(){
    $('again').classList.toggle('hidden', !VS.file && !S.clip);
    $('againClip').classList.toggle('hidden', !S.clip || !canClip());
  }
  function reopenVideo(tab){
    if(S.clip&&(!VS.file||(tab==='clip'&&S.clip.url!==VS.url))){var oldClip=S.clip;openVideo(oldClip.file).then(function(){if(VS.prepared&&S.clip===oldClip&&VS.file===oldClip.file){VS.start=oldClip.start;VS.len=oldClip.len;vsWin();setVt(tab)}});return;}
    if(!VS.prepared&&VS.file){var file=VS.file;openVideo(file).then(function(){if(VS.prepared&&VS.file===file)setVt(tab)});return;}
    if (!VS.url) return;
    if (S.clip && S.clip.url === VS.url) { VS.start = S.clip.start; VS.len = S.clip.len; vsWin(); }
    showModal($('vsheet'),$('vsClose')); renderFrames(); setVt(tab);
  }
  $('againStill').onclick = function(){ reopenVideo('still'); };
  $('againClip').onclick = function(){ reopenVideo('clip'); };
  function goTab(id){ var b = document.querySelector('.ptabs [data-p="' + id + '"]'); if (b) b.click(); }
  $('vsRange').addEventListener('input', function(){ var v = $('vsv'); v.pause(); v.currentTime = +$('vsRange').value; });
  $('vsAddNow').onclick = function(){
    var v = $('vsv'); v.pause();
    if (VS.picked.length >= room()) { dialog('사진은 ' + MAXP + '장까지예요', '다른 장면을 빼고 추가해 주세요.'); return; }
    VS.frames.push({t: v.currentTime, url: frameURL(v, 260), own: true}); VS.picked.push(VS.frames.length - 1); renderFrames();
    toast(mmss(v.currentTime) + ' 장면을 골랐어요');
  };
  $('vsClose').onclick = function(){ ++videoGeneration;$('vsv').pause();closeModal($('vsheet')); };
  $('vsStill').onclick = async function(){
    if (!VS.picked.length) return;
    busy(true, '장면을 넣는 중…', 0);
    var urls = [];
    try {
      for (var i = 0; i < VS.picked.length; i++) { await seekTo(VS.fv, VS.frames[VS.picked[i]].t); urls.push(frameURL(VS.fv, 2000)); busy(true, '장면을 넣는 중…', (i + 1) / VS.picked.length); }
    } catch(e){toast('장면을 넣지 못했어요. 다른 장면을 골라 주세요');return;} finally { busy(false); }
    $('vsv').pause(); closeModal($('vsheet'));
    var picked = VS.picked.slice(), before = S.photos.length;
    await usePhotos(urls, S.photos.length > 0);
    // 방금 들어간 사진에 '어느 장면'인지 남긴다 → 다시 열면 '넣음' 표시
    var added = S.photos.slice(-Math.min(urls.length, S.photos.length));
    added.forEach(function(ph, j){ if (picked[j] != null) ph.vf = VS.url + '#' + picked[j]; });
    VS.picked = [];
    showAgain(); goTab('pPhoto');
    toast(urls.length + '장을 넣었어요. 사진·순서 탭에서 다시 고를 수 있어요');
  };
  function dropClip(){ if (S.clip) { var old=S.clip;S.clip=null;releaseVideo(old.el);if(old.url!==VS.url)URL.revokeObjectURL(old.url); } cleanupPrime(); }
  $('vsClip').onclick = async function(){
    if(!canClip()||this.disabled)return;this.disabled=true;
    var v = $('vsv'); v.pause();
    var st = VS.start, len = VS.len;
    var pv = document.createElement('video'); pv.src = VS.url; pv.muted = true; pv.playsInline = true; pv.setAttribute('playsinline', ''); pv.preload = 'auto';
    try {
    await once(pv, 'loadeddata');
    await seekTo(pv, st);
    var poster = frameURL(pv, 400);
    dropClip();
    S.clip = {file: VS.file, url: VS.url, start: st, len: len, el: pv};
    S.photos = S.photos.filter(function(p){ return !p.isVideo; });
    if (S.photos.length >= MAXP) {S.photos.slice(MAXP-1).forEach(disposePhoto);S.photos = S.photos.slice(0, MAXP - 1);}
    S.photos.unshift({img: pv, isVideo: true, poster: poster, adj: {zoom: 1, dx: 0, dy: 0}});
    closeModal($('vsheet'));
    if ($('s2').classList.contains('hidden')) enterEditor(); else photosChanged();
    pv.play().catch(function(){});
    if (!$('kVideo').classList.contains('hidden')) setKind('video');
    showAgain();
    toast(Math.round(len) + '초 영상을 넣었어요. 틀 안에서 재생돼요');
    }catch(e){releaseVideo(pv);toast('영상을 넣지 못했어요. 장면을 사진으로 골라 주세요')}finally{$('vsClip').disabled=!canClip();}
  };
  // 미리보기용 영상은 고른 구간만 반복
  function clipLoop(){ var c = S.clip; if (!c) return; var v = c.el; if (v.currentTime >= c.start + c.len || v.currentTime < c.start - 0.2) v.currentTime = c.start; if (v.paused) v.play().catch(function(){}); }

  // 컴퓨터: 사진을 화면에 끌어다 놓으면 들어간다 (편집 중이면 더하기)
  var dragDepth = 0;
  window.addEventListener('dragenter', function(e){ if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { dragDepth++; document.body.classList.add('drop'); } });
  window.addEventListener('dragleave', function(){ if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('drop'); } });
  window.addEventListener('dragover', function(e){ e.preventDefault(); });
  window.addEventListener('drop', function(e){
    e.preventDefault(); dragDepth = 0; document.body.classList.remove('drop');
    var all = [].slice.call((e.dataTransfer && e.dataTransfer.files) || []);
    var files = all.filter(function(f){ return /^image\//.test(f.type); }), vids = all.filter(function(f){ return /^video\//.test(f.type); });
    var after = vids.length ? function(){ openVideo(vids[0]); } : null;
    if (files.length) usePhotos(files.map(function(f){ return URL.createObjectURL(f); }), S.photos.length > 0).then(after || function(){});
    else if (after) after();
  });

  // 화면 확인용: ?demo=1 이면 공방 사진 2장으로 시작
  if (/[?&]demo=1/.test(location.search)) usePhotos(['/assets/images/home/hydrangea-pink.jpg','/assets/images/home/glassdome-rose.jpg']);
  if (/[?&]demo=8/.test(location.search)) usePhotos(['hydrangea-pink','glassdome-rose','hydrangea-blue','pinkpeach-bouquet','red-rose-bouquet','sunflower-bouquet','rose-soap-bouquet','glassdome-hydrangea'].map(function(n){ return '/assets/images/home/' + n + '.jpg'; }));

  $('txt').addEventListener('input', function(){ $('cnt').textContent = $('txt').value.length + '/60 · 20자 안팎이 가장 예뻐요'; });
  ['cap2','cap3'].forEach(function(id){ $(id).addEventListener('input', draw); });
  ['txt','from','recv','bright','warm','mk'].forEach(function(id){ $(id).addEventListener('input', draw); $(id).addEventListener('change', function(){ draw(); if(id!=='bright'&&id!=='warm') buildGrid(); }); });
  $('zoom').addEventListener('input', function(){ var p=S.photos[S.sel]; if(p){p.adj.zoom=+$('zoom').value; draw();} });
  if($('resetPhoto'))$('resetPhoto').onclick=function(){var p=S.photos[S.sel];if(p){p.adj={zoom:1,dx:0,dy:0};$('zoom').value=1;draw();buildGrid();toast('사진 위치와 확대를 처음으로 돌렸어요')}};
  [].forEach.call(document.querySelectorAll('[data-move]'),function(b){b.onclick=function(){var p=S.photos[S.sel];if(!p)return;var a=p.adj,axis=/left|right/.test(b.dataset.move)?'dx':'dy',delta=/left|up/.test(b.dataset.move)?.08:-.08;a[axis]=Math.max(-1,Math.min(1,a[axis]+delta));draw();buildGrid()}});

  // 미리보기에서 끌어서 사진 위치 옮기기
  var drag=null;
  $('pv').addEventListener('pointerdown', function(e){ var p=S.photos[S.sel]; if(!p) return; drag={x:e.clientX,y:e.clientY,dx:p.adj.dx,dy:p.adj.dy,w:$('pv').clientWidth}; $('hint').classList.add('hidden'); $('pv').setPointerCapture(e.pointerId); });
  $('pv').addEventListener('pointermove', function(e){ if(!drag) return; var p=S.photos[S.sel], k=2.4/drag.w;
    p.adj.dx=Math.max(-1,Math.min(1,drag.dx-(e.clientX-drag.x)*k)); p.adj.dy=Math.max(-1,Math.min(1,drag.dy-(e.clientY-drag.y)*k)); draw(); });
  ['pointerup','pointercancel'].forEach(function(ev){ $('pv').addEventListener(ev, function(){ if(drag){drag=null; buildGrid();} }); });

  /* ---------- 만들기: 사진(JPG) · 영상(MP4/WebM) · GIF ---------- */
  var job=null,lastExportMeta={route:'jpg',seconds:0},exportIntent='save';
  function checkJob(){if(job&&(job.cancel||Date.now()-job.started>120000))throw mediaError(job.cancel?'cancel':'timeout')}
  function bounded(promise,ms){return new Promise(function(resolve,reject){var finished=false,timer=setTimeout(function(){end(mediaError('timeout'))},ms||30000),poll=setInterval(function(){try{checkJob()}catch(e){end(e)}},100);function end(e,v){if(finished)return;finished=true;clearTimeout(timer);clearInterval(poll);e?reject(e):resolve(v)}Promise.resolve(promise).then(function(v){end(null,v)},function(e){end(e)})})}
  function busy(on, msg, p){
    if(on&&$('busy').classList.contains('hidden'))showModal($('busy'),$('cancelExport'));else if(!on&&!$('busy').classList.contains('hidden'))closeModal($('busy'));
    if (msg&&$('busyMsg').textContent!==msg) $('busyMsg').textContent = msg; $('busyFill').style.width = Math.round((p || 0) * 100) + '%';
    if($('cancelExport'))$('cancelExport').disabled=!job;if($('busyNote'))$('busyNote').textContent='이 화면을 켜 두면 만들기를 이어갈 수 있어요.';
  }
  if($('cancelExport'))$('cancelExport').onclick=function(){if(job){job.cancel=true;this.disabled=true;$('busyMsg').textContent='멈추는 중…';}};
  function nextFrame(){ return new Promise(function(r){ setTimeout(r, 0); }); }

  function photoBlob(){
    return bounded(new Promise(function(resolve,reject){ var c = document.createElement('canvas');try{TechaFrame.render(c, S.tpl, opts());c.toBlob(function(b){c.width=c.height=0;b?resolve(b):reject(mediaError('encode'))}, 'image/jpeg', 0.93)}catch(e){c.width=c.height=0;reject(e)} }),15000);
  }

  // 영상(우선): WebCodecs 로 30fps 장면을 하나씩 인코딩 → mp4-muxer 로 표준 MP4(faststart).
  // 실시간 녹화가 아니라 빠르고, 인스타가 받는 일반 MP4 구조로 나온다.
  var VW = 720, VH = 1280, FPS = 30;
  var WC_CODEC = null;
  async function webcodecsCodec(){
    if (WC_CODEC !== null) return WC_CODEC;
    WC_CODEC = '';
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return WC_CODEC;
    var list = ['avc1.4d0028', 'avc1.42e028', 'avc1.640028'];
    for (var i = 0; i < list.length; i++) {
      try { var r = await VideoEncoder.isConfigSupported({codec: list[i], width: VW, height: VH, bitrate: 6000000, framerate: FPS, avc:{format:'avc'}}); if (r.supported) { WC_CODEC = list[i]; break; } } catch (e) {}
    }
    return WC_CODEC;
  }
  var muxLib = null;
  function closeEncoder(e){if(e&&e.state!=='closed')try{e.close()}catch(x){}}
  async function waitQueue(enc,high,error){while(enc.encodeQueueSize>high){checkJob();if(error())throw error();await bounded(new Promise(function(resolve){var timer=setTimeout(done,50);function done(){clearTimeout(timer);enc.removeEventListener('dequeue',done);resolve()}enc.addEventListener('dequeue',done,{once:true})}),1000)}checkJob();if(error())throw error()}
  async function videoBlobWC(codec){
    if (!muxLib) muxLib = await bounded(import('/frame/vendor/mp4-muxer.min.mjs'),15000);
    var target = new muxLib.ArrayBufferTarget();
    var muxer = new muxLib.Muxer({target: target, video: {codec: 'avc', width: VW, height: VH, frameRate: FPS}, fastStart: 'in-memory'});
    var err = null;
    var enc = new VideoEncoder({output: function(chunk, meta){ muxer.addVideoChunk(chunk, meta); }, error: function(e){ err = e; }});
    var c = document.createElement('canvas'), o = opts(); o.anim = true;
    try{
    enc.configure({codec: codec, width: VW, height: VH, bitrate: 6000000, framerate: FPS, avc: {format: 'avc'}});
    var n = Math.round(DUR.video / 1000 * FPS), us = 1e6 / FPS;
    for (var i = 0; i < n; i++) {
      checkJob();if (err) throw err;await waitQueue(enc,6,function(){return err});
      o.t = i / n; TechaFrame.render(c, S.tpl, o, VW / 1080);
      var f = new VideoFrame(c, {timestamp: Math.round(i * us), duration: Math.round(us)});
      try{enc.encode(f, {keyFrame: i % 60 === 0})}finally{f.close()}
      if (i % 5 === 0) { busy(true, '영상 만드는 중…', i / n); await nextFrame(); }
    }
    await bounded(enc.flush(),30000);
    if (err) throw err;
    muxer.finalize();
    lastExportMeta={route:'webcodecs',seconds:DUR.video/1000,audio:false};
    return new Blob([target.buffer], {type: 'video/mp4'});
    }finally{closeEncoder(enc);c.width=c.height=0}
  }

  async function videoBlob(){
    if (S.clip) return clipVideoBlob();
    var codec = await webcodecsCodec();
    if (codec) { try { return await videoBlobWC(codec); } catch (e) { checkJob(); } }
    if(!VIDEO_MIME)throw mediaError('unsupported');
    return videoBlobRec();
  }

  // ---- 넣은 영상으로 만들기 ----
  // ① WebCodecs: 영상을 실제 속도로 재생하며 장면마다 인코딩 + 소리는 파일에서 꺼내 AAC 로 → 표준 MP4
  // ② 안 되면 녹화(MediaRecorder): 화면 + 소리를 함께 녹화
  // ③ 그것도 안 되면 소리 없이 ①
  async function aacOK(){
    if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return false;
    try { return (await AudioEncoder.isConfigSupported({codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128000})).supported; } catch (e) { return false; }
  }
  function exportPhotos(ev){ return S.photos.map(function(p){ return p.isVideo ? {img: ev, adj: p.adj} : p; }); }
  async function clipVideoBlob(){
    var codec = await webcodecsCodec();
    if (codec && await bounded(aacOK(),5000)) { try { return await clipWC(codec, true); } catch (e) { checkJob(); } }
    if (VIDEO_MIME) { try { return await clipRec(); } catch (e) { checkJob(); } }
    if (codec) { toast('이 휴대폰에서는 소리 없이 만들어져요'); return clipWC(codec, false); }
    throw mediaError('unsupported');
  }
  async function clipWC(codec, withAudio){
    if (!muxLib) muxLib = await bounded(import('/frame/vendor/mp4-muxer.min.mjs'),15000);
    var c=S.clip,ev=document.createElement('video'),cv=document.createElement('canvas'),aenc=null,venc=null,actx=null,err=null,stopped=false,callback=0;
    try{
      ev.src=c.url;ev.muted=true;ev.playsInline=true;ev.preload='auto';await bounded(once(ev,'loadeddata'),15000);
      var ab=null,ch=2,sr=48000;
      if(withAudio){
        try{var AC=window.AudioContext||window.webkitAudioContext;actx=new AC();ab=await bounded(actx.decodeAudioData(await bounded(c.file.arrayBuffer(),15000)),20000);sr=ab.sampleRate;ch=Math.min(2,ab.numberOfChannels);var sup=await bounded(AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:ch,bitrate:128000}),5000);if(!sup.supported)ab=null}
        catch(e){checkJob();ab=null}finally{if(actx){actx.close().catch(function(){});actx=null}}
      }
      var target=new muxLib.ArrayBufferTarget(),muxer=new muxLib.Muxer({target:target,video:{codec:'avc',width:VW,height:VH,frameRate:FPS},audio:ab?{codec:'aac',sampleRate:sr,numberOfChannels:ch}:undefined,fastStart:'in-memory',firstTimestampBehavior:'offset'});
      if(ab){
        aenc=new AudioEncoder({output:function(chunk,meta){muxer.addAudioChunk(chunk,meta)},error:function(e){err=e}});aenc.configure({codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:ch,bitrate:128000});
        var a0=Math.floor(c.start*sr),a1=Math.min(ab.length,Math.floor((c.start+c.len)*sr)),channels=[];for(var k=0;k<ch;k++)channels.push(ab.getChannelData(k));
        for(var off=a0;off<a1;off+=1024){await waitQueue(aenc,8,function(){return err});var n=Math.min(1024,a1-off),buf=new Float32Array(n*ch);for(var j=0;j<ch;j++)buf.set(channels[j].subarray(off,off+n),j*n);var ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:n,numberOfChannels:ch,timestamp:Math.round((off-a0)/sr*1e6),data:buf});try{aenc.encode(ad)}finally{ad.close()}}
        await bounded(aenc.flush(),20000);closeEncoder(aenc);aenc=null;
      }
      venc=new VideoEncoder({output:function(chunk,meta){muxer.addVideoChunk(chunk,meta)},error:function(e){err=e}});venc.configure({codec:codec,width:VW,height:VH,bitrate:6000000,framerate:FPS,avc:{format:'avc'}});
      var o=opts();o.anim=true;o.clip=true;o.photos=exportPhotos(ev);var frames=Math.max(1,Math.round(c.len*FPS)),i=0;
      await bounded(seekTo(ev,c.start),10000);
      // 실제 재생 프레임 흐름을 유지하고, 인코더가 밀릴 때만 재생을 잠시 멈춘다.
      await bounded(new Promise(function(resolve,reject){
        function schedule(){if(stopped)return;callback=ev.requestVideoFrameCallback?ev.requestVideoFrameCallback(step):requestAnimationFrame(step)}
        async function step(){
          try{
            if(stopped)return;checkJob();if(err)throw err;
            if(venc.encodeQueueSize>6){ev.pause();await waitQueue(venc,3,function(){return err});if(stopped)return;await ev.play()}
            var vt=Math.max(0,ev.currentTime-c.start),batch=0;
            while(i<frames&&(i/FPS<=vt||ev.ended)&&batch<4){
              if(venc.encodeQueueSize>8)break;o.t=i/frames;TechaFrame.render(cv,S.tpl,o,VW/1080);var f=new VideoFrame(cv,{timestamp:Math.round(i*1e6/FPS),duration:Math.round(1e6/FPS)});try{venc.encode(f,{keyFrame:i%60===0})}finally{f.close()}i++;batch++;
            }
            busy(true,'영상 만드는 중…',i/frames);
            if(i>=frames){ev.pause();resolve();return}
            if(ev.ended||vt>=c.len){callback=requestAnimationFrame(step)}else schedule();
          }catch(e){reject(e)}
        }
        ev.play().then(step,reject);
      }),45000);
      await bounded(venc.flush(),30000);if(err)throw err;muxer.finalize();lastExportMeta={route:'webcodecs',seconds:c.len,audio:!!ab};return new Blob([target.buffer],{type:'video/mp4'});
    }finally{stopped=true;cancelAnimationFrame(callback);if(ev.cancelVideoFrameCallback)ev.cancelVideoFrameCallback(callback);closeEncoder(aenc);closeEncoder(venc);if(actx)actx.close().catch(function(){});releaseVideo(ev);cv.width=cv.height=0;}
  }
  // 녹화 방식: 화면(캔버스) + 영상 소리를 같이 녹화. 소리는 버튼을 누를 때 열어 둔 오디오 길로 받는다
  function cleanupPrime(){
    if(S.rec){try{S.rec.src.disconnect()}catch(e){}S.rec.dest.stream.getTracks().forEach(function(t){t.stop()});releaseVideo(S.rec.ev);S.rec=null}
    if(S.actx){S.actx.close().catch(function(){});S.actx=null}
  }
  function primeMedia(){
    if (!S.clip || S.kind !== 'video') return;
    cleanupPrime();
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!S.actx) S.actx = new AC();
      if (S.actx.state === 'suspended') S.actx.resume();
      var ev = document.createElement('video'); ev.src = S.clip.url; ev.playsInline = true; ev.setAttribute('playsinline', ''); ev.preload = 'auto';
      var src = S.actx.createMediaElementSource(ev), dest = S.actx.createMediaStreamDestination(); src.connect(dest);
      var pr = ev.play(); if (pr && pr.then) pr.then(function(){ ev.pause(); }).catch(function(){});
      S.rec = {ev: ev, dest: dest, src:src};
    } catch (e) { cleanupPrime(); }
  }
  function recordCanvas(stream,mime,duration,render,play){
    return new Promise(function(resolve,reject){
      var rec,parts=[],rafID=0,timer=0,done=false,st=performance.now(),last=0,progressAt=Date.now();
      function finish(err,b){if(done)return;done=true;cancelAnimationFrame(rafID);clearInterval(timer);if(rec){rec.ondataavailable=rec.onstop=rec.onerror=null;if(rec.state!=='inactive')try{rec.stop()}catch(e){}}stream.getTracks().forEach(function(t){t.stop()});err?reject(err):resolve(b)}
      try{
        rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});rec.ondataavailable=function(e){if(e.data&&e.data.size)parts.push(e.data)};
        rec.onerror=function(){finish(mediaError('encode'))};rec.onstop=function(){var type=(rec.mimeType||mime).split(';')[0];finish(null,new Blob(parts,{type:type}))};
        rec.start(250);if(play)Promise.resolve(play()).catch(function(){finish(mediaError('media'))});
        timer=setInterval(function(){try{checkJob();if(Date.now()-progressAt>15000)throw mediaError('timeout')}catch(e){finish(e)}},200);
        function step(){if(done)return;try{checkJob();var t=render((performance.now()-st)/1000);if(t>last+.001){last=t;progressAt=Date.now()}busy(true,'영상 만드는 중…',Math.min(1,t/duration));if(t>=duration){rec.stop();return}rafID=requestAnimationFrame(step)}catch(e){finish(e)}}step();
      }catch(e){finish(e)}
    });
  }
  async function clipRec(){
    var c=S.clip,R=S.rec;if(!R)throw mediaError('unsupported');var ev=R.ev,cv=document.createElement('canvas');
    try{
      await bounded(once(ev,'loadeddata'),15000);await bounded(seekTo(ev,c.start),10000);
      var o=opts();o.anim=true;o.clip=true;o.photos=exportPhotos(ev);TechaFrame.render(cv,S.tpl,Object.assign({},o,{t:0}),VW/1080);
      cv.style.cssText='position:fixed;left:-10000px;top:0;width:10px;height:18px';document.body.appendChild(cv);
      var stream=cv.captureStream(FPS),audio=R.dest.stream.getAudioTracks();audio.forEach(function(t){stream.addTrack(t)});
      var mimes=['video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'],mime=mimes.filter(function(m){return MediaRecorder.isTypeSupported(m)})[0];if(!mime){stream.getTracks().forEach(function(t){t.stop()});throw mediaError('unsupported')}
      var b=await recordCanvas(stream,mime,c.len,function(){var elapsed=ev.currentTime-c.start;o.t=Math.min(.999,Math.max(0,elapsed/c.len));TechaFrame.render(cv,S.tpl,o,VW/1080);return ev.ended?c.len:elapsed},function(){return ev.play()});
      lastExportMeta={route:'recorder',seconds:c.len,audio:audio.length>0};return b;
    }finally{ev.pause();cv.remove();cv.width=cv.height=0;}
  }

  // 영상(대신): 720×1280 캔버스를 실제로 6초 재생하면서 녹화한다
  async function videoBlobRec(){
      var s = 2 / 3, c = document.createElement('canvas'), o = opts(); o.anim = true; o.t = 0;
      try{
      TechaFrame.render(c, S.tpl, o, s);
      c.style.cssText = 'position:fixed;left:-10000px;top:0;width:10px;height:18px'; document.body.appendChild(c);
      var b=await recordCanvas(c.captureStream(FPS),VIDEO_MIME,DUR.video/1000,function(elapsed){o.t=Math.min(.999,elapsed/(DUR.video/1000));TechaFrame.render(c,S.tpl,o,s);return elapsed});lastExportMeta={route:'recorder',seconds:DUR.video/1000,audio:false};return b;
      }finally{c.remove();c.width=c.height=0}
  }

  // GIF: 432×768, 초당 10장, 4초 반복. 미세 질감은 뺀다(파일 크기). 장마다 색 256개를 새로 골라 꽃 색이 덜 뭉개지게
  var gifLib = null;
  async function gifBlob(){
    if (!gifLib) gifLib = await bounded(import('/frame/vendor/gifenc.esm.js'),15000);
    var s = 432 / 1080, fps = 10, glen = S.clip ? Math.min(S.clip.len, DUR.gif / 1000) : DUR.gif / 1000, n = Math.round(glen * fps), delay = Math.round(1000 / fps);
    var c = document.createElement('canvas'), o = opts(); o.anim = true; o.lite = true;
    var gv = null;
    try{
    if (S.clip) { gv = document.createElement('video'); gv.src = S.clip.url; gv.muted = true; gv.playsInline = true; gv.preload = 'auto'; await bounded(once(gv, 'loadeddata'),15000); o.clip = true; o.photos = exportPhotos(gv); }
    async function at(t){checkJob(); if (gv) await bounded(seekTo(gv, S.clip.start + t * glen),10000); }
    TechaFrame.render(c, S.tpl, Object.assign({}, o, {t: 0}), s);
    var x = c.getContext('2d', {willReadFrequently: true}), enc = gifLib.GIFEncoder();
    // 색 256개는 여러 장면에서 고루 뽑아 한 번만 정한다 — 장면마다 바꾸면 색이 깜빡인다
    var picks = 8, px = c.width * c.height, sample = new Uint8ClampedArray(picks * Math.ceil(px / 4) * 4), si = 0;
    for (var p = 0; p < picks; p++) {
      o.t = p / picks; await at(o.t); TechaFrame.render(c, S.tpl, o, s);
      var d0 = x.getImageData(0, 0, c.width, c.height).data;
      for (var q = 0; q < d0.length; q += 16) { sample[si++] = d0[q]; sample[si++] = d0[q + 1]; sample[si++] = d0[q + 2]; sample[si++] = 255; }
      busy(true, 'GIF 준비 중…', (p + 1) / picks * 0.2); await nextFrame();
    }
    var palette = gifLib.quantize(sample.subarray(0, si), 256);
    for (var i = 0; i < n; i++) {
      o.t = i / n; await at(o.t); TechaFrame.render(c, S.tpl, o, s);
      var data = x.getImageData(0, 0, c.width, c.height).data;
      enc.writeFrame(gifLib.applyPalette(data, palette), c.width, c.height, i === 0 ? {palette: palette, delay: delay} : {delay: delay});
      busy(true, 'GIF 만드는 중…', 0.2 + (i + 1) / n * 0.8);
      await nextFrame();
    }
    enc.finish();
    lastExportMeta={route:'gif',seconds:glen,audio:false};
    return new Blob([enc.bytes()], {type: 'image/gif'});
    }finally{releaseVideo(gv);c.width=c.height=0;}
  }

  // 같은 설정으로 저장·공유하기를 연달아 누르면 다시 만들지 않는다
  var made = {key: '', blob: null};
  function stateKey(){ var o = opts(); return JSON.stringify([S.tpl, S.kind, o.text, o.caps, o.omitText, o.from, $('recv').value, o.mark, o.bright, o.warm, o.sat, o.fade, S.photos.map(function(p){ return [String(p.img.src).slice(-40), p.adj]; }), S.clip ? [S.clip.url,S.clip.start, S.clip.len] : 0, S.clip && still() ? Math.round(S.clip.el.currentTime*30)/30 : 0]); }
  async function make(){
    var k = stateKey(); if (made.key === k && made.blob) return made.blob;
    if(job)throw mediaError('encode');job={cancel:false,started:Date.now()};
    track('frame_export_start',{tpl:S.tpl,kind:S.kind,photos:S.photos.length,intent:exportIntent});
    busy(true, still() ? '사진 만드는 중…' : S.kind === 'video' ? '영상 만드는 중…' : 'GIF 만드는 중…', 0);
    try {
      await bounded(TechaFrame.loadFonts(textNow()),15000);if(S.kind==='video'&&capabilityPromise)await capabilityPromise;checkJob();
      if(still())lastExportMeta={route:'jpg',seconds:0,audio:false};
      var b = S.kind === 'video' ? await videoBlob() : S.kind === 'gif' ? await gifBlob() : await photoBlob();
      checkJob();if(!b||!b.size)throw mediaError('encode');
      made = {key: k, blob: b,meta:Object.assign({},lastExportMeta)};
      track('frame_export_ready',{tpl:S.tpl,kind:S.kind,photos:S.photos.length,route:lastExportMeta.route,mime:ext(b),seconds:lastExportMeta.seconds});return b;
    } catch(e){track('frame_export_error',{kind:S.kind,error:e.code==='cancel'?'cancel':e.code==='timeout'?'timeout':e.code==='unsupported'?'unsupported':'encode'});throw e;
    } finally {job=null;cleanupPrime();busy(false);}
  }
  function ext(b){ return b.type === 'image/gif' ? 'gif' : b.type.indexOf('mp4') >= 0 ? 'mp4' : b.type.indexOf('webm') >= 0 ? 'webm' : 'jpg'; }
  function fname(b){ return 'techa-flower-' + S.tpl + '.' + ext(b); }
  function saveBlob(b){
    if(!b)return;var a=document.createElement('a'),url=URL.createObjectURL(b);a.href=url;a.download=fname(b);document.body.appendChild(a);
    try{a.click();track('frame_download_requested',{kind:S.kind,mime:ext(b)});toast('파일 저장을 요청했어요. 다운로드 폴더를 확인해 주세요');if($('resultError'))$('resultError').textContent='저장한 파일이 사진첩에 보이지 않으면 파일 앱의 다운로드 폴더를 확인해 주세요.'}finally{a.remove();setTimeout(function(){URL.revokeObjectURL(url)},60000)}
  }
  var sharing=false;
  async function shareBlob(b){
    if(!b||sharing)return;var file=new File([b],fname(b),{type:b.type});
    try{
      if(!navigator.canShare||!navigator.share||!navigator.canShare({files:[file]})){track('frame_share_error',{kind:S.kind,mime:ext(b),error:'unsupported'});$('resultError').textContent='이 브라우저에서는 파일 공유가 어려워요. 휴대폰에 저장한 뒤 올릴 앱에서 골라 주세요.';return}
      sharing=true;$('rShare').disabled=true;$('resultError').textContent='';
      await navigator.share({files:[file]});track('frame_share_resolved',{kind:S.kind,mime:ext(b)});$('resultError').textContent='선택한 앱에서 공유를 이어가 주세요.';
    }catch(e){
      var aborted=e.name==='AbortError';track(aborted?'frame_share_abort':'frame_share_error',{kind:S.kind,mime:ext(b),error:aborted?'cancel':'share'});
      $('resultError').textContent=aborted?'공유가 이어지지 않았어요. 다시 공유하거나 저장할 수 있어요.':'공유창을 열지 못했어요. 다시 누르거나 휴대폰에 저장해 주세요.';
    }finally{sharing=false;$('rShare').disabled=false;}
  }
  // 이미 만들어 둔 게 있으면 바로, 없으면 만든 뒤 '다 만들었어요' 시트에서 한 번 더 누르게 한다
  async function act(kind){
    if(job||sharing||!S.photos.length)return;exportIntent=kind;
    primeMedia();
    var cached=made.key===stateKey()&&made.blob;
    if(!cached)try { await make(); } catch (e) { toast(e.code==='cancel'?'만들기를 멈췄어요. 계속 꾸밀 수 있어요':e.code==='timeout'?'만드는 데 시간이 걸려요. 사진으로 만들거나 다시 해 주세요':'만들지 못했어요. 사진으로 해 볼까요?'); return; }
    else cleanupPrime();
    $('readyMsg').textContent = S.kind === 'video' ? '영상을 다 만들었어요' : S.kind === 'gif' ? 'GIF를 다 만들었어요' : '사진을 다 만들었어요';
    showResult(made.blob);$('resultError').classList.remove('hidden');$('resultError').textContent='';
    var primary=kind==='save'?$('rSave'):$('rShare'),secondary=kind==='save'?$('rShare'):$('rSave');primary.className='btn cta';secondary.className='btn sub';$('resultActions').appendChild(primary);$('resultActions').appendChild(secondary);
    showModal($('ready'),primary);track('frame_result_view',{kind:S.kind,mime:ext(made.blob),intent:kind});
    if(cached){if(kind==='share')shareBlob(made.blob);else saveBlob(made.blob)}
  }
  $('saveBtn').onclick = function(){ act('save'); };
  $('shareBtn').onclick = function(){ act('share'); };
  $('rSave').onclick = function(){saveBlob(made.blob)};
  $('rShare').onclick = function(){shareBlob(made.blob)};
  $('rClose').onclick = function(){closeModal($('ready'));clearResult()};
  var resultURL = '';
  function clearResult(){[].forEach.call($('rprev').querySelectorAll('video'),releaseVideo); $('rprev').innerHTML = ''; if (resultURL) { URL.revokeObjectURL(resultURL); resultURL = ''; } }
  function showResult(b){
    clearResult(); resultURL = URL.createObjectURL(b);
    var el;
    if (/^video\//.test(b.type)) { el = document.createElement('video'); el.src = resultURL; el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.controls = true; }
    else { el = document.createElement('img'); el.src = resultURL; el.alt = '만든 결과'; }
    $('rprev').appendChild(el);
    var meta=made.meta||lastExportMeta,mb=b.size/1024/1024;$('resultMeta').textContent=ext(b).toUpperCase()+' · '+(mb<1?Math.ceil(b.size/1024)+'KB':mb.toFixed(1)+'MB')+(meta.seconds?' · '+meta.seconds.toFixed(1)+'초':'')+(S.clip&&/^video\//.test(b.type)?meta.audio?' · 소리 포함':' · 소리 없음':'');
    $('resultHint').textContent=ext(b)==='gif'?'GIF는 소리 없이 반복돼요. 인스타그램에 올리려면 영상으로 만들어 주세요.':'공유하기를 누르면 기기 공유창이 열려요. 표시되는 앱과 저장 위치는 휴대폰에 따라 달라요.';
    if (el.play) el.play().catch(function(){});
  }

  [].forEach.call(document.querySelectorAll('[data-fb]'), function(a){ a.addEventListener('click', function(){ track('frame_feedback', {place: a.dataset.fb}); }); });

  // 고마움 전하기 모드: 보낸 분께 보낼 사진 — 문구·틀·버튼 이름을 맞춘다
  if (Q.mode === 'thanks') {
    if (!Q.tpl) S.tpl = 'polaroid';
    $('txt').value = '보내 준 꽃, 잘 받았어요. 고마워요'; $('cnt').textContent = $('txt').value.length + '/60 · 20자 안팎이 가장 예뻐요';
    document.querySelector('#s1 h1').innerHTML = '보내 주신 분께<br>고맙다고 전해 보세요';
    document.querySelector('#s1 .eyebrow').textContent = '꽃을 받은 사진으로';
    document.querySelector('#s1 .lead').textContent = '받은 꽃 사진에 고마운 마음을 한 줄 담아, 카톡으로 바로 보낼 수 있어요.';

    S.phraseGroup = 'reply';
  }
  // 선물하신 분 모드: 건넨 순간(받는 분 반응) 사진 — 보내는 사람의 말인 '카드 문구'부터
  if (Q.mode === 'giver') {
    if($('guideLink')){$('guideLink').textContent='선물하실 분 안내서 ›';$('guideLink').href='/hello/?to=giver';}
    $('txt').value = '오늘, 마음을 전했어요'; $('cnt').textContent = $('txt').value.length + '/60 · 20자 안팎이 가장 예뻐요';
    document.querySelector('#s1 h1').innerHTML = '건넨 순간을<br>예쁘게 남겨 보세요';
    document.querySelector('#s1 .eyebrow').textContent = '선물하신 날의 사진으로';
    document.querySelector('#s1 .lead').textContent = '받는 분의 표정과 꽃을 담은 사진을 고르면 틀 15가지가 입혀져요. 여러 장이면 움직이는 영상으로도 만들 수 있어요.';
    S.phraseGroup = 'gave';
  }
  if (Q.kind && /^(photo|gif|square)$/.test(Q.kind)) setTimeout(function(){setKind(Q.kind)},0);
  capabilityPromise=(async function(){
    var codec='',audio=false;try{var result=await bounded(Promise.all([webcodecsCodec(),aacOK()]),8000);codec=result[0];audio=result[1]}catch(e){}
    capability={settled:true,video:!!(codec||VIDEO_MIME),audio:audio};$('kVideo').disabled=!capability.video;$('kVideo').classList.toggle('hidden',!capability.video);$('vtClipBtn').disabled=!capability.video;$('vsClip').disabled=!capability.video;$('vsClip').textContent='이 구간 넣기';
    if(Q.kind==='video'&&capability.video)setKind('video');track('frame_capability',{status:capability.video?'ready':'unavailable'});return capability;
  })();

  function safeFrameURL(){
    var u=new URL(location.origin+location.pathname);if(allowed(Q.mode,MODES))u.searchParams.set('mode',Q.mode);if(allowed(Q.from,SOURCES))u.searchParams.set('from',Q.from);
    if(TechaFrame.templates.concat(TechaFrame.squares).some(function(t){return t.id===S.tpl}))u.searchParams.set('tpl',S.tpl);
    if(/^(photo|video|gif|square)$/.test(S.kind))u.searchParams.set('kind',S.kind);
    return u.href;
  }
  async function copyFrameURL(){
    var value=safeFrameURL();try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{var input=document.createElement('textarea');input.value=value;input.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px';document.body.appendChild(input);input.select();var copied=document.execCommand('copy');input.remove();if(!copied)throw mediaError('unsupported')}toast('주소를 복사했어요. 다른 브라우저 주소창에 붙여 넣어 주세요')}
    catch(e){dialog('주소를 복사하지 못했어요','브라우저 메뉴에서 이 페이지 주소를 복사해 주세요.')}
  }

  // 카톡·네이버·인스타 앱 안에서 열리면 저장·공유가 막히는 일이 많다 → 바깥 브라우저로 안내
  (function(){
    var ua = navigator.userAgent || '', box = $('inapp');
    var kakao = /KAKAOTALK/i.test(ua), naver = /NAVER\(inapp|NAVER/i.test(ua), insta = /Instagram/i.test(ua), fb = /FBAN|FBAV/i.test(ua), band = /BAND\//i.test(ua), line = /Line\//i.test(ua);
    if (!(kakao || naver || insta || fb || band || line)) return;
    appContext=kakao?'kakao':naver?'naver':insta?'instagram':fb?'facebook':band?'band':'line';
    var ios = /iPhone|iPad|iPod/i.test(ua);
    if (kakao) {
      box.innerHTML = '사진을 고르기 전에 다른 브라우저로 열면 저장·공유할 때 더 편해요. 브라우저를 옮기면 사진을 다시 골라야 할 수 있어요.<br><button type="button" id="openExt">다른 브라우저로 열기</button>';
      box.classList.remove('hidden');
      $('openExt').onclick = function(){function open(){location.href='kakaotalk://web/openExternal?url='+encodeURIComponent(safeFrameURL())}if(S.photos.length)dialog('다른 브라우저에서 열까요?','지금 고른 사진과 편집한 내용은 함께 옮겨지지 않아요. 사진을 다시 골라야 해요.',open);else open()};
    } else {
      box.innerHTML = '사진을 고르기 전에 앱 메뉴에서 <b>다른 브라우저로 열기</b>를 고르면 저장·공유할 때 더 편해요. 브라우저를 옮기면 사진을 다시 골라야 할 수 있어요.';
      box.classList.remove('hidden');
    }
    var copy=btn('주소 복사','',copyFrameURL);copy.id='copyFrameURL';box.appendChild(copy);track('frame_inapp',{});
  })();

  track('frame_view',{});

  /* ---------- 휴대폰 뒤로가기: 열린 창부터 닫고, 편집 중에는 한 번 더 눌러야 나간다 ---------- */
  (function(){
    var armed = 0;
    function overlays(){ return ['vsheet','ready'].filter(function(id){ return !$(id).classList.contains('hidden'); }); }
    function guard(){ try { history.pushState({frame: 1}, ''); } catch (e) {} }
    // 편집 화면에 들어가면 뒤로가기 한 번을 붙잡을 자리를 만든다
    var mo = new MutationObserver(function(){ if (document.body.classList.contains('editing') && !guard.done) { guard.done = true; guard(); } });
    mo.observe(document.body, {attributes: true, attributeFilter: ['class']});
    window.addEventListener('popstate', function(){
      var open = overlays();
      if(job){job.cancel=true;guard();return;}
      if (open.length) { open.forEach(function(id){ if (id === 'vsheet') $('vsClose').click(); if (id === 'ready') $('rClose').click(); }); guard(); return; }
      if (!document.body.classList.contains('editing')) return;
      if (Date.now() - armed < 2500) { history.back(); return; }
      armed = Date.now(); toast('한 번 더 누르면 나가요. 만들던 사진은 저장되지 않아요'); guard();
    });
  })();

  // 화면 확인용 (사진은 어디로도 보내지 않는다)
  window.__techaFrame = { setTpl: function(id){ S.tpl = id; draw(); }, setKind: setKind, make: make, mime: VIDEO_MIME, codec: webcodecsCodec, setText: function(t){ $('txt').value = t; draw(); }, openVideoFile: async function(u){ var b = await (await fetch(u)).blob(); return openVideo(new File([b], 'test.mp4', {type: 'video/mp4'})); }, setCaps: function(a){ fill('txt', a[0] || ''); fill('cap2', a[1] || ''); fill('cap3', a[2] || ''); } };

  Promise.all([TechaFrame.loadFonts(), loadImg('/assets/icons/techa-wordmark.png')]).then(function(r){ S.logo = r[1]; if(S.photos.length){ buildGrid(); draw(); } });
})();
