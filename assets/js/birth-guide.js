/* Shared static renderer and browser interactions for the two birthday guides. */
(function (root) {
  'use strict';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function allNames(entry) { return [entry.name].concat(entry.others || []).join(' · '); }
  function sourceLink(source) { return '<a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.name) + ' ↗</a>'; }
  function paletteMarkup(entry) { return '<ul class="birth-palette" aria-label="꽃 선물에 참고할 색">' + entry.palette.map(function (p) { return '<li><span class="birth-swatch" style="background:' + esc(p.hex) + '" aria-hidden="true"></span>' + esc(p.name) + '</li>'; }).join('') + '</ul><p class="birth-small">꽃 선물에 참고할 색입니다. 꽃과 보석의 실제 색은 다양합니다.</p>'; }
  function productsMarkup(entry, products, kind) {
    return '<section class="birth-section birth-gifts" aria-labelledby="tool-products-title"><p class="birth-label">테차의 꽃 선물</p><h2 id="tool-products-title">' + esc(entry.giftTitle) + '</h2><p>' + esc(entry.giftIntro) + '</p><div class="birth-product-grid">' + entry.products.map(function (id) {
      var p = products[id], image = entry.productImages && entry.productImages[id] || p.image;
      return '<a class="birth-product" data-birth-product="' + esc(id) + '" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(image) + '" alt="' + esc(p.alt) + '" width="640" height="640" loading="lazy"><div><span class="birth-small">' + esc(p.material) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.reason) + '</p><span class="birth-product-link">색상·구성 보기 ↗</span></div></a>';
    }).join('') + '</div><p class="birth-small">테차 상품의 디자인 참고 사진입니다. 소개한 색상은 상품 옵션에서 확인해 주세요. 최종 가격·크기·제작 가능 여부는 스마트스토어에서 안내합니다.</p><a class="birth-text-link" href="/ko/gift-finder/">받는 분과 선물할 상황으로 더 골라보기 →</a></section>';
  }
  function render(entry, context) {
    var kind = context.kind, isFlower = kind === 'flower', photo = context.credits[entry.photo];
    var same = '/ko/birth-' + (isFlower ? 'stone' : 'flower') + '/?month=' + entry.month;
    var image = '/assets/images/birth-guide/' + entry.photo + '.webp';
    return '<section class="birth-result" aria-labelledby="birth-result-title"><figure class="birth-photo"><img src="' + image + '" alt="' + esc(entry.photoLabel) + '" width="' + photo.width + '" height="' + photo.height + '" fetchpriority="high"><figcaption>' + esc(entry.photoLabel) + ' · <a href="' + esc(photo.source) + '" target="_blank" rel="noopener noreferrer">' + esc(photo.author) + ' / ' + esc(photo.license) + '</a></figcaption></figure><div class="birth-result-copy"><p class="birth-label">' + entry.month + '월의 ' + (isFlower ? '탄생화' : '탄생석') + '</p><h2 id="birth-result-title" tabindex="-1">' + esc(entry.name) + '</h2><p class="birth-english" lang="en">' + esc(entry.english) + '</p><p class="birth-meaning">' + (isFlower ? '상징 키워드' : '선물에 담아 볼 마음') + ' · ' + entry.meanings.map(esc).join(' · ') + '</p><p class="birth-intro">' + esc(entry.intro) + '</p>' + (entry.others.length ? '<p class="birth-also"><b>같은 달에 함께 소개되는 ' + (isFlower ? '꽃' : '보석') + '</b><br>' + entry.others.map(esc).join(' · ') + '</p>' : '') + '<a class="birth-cross" data-month-cross href="' + same + '">' + entry.month + '월의 ' + (isFlower ? '탄생석' : '탄생화') + '도 보기<br><span>' + esc(entry.crossName) + ' →</span></a></div></section>' +
    '<div class="birth-actions"><button type="button" data-birth-share>결과 공유하기</button><button type="button" data-birth-save>결과 이미지 저장</button><a href="#birthday-messages">생일 카드 문구 보기 ↓</a></div>' +
    '<section class="birth-section birth-reading" aria-labelledby="birth-story-title"><div><p class="birth-label">조금 더 알아보기</p><h2 id="birth-story-title">' + (isFlower ? '꽃에 담긴 의미와 이야기' : '보석의 색과 이야기') + '</h2><p>' + esc(entry.story) + '</p><p class="birth-small">' + sourceLink({name:entry.sourceName,url:entry.sourceUrl}) + ' · ' + sourceLink(context.sources[isFlower ? 'interflora' : 'ags']) + '</p></div><div><h3>선물하기 전에 알아둘 점</h3><p>' + esc(entry.tip) + '</p>' + paletteMarkup(entry) + '</div></section>' +
    '<section class="birth-section" id="birthday-messages" aria-labelledby="birth-message-title"><p class="birth-label">마음을 전하는 한 줄</p><h2 id="birth-message-title">' + entry.month + '월 생일 카드에 적어 보세요</h2><p class="birth-small">테차가 새로 쓴 예시 문구입니다. 받는 분에 맞게 고쳐 쓰셔도 좋아요.</p><ul class="birth-messages">' + entry.messages.map(function (m, i) { return '<li><div><span class="birth-small">' + esc(m.tone) + '</span><p>' + esc(m.text) + '</p></div><button type="button" data-birth-copy="' + i + '" aria-label="' + esc(m.tone) + ' 문구 복사">복사</button></li>'; }).join('') + '</ul><a class="birth-text-link" href="/message/">더 많은 생일·생신 카드 문구 찾기 →</a></section>' +
    productsMarkup(entry, context.products, kind) +
    '<section class="birth-section birth-next"><h2>생일 선물, 조금 더 살펴볼까요?</h2><a href="' + esc(entry.related[0]) + '">' + (isFlower && entry.month === 10 ? '10월 탄생화가 자료마다 다른 이유' : isFlower && entry.month === 6 ? '장미 색깔과 송이 수에 담긴 뜻' : '꽃다발과 꽃 무드등, 건네는 장면으로 고르기') + ' →</a><a href="' + esc(entry.related[1]) + '">' + (isFlower && [6,10].indexOf(entry.month) !== -1 ? '생일 선물을 건네는 장면으로 고르기' : '프리저브드·비누꽃·실크플라워의 차이') + ' →</a><a href="/care/">선물 받은 시들지 않는 꽃 관리법 →</a></section>';
  }
  var api = {esc:esc, allNames:allNames, render:render, productsMarkup:productsMarkup};
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.TechaBirthGuide = api;
  if (!root.document) return;
  var node = document.getElementById('birth-guide-data');
  if (!node) return;
  var data = JSON.parse(node.textContent), active, changing = false;
  var content = document.getElementById('birth-content'), status = document.getElementById('birth-status');
  function currentMonth() { try { return Number(new Intl.DateTimeFormat('en', {month:'numeric', timeZone:'Asia/Seoul'}).format(new Date())); } catch (_) { return new Date().getMonth() + 1; } }
  function readMonth() { var raw = new URL(location.href).searchParams.get('month'); return /^(?:[1-9]|1[0-2])$/.test(raw || '') ? Number(raw) : currentMonth(); }
  function track(name, params) { if (root.TECHA && root.TECHA.track) root.TECHA.track(name, Object.assign({guide:data.kind, month:active.month}, params || {})); }
  function show(month, updateUrl, announce) {
    active = data.entries.find(function (entry) { return entry.month === month; });
    content.innerHTML = render(active, data);
    document.querySelectorAll('[data-birth-month]').forEach(function (link) { var selected = Number(link.dataset.birthMonth) === month; link.setAttribute('aria-current', selected ? 'true' : 'false'); });
    document.querySelectorAll('[data-guide-switch]').forEach(function (link) { var url = new URL(link.href); url.searchParams.set('month', month); link.href = url.pathname + url.search; });
    if (updateUrl) { var url = new URL(location.href); url.searchParams.set('month', month); history.pushState({month:month}, '', url); }
    if (announce) status.textContent = month + '월 ' + (data.kind === 'flower' ? '탄생화' : '탄생석') + ' 정보를 표시했습니다.';
  }
  async function copy(text, done) {
    try { if (!navigator.clipboard) throw new Error('clipboard unavailable'); await navigator.clipboard.writeText(text); status.textContent = done; return true; }
    catch (_) { var field = document.getElementById('birth-copy-fallback'); field.hidden = false; field.value = text; field.focus(); field.select(); status.textContent = '자동 복사가 어려워 내용을 선택했습니다. 길게 누르거나 Ctrl+C로 복사해 주세요.'; return false; }
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var line = '';
    Array.from(text).forEach(function (char) { if (ctx.measureText(line + char).width > maxWidth && line) { ctx.fillText(line, x, y); line = char; y += lineHeight; } else line += char; });
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }
  function loadImage(src) { return new Promise(function (resolve,reject) { var img = new Image(); img.onload = function () { resolve(img); }; img.onerror = reject; img.src = src; }); }
  async function saveCard(button) {
    if (changing) return;
    changing = true; button.disabled = true; button.textContent = '이미지 준비 중';
    var selected = active;
    try {
      if (document.fonts) await Promise.all([document.fonts.load('700 60px "Gowun Batang"'), document.fonts.load('400 36px Pretendard')]);
      var img = await loadImage('/assets/images/birth-guide/' + selected.photo + '.webp');
      var canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
      var ctx = canvas.getContext('2d'); ctx.fillStyle = '#FAF3EA'; ctx.fillRect(0,0,1080,1350);
      var scale = Math.max(960 / img.width, 560 / img.height), sw = 960 / scale, sh = 560 / scale;
      ctx.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, 60,60,960,560);
      ctx.fillStyle='#3A322B'; ctx.font='400 32px Pretendard';ctx.fillText(selected.month+'월의 '+(data.kind==='flower'?'탄생화':'탄생석'),70,700);
      ctx.font='700 64px "Gowun Batang"'; var y = wrapText(ctx, allNames(selected),70,790,940,86);
      ctx.font='400 35px Pretendard';y=wrapText(ctx,selected.meanings.join(' · '),70,y+35,940,53);
      ctx.fillStyle='#5B5147';ctx.font='400 28px Pretendard';wrapText(ctx,data.kind==='flower'?'자료와 문화에 따라 다른 꽃이 소개될 수 있습니다.':'이야기와 색을 즐기는 생일 선물의 실마리입니다.',70,y+30,940,44);
      ctx.strokeStyle='#C9A961';ctx.beginPath();ctx.moveTo(70,1170);ctx.lineTo(1010,1170);ctx.stroke();
      ctx.fillStyle='#3A322B';ctx.font='700 32px "Gowun Batang"';ctx.fillText('테차 꽃공방',70,1230);ctx.font='400 23px Pretendard';ctx.fillText('techa.kr · 참고: '+(data.kind==='flower'?'Almanac / Interflora':'GIA / AGS'),70,1280);
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve,'image/png'); }); if (!blob) throw new Error('export failed');
      var url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='techa-'+data.kind+'-'+selected.month+'.png';a.click();setTimeout(function(){URL.revokeObjectURL(url);},10000);
      status.textContent='저장용 이미지를 준비했습니다. 브라우저 다운로드 목록에서 확인해 주세요.';track('birth_card_save',{month:selected.month});
    } catch (_) { status.textContent='이미지를 저장하지 못했습니다. 결과 공유하기로 링크를 복사해 주세요.'; }
    finally { changing=false;button.disabled=false;button.textContent='결과 이미지 저장'; }
  }
  document.addEventListener('click', async function (event) {
    var monthLink = event.target.closest('[data-birth-month]');
    if (monthLink) { event.preventDefault(); var fromOverview = Boolean(monthLink.closest('.birth-overview')); show(Number(monthLink.dataset.birthMonth), true, true); if (fromOverview) { document.getElementById('birth-result-title').focus({preventScroll:true}); document.querySelector('.birth-result').scrollIntoView({block:'start'}); } track('birth_month_select'); return; }
    var button = event.target.closest('[data-birth-copy]');
    if (button) { var idx=Number(button.dataset.birthCopy);var copied=await copy(active.messages[idx].text,'문구를 복사했습니다.');if(copied){button.textContent='복사됨';setTimeout(function(){if(button.isConnected)button.textContent='복사';},1800);}track('birth_message_copy',{tone:active.messages[idx].tone});return; }
    var share = event.target.closest('[data-birth-share]');
    if (share) {
      var url='https://www.techa.kr/ko/birth-'+data.kind+'/?month='+active.month, title=active.month+'월 '+(data.kind==='flower'?'탄생화':'탄생석')+' · '+allNames(active);
      if (navigator.share) { try { await navigator.share({title:title,text:title+' | 테차 꽃공방',url:url});track('birth_result_share'); } catch (error) { if (error.name !== 'AbortError') await copy(title+'\n'+url,'결과 링크를 복사했습니다.'); } }
      else { await copy(title+'\n'+url,'선택한 달의 결과 링크를 복사했습니다.');track('birth_result_share'); } return;
    }
    var save = event.target.closest('[data-birth-save]');if(save){saveCard(save);return;}
    var product = event.target.closest('[data-birth-product]');if(product)track('birth_product_click',{product:product.dataset.birthProduct});
  });
  root.addEventListener('popstate',function(){show(readMonth(),false,true);});
  show(readMonth(),false,false);
})(typeof window !== 'undefined' ? window : globalThis);
