/* 테차 사진 꾸미기 — 틀 15개 (1080×1920 스토리 규격)
 * 모든 처리는 브라우저 캔버스 안에서 끝난다. 사진은 서버로 가지 않는다.
 * 색은 테차 토큰만 쓴다. 로고는 워드마크 PNG 원본을 색만 바꿔 쓴다(글꼴로 흉내 내지 않음).
 */
(function (global) {
  'use strict';

  var W = 1080, H = 1920;

  var C = {
    cream: '#FAF7F1', card: '#FFFDF9', paper: '#F4EEE3', linen: '#EFE6DC', wall: '#E9E1D5',
    ink: '#3A322B', body: '#4A4137', muted: '#857C70', soft: '#A89E8F', hair: '#E7E1D6',
    gold: '#C9A961', goldDeep: '#A88A45', blue: '#6E82A6', amber: '#EFB054', sage: '#A8B89A',
    blush: '#F5D9D3', night: '#14100D'
  };

  var F = {
    serif: "'Gowun Batang', 'Pretendard', serif",
    sans: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    hand: "'Nanum Pen Script', 'Gowun Batang', cursive",
    latin: "'Cormorant Garamond', 'Gowun Batang', serif"
  };

  /* ---------- 공통 도구 ---------- */

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  var noiseCache = {};
  function noise(seed) {
    if (noiseCache[seed]) return noiseCache[seed];
    var n = document.createElement('canvas'); n.width = n.height = 256;
    var x = n.getContext('2d'), d = x.createImageData(256, 256), r = rng(seed);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = Math.floor(r() * 255);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    noiseCache[seed] = n;
    return n;
  }

  var lite = false; // GIF 용: 미세 질감을 빼 파일을 가볍게
  function grain(ctx, x, y, w, h, amount, seed, mode) {
    if (lite) return;
    ctx.save();
    ctx.globalAlpha = amount;
    ctx.globalCompositeOperation = mode || 'overlay';
    ctx.fillStyle = ctx.createPattern(noise(seed || 7), 'repeat');
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function paper(ctx, color, seed, amount) {
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    grain(ctx, 0, 0, W, H, amount == null ? 0.06 : amount, seed || 3, 'multiply');
    var g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(58,50,43,0.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // 사진을 칸에 꽉 채운다(잘라서). adj: {zoom, dx, dy} — dx,dy 는 -1..1
  function cover(ctx, img, x, y, w, h, adj) {
    adj = adj || {};
    var iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height;
    if (!iw || !ih) return;
    var r = w / h, sw, sh;
    if (iw / ih > r) { sh = ih; sw = sh * r; } else { sw = iw; sh = sw / r; }
    var z = Math.max(1, adj.zoom || 1); sw /= z; sh /= z;
    var sx = (iw - sw) / 2 * (1 + (adj.dx || 0)), sy = (ih - sh) / 2 * (1 + (adj.dy || 0));
    sx = Math.max(0, Math.min(iw - sw, sx)); sy = Math.max(0, Math.min(ih - sh, sy));
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  // 밝기(-1..1)·따뜻함(-1..1). 캔버스 filter 대신 혼합 모드를 써서 아이폰 사파리에서도 같은 결과
  function tone(ctx, x, y, w, h, o) {
    var b = o.bright || 0, t = o.warm || 0;
    ctx.save();
    if (b > 0) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,250,240,' + (b * 0.35) + ')'; ctx.fillRect(x, y, w, h); }
    if (b < 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,30,20,' + (-b * 0.35) + ')'; ctx.fillRect(x, y, w, h); }
    if (t > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,150,60,' + (t * 0.45) + ')'; ctx.fillRect(x, y, w, h); }
    if (t < 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(70,120,200,' + (-t * 0.45) + ')'; ctx.fillRect(x, y, w, h); }
    // 색 빼기(0..1): 회색을 '채도' 혼합으로 덮는다 — 1이면 흑백 (사파리에서도 같은 결과)
    if (o.sat > 0) { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Math.min(1, o.sat); ctx.fillStyle = '#808080'; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
    // 빛바램(0..1): 어두운 곳을 살짝 띄워 필름처럼
    if (o.fade > 0) { ctx.globalCompositeOperation = 'lighten'; ctx.fillStyle = 'rgba(70,58,48,' + Math.min(1, o.fade * 2.2) + ')'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }

  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  // 0→1→0 으로 한 바퀴 — 영상·GIF 가 끊김 없이 반복되게
  function loop(t) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * t); }

  // 사진 한 장을 경로(path) 안에 그린다.
  // 움직임(o.anim) 일 때: 사진이 여러 장이면 칸마다 차례로 바뀌고(교차 전환), 모두 천천히 다가간다.
  function photo(ctx, o, i, x, y, w, h, pathFn) {
    var n = o.photos.length;
    ctx.save();
    ctx.beginPath();
    if (pathFn) pathFn(ctx); else ctx.rect(x, y, w, h);
    ctx.clip();
    if (!n) { ctx.fillStyle = C.hair; ctx.fillRect(x, y, w, h); }
    // 사진이거나, 넣은 영상을 재생 중일 때(o.clip)는 칸마다 고정 — 영상 칸은 지금 장면이 그려진다
    else if (!o.anim || o.clip) { var p = o.photos[i % n]; cover(ctx, p.img, x, y, w, h, p.adj); }
    else {
      var zoomK = 1 + 0.07 * loop(o.t);
      if (n === 1) { var q = o.photos[0]; cover(ctx, q.img, x, y, w, h, kb(q.adj, zoomK)); }
      else {
        var seg = o.t * n, k = Math.floor(seg) % n, f = seg - Math.floor(seg);
        var a = o.photos[(i + k) % n], b = o.photos[(i + k + 1) % n];
        cover(ctx, a.img, x, y, w, h, kb(a.adj, zoomK));
        var mix = f < 0.72 ? 0 : ease((f - 0.72) / 0.28);
        if (mix > 0) { ctx.globalAlpha = mix; cover(ctx, b.img, x, y, w, h, kb(b.adj, zoomK)); ctx.globalAlpha = 1; }
      }
    }
    tone(ctx, x, y, w, h, o);
    ctx.restore();
  }
  function kb(adj, k) { adj = adj || {}; return { zoom: (adj.zoom || 1) * k, dx: adj.dx || 0, dy: adj.dy || 0 }; }

  function rr(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function shadow(ctx, blur, oy, alpha, color) {
    ctx.shadowColor = color || 'rgba(40,30,20,' + (alpha == null ? 0.22 : alpha) + ')';
    ctx.shadowBlur = blur; ctx.shadowOffsetY = oy || 0; ctx.shadowOffsetX = 0;
  }
  function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

  function font(ctx, size, family, weight, style) {
    ctx.font = (style || '') + ' ' + (weight || 400) + ' ' + size + 'px ' + family;
  }

  // 글자 사이 간격을 직접 넣어 그린다 (사파리 letterSpacing 미지원 대비)
  function spaced(ctx, s, x, y, ls, align) {
    if (isCap(s)) { ctx.save(); ctx.globalAlpha *= cap.a; var r0 = spacedRaw(ctx, s, x, y + cap.dy, ls, align); ctx.restore(); return r0; }
    return spacedRaw(ctx, s, x, y, ls, align);
  }
  function spacedRaw(ctx, s, x, y, ls, align) {
    var chars = Array.from(s), total = 0, i;
    for (i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? ls : 0);
    var cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    var prev = ctx.textAlign; ctx.textAlign = 'left';
    for (i = 0; i < chars.length; i++) { ctx.fillText(chars[i], cx, y); cx += ctx.measureText(chars[i]).width + ls; }
    ctx.textAlign = prev;
    return total;
  }

  // 폭에 맞게 글자 크기를 줄인다
  function fit(ctx, s, maxW, size, family, weight, style, min) {
    var z = size; min = min || size * 0.55;
    do { font(ctx, z, family, weight, style); if (ctx.measureText(s).width <= maxW) break; z -= 2; } while (z > min);
    return z;
  }

  // 한글은 글자 단위로 줄을 나눈다 (띄어쓰기 우선)
  function wrap(ctx, s, maxW, maxLines) {
    var lines = [], paras = String(s || '').split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(' '), line = '';
      for (var k = 0; k < words.length; k++) {
        var test = line ? line + ' ' + words[k] : words[k];
        if (ctx.measureText(test).width <= maxW) { line = test; continue; }
        if (line) lines.push(line);
        line = words[k];
        while (ctx.measureText(line).width > maxW) {
          var cut = line.length;
          while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxW) cut--;
          lines.push(line.slice(0, cut)); line = line.slice(cut);
        }
      }
      lines.push(line);
    }
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
    }
    return lines;
  }

  // 한 줄에 맞추되(최소 78%까지 줄임), 그래도 길면 두 줄로 나눈다
  function two(ctx, s, maxW, size, family, weight, style) {
    for (var z = size; z > size * 0.78; z -= 2) {
      font(ctx, z, family, weight, style);
      if (ctx.measureText(s).width <= maxW) return { size: z, lines: [s] };
    }
    var z2 = Math.round(size * 0.8); font(ctx, z2, family, weight, style);
    return { size: z2, lines: wrap(ctx, s, maxW, 2) };
  }
  function lines(ctx, L, x, y, lh, family, color, align, weight, style) {
    for (var i = 0; i < L.lines.length; i++) text(ctx, L.lines[i], x, y + i * lh, L.size, family, color, align, weight, style);
  }

  // 영상 문구: 지금 나오는 문구 줄이면 투명도·살짝 올라오는 움직임을 준다
  var cap = null;
  function isCap(s) { return cap && s && cap.text.indexOf(String(s).replace(/…$/, '')) >= 0; }

  function text(ctx, s, x, y, size, family, color, align, weight, style) {
    font(ctx, size, family, weight, style); ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    if (isCap(s)) { ctx.save(); ctx.globalAlpha *= cap.a; ctx.fillText(s, x, y + cap.dy); ctx.restore(); }
    else ctx.fillText(s, x, y);
  }

  /* ---------- 날짜 ---------- */
  var MON = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function dDot(d) { return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate(); }
  function dKo(d) { return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function dMd(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function dEn(d) { return MON[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function dFilm(d) { return "'" + String(d.getFullYear()).slice(2) + ' ' + p2(d.getMonth() + 1) + ' ' + p2(d.getDate()); }
  function dNum(d) { return p2(d.getMonth() + 1) + '.' + p2(d.getDate()); }
  function daysSince(o) {
    var a = new Date(o.received.getFullYear(), o.received.getMonth(), o.received.getDate());
    var b = new Date(o.today.getFullYear(), o.today.getMonth(), o.today.getDate());
    return Math.max(0, Math.round((b - a) / 864e5));
  }

  /* ---------- 테차 표시 (워드마크 원본, 색만 바꿈) ---------- */
  var markCache = {};
  function mark(ctx, o, x, y, w, color, align) {
    if (!o.mark || !o.logo) return;
    var key = color + '|' + w;
    if (!markCache[key]) {
      var lw = o.logo.naturalWidth || o.logo.width, lh = o.logo.naturalHeight || o.logo.height;
      var c = document.createElement('canvas'); c.width = lw; c.height = lh;
      var x2 = c.getContext('2d'); x2.drawImage(o.logo, 0, 0);
      x2.globalCompositeOperation = 'source-in'; x2.fillStyle = color; x2.fillRect(0, 0, lw, lh);
      markCache[key] = c;
    }
    var m = markCache[key], h = w * m.height / m.width;
    var lx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.drawImage(m, lx, y, w, h);
  }

  function from(o, prefix) { return o.from ? (prefix == null ? 'From. ' : prefix) + o.from : ''; }

  /* ---------- 틀 15개 ---------- */
  // 인스타 스토리 안전영역 (브랜드 규칙 §5-5, techa-shorts render.md §3): 위 220 · 아래 430 · 오른쪽 130 · 왼쪽 60
  // → 글자·날짜·로고·도장은 x 60~950, y 220~1490 안에 둔다. 사진·배경·장식선은 밖으로 나가도 된다.
  // 가운데 정렬은 x 540, 글자 폭은 820 이하(오른쪽 끝이 950 안).
  var SAFE = { x0: 60, x1: 950, y0: 220, y1: 1490 }, CX = 540, TW = 820;
  var T = [];

  // 1. 갤러리 액자 — 벽에 건 매트 액자 + 작품 라벨
  T.push({ id: 'gallery', name: '갤러리 액자', photos: 1, draw: function (ctx, o) {
    paper(ctx, C.wall, 11, 0.07);
    var fx = 130, fy = 240, fw = 800, fh = 930;
    ctx.save(); shadow(ctx, 60, 30, 0.28); ctx.fillStyle = '#2F2924'; ctx.fillRect(fx - 20, fy - 20, fw + 40, fh + 40); ctx.restore();
    ctx.fillStyle = '#FBF9F4'; ctx.fillRect(fx, fy, fw, fh);
    grain(ctx, fx, fy, fw, fh, 0.04, 5, 'multiply');
    var px = fx + 80, py = fy + 80, pw = fw - 160, ph = fh - 190;
    ctx.strokeStyle = 'rgba(58,50,43,0.25)'; ctx.lineWidth = 3; ctx.strokeRect(px - 6, py - 6, pw + 12, ph + 12);
    photo(ctx, o, 0, px, py, pw, ph);
    // 작품 라벨 (오른쪽 아래, 안전영역 안)
    var lw = 360, lx = SAFE.x1 - lw, ly = fy + fh + 44;
    var L = two(ctx, o.text, lw - 56, 34, F.serif, 700), ex = (L.lines.length - 1) * 38, lh = 196 + ex + (o.from ? 40 : 0);
    ctx.save(); shadow(ctx, 18, 6, 0.18); ctx.fillStyle = C.card; ctx.fillRect(lx, ly, lw, lh); ctx.restore();
    lines(ctx, L, lx + 28, ly + 58, 38, F.serif, C.ink, 'left', 700);
    text(ctx, '시들지 않는 꽃, ' + o.received.getFullYear(), lx + 28, ly + 104 + ex, 22, F.sans, C.muted);
    text(ctx, dDot(o.received), lx + 28, ly + 140 + ex, 22, F.sans, C.muted);
    if (o.from) text(ctx, from(o), lx + 28, ly + 184 + ex, 24, F.latin, C.body, 'left', 500, 'italic');
    mark(ctx, o, fx, ly + 20, 140, C.ink, 'left');
  }});

  // 2. 박물관 캡션 — 흰 여백, 아래 설명문
  T.push({ id: 'caption', name: '박물관 캡션', photos: 1, draw: function (ctx, o) {
    paper(ctx, '#FBFAF6', 13, 0.035);
    photo(ctx, o, 0, 90, 120, 900, 1020);
    ctx.fillStyle = C.gold; ctx.fillRect(90, 1196, 64, 4);
    font(ctx, 54, F.serif, 700); var ls = wrap(ctx, o.text, 860, 2);
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], 90, 1276 + i * 70, 54, F.serif, C.ink, 'left', 700);
    var yy = 1276 + ls.length * 70 - 6;
    text(ctx, o.from ? o.from + ' 님이 보낸 시들지 않는 꽃' : 'Preserved flowers', 90, yy, 28, o.from ? F.sans : F.latin, C.muted, 'left', 400, o.from ? '' : 'italic');
    text(ctx, dEn(o.received), 90, yy + 40, 24, F.latin, C.soft, 'left', 500);
    mark(ctx, o, SAFE.x1, yy + 6, 120, C.ink, 'right');
  }});

  // 3. 폴라로이드 — 사진 2장 이상이면 두 장 겹침
  T.push({ id: 'polaroid', name: '폴라로이드', photos: 2, draw: function (ctx, o) {
    paper(ctx, C.linen, 17, 0.08);
    var w = 720, h = 890, ph = 660;
    function pol(i, cx, cy, rot, cap) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      shadow(ctx, 40, 18, 0.25); ctx.fillStyle = '#FFFEFB'; ctx.fillRect(-w / 2, -h / 2, w, h); noShadow(ctx);
      grain(ctx, -w / 2, -h / 2, w, h, 0.035, 9, 'multiply');
      photo(ctx, o, i, -w / 2 + 36, -h / 2 + 36, w - 72, ph);
      if (cap) {
        var base = -h / 2 + 36 + ph;
        var L = two(ctx, o.text, w - 90, 66, F.hand);
        if (L.lines.length > 1) { L.size = 48; lines(ctx, L, 0, base + 58, 50, F.hand, C.ink, 'center'); }
        else lines(ctx, L, 0, base + 96, 0, F.hand, C.ink, 'center');
        text(ctx, dDot(o.received) + (o.from ? '  ·  ' + o.from : ''), 0, h / 2 - 30, 36, F.hand, C.muted, 'center');
      }
      ctx.restore();
    }
    if (o.photos.length > 1) { pol(1, 600, 640, 0.07, false); pol(0, 500, 920, -0.045, true); }
    else pol(0, CX, 800, -0.03, true);
    mark(ctx, o, CX, 1412, 120, C.ink, 'center');
  }});

  // 4. 매거진 커버 — 꽉 찬 사진 + 제호 + 표지 문구
  T.push({ id: 'magazine', name: '매거진 커버', photos: 1, draw: function (ctx, o) {
    photo(ctx, o, 0, 0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, 'rgba(20,16,13,0.58)'); g.addColorStop(1, 'rgba(20,16,13,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 640);
    var g2 = ctx.createLinearGradient(0, 860, 0, H); g2.addColorStop(0, 'rgba(20,16,13,0)'); g2.addColorStop(0.55, 'rgba(20,16,13,0.62)'); g2.addColorStop(1, 'rgba(20,16,13,0.75)');
    ctx.fillStyle = g2; ctx.fillRect(0, 860, W, H - 860);
    ctx.fillStyle = C.cream; font(ctx, 178, F.latin, 600);
    ctx.textAlign = 'center'; ctx.fillText('Bloom', CX, 400);
    font(ctx, 22, F.sans, 600); spaced(ctx, 'ISSUE  ' + dNum(o.received) + '  ·  ' + o.received.getFullYear(), CX, 452, 6, 'center');
    font(ctx, 72, F.serif, 700); var ls = wrap(ctx, o.text, TW, 2);
    var top = 1300 - (ls.length - 1) * 90 - (o.from ? 50 : 0);
    ctx.fillStyle = C.amber; ctx.fillRect(SAFE.x0 + 30, top - 150, 56, 4);
    font(ctx, 28, F.sans, 600); ctx.fillStyle = C.cream; spaced(ctx, '오늘의 꽃', SAFE.x0 + 30, top - 98, 4, 'left');
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], SAFE.x0 + 30, top + i * 90, 72, F.serif, C.cream, 'left', 700);
    if (o.from) text(ctx, from(o, '— '), SAFE.x0 + 30, top + ls.length * 90 - 10, 32, F.latin, 'rgba(250,247,241,0.85)', 'left', 500, 'italic');
    mark(ctx, o, SAFE.x1, 1440, 110, C.cream, 'right');
  }});

  // 5. 필름 — 세로 필름 띠에 사진 3장 + 주황 날짜 각인
  T.push({ id: 'film', name: '필름 프레임', photos: 3, draw: function (ctx, o) {
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    grain(ctx, 0, 0, W, H, 0.10, 21, 'screen');
    var sx = 150, sw = 780, fx = 230, fw = 620, fh = 350, gap = 26, y0 = 210, sy = 160, sh = 3 * fh + 2 * gap + 110;
    ctx.fillStyle = '#231C17'; ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = C.night;
    for (var yy = sy + 18; yy < sy + sh - 24; yy += 52) { ctx.beginPath(); rr(ctx, sx + 20, yy, 30, 22, 5); rr(ctx, sx + sw - 50, yy, 30, 22, 5); ctx.fill(); }
    for (var i = 0; i < 3; i++) {
      var y = y0 + i * (fh + gap);
      photo(ctx, o, i, fx, y, fw, fh);
      font(ctx, 15, F.sans, 700); ctx.fillStyle = 'rgba(239,176,84,0.75)'; spaced(ctx, (12 + i * 2) + '  ▸  ' + (12 + i * 2) + 'A', fx, y + fh + 18, 2, 'left');
    }
    var ly = y0 + 2 * (fh + gap) + fh - 30;
    ctx.save(); font(ctx, 40, "'Courier New', monospace", 700); ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(255,120,40,0.9)'; ctx.shadowBlur = 12; ctx.fillStyle = '#FF9A3C';
    ctx.fillText(dFilm(o.received), fx + fw - 24, ly); ctx.restore();
    var railY = y0 + 3 * fh + 2 * gap + 18;
    font(ctx, 15, F.sans, 700); ctx.fillStyle = 'rgba(239,176,84,0.6)'; spaced(ctx, 'FLOWER 400' + (o.from ? '  ·  FROM ' + o.from : ''), fx + fw, railY, 4, 'right');
    var L = two(ctx, o.text, 560, 46, F.serif, 700), two_ = L.lines.length > 1;
    if (two_) L.size = 38;
    lines(ctx, L, sx + 10, two_ ? 1406 : 1440, 48, F.serif, C.cream, 'left', 700);
    mark(ctx, o, SAFE.x1 - 20, 1410, 96, C.cream, 'right');
  }});

  // 6. 엽서 — 위는 사진, 아래는 엽서 뒷면(글·주소·우표·소인)
  T.push({ id: 'postcard', name: '엽서', photos: 1, draw: function (ctx, o) {
    paper(ctx, '#E6DDCF', 23, 0.08);
    ctx.save(); ctx.translate(CX, 860); ctx.rotate(-0.02);
    var w = 860, h = 1230, x = -w / 2, y = -h / 2;
    shadow(ctx, 50, 24, 0.25); ctx.fillStyle = '#FBF7EF'; ctx.fillRect(x, y, w, h); noShadow(ctx);
    grain(ctx, x, y, w, h, 0.05, 25, 'multiply');
    photo(ctx, o, 0, x + 32, y + 32, w - 64, 590);
    var by = y + 650;
    font(ctx, 20, F.sans, 700); ctx.fillStyle = C.muted; spaced(ctx, 'POST CARD', x + 44, by + 26, 10, 'left');
    ctx.strokeStyle = 'rgba(58,50,43,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w / 2 + 10, by + 60); ctx.lineTo(x + w / 2 + 10, y + h - 40); ctx.stroke();
    font(ctx, 50, F.hand); var ls = wrap(ctx, o.text, w / 2 - 80, 5);
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], x + 44, by + 116 + i * 60, 50, F.hand, C.ink);
    if (o.from) text(ctx, from(o), x + 44, y + h - 50, 40, F.hand, C.body);
    for (var k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + w / 2 + 44, by + 330 + k * 80); ctx.lineTo(x + w - 44, by + 330 + k * 80); ctx.stroke(); }
    var tz = fit(ctx, 'To. 오늘 꽃을 받은 당신', w / 2 - 100, 42, F.hand);
    text(ctx, 'To. 오늘 꽃을 받은 당신', x + w / 2 + 48, by + 316, tz, F.hand, C.body);
    var stx = x + w - 200, sty = by + 50, stw = 150, sth = 186;
    ctx.fillStyle = '#FFFDF8'; ctx.fillRect(stx, sty, stw, sth);
    ctx.fillStyle = '#FBF7EF';
    for (var a = 0; a <= stw; a += 15) { ctx.beginPath(); ctx.arc(stx + a, sty, 5, 0, 7); ctx.arc(stx + a, sty + sth, 5, 0, 7); ctx.fill(); }
    for (var b = 0; b <= sth; b += 15.5) { ctx.beginPath(); ctx.arc(stx, sty + b, 5, 0, 7); ctx.arc(stx + stw, sty + b, 5, 0, 7); ctx.fill(); }
    photo(ctx, o, 0, stx + 14, sty + 14, stw - 28, sth - 28);
    ctx.save(); ctx.translate(stx - 6, sty + sth - 18); ctx.rotate(-0.2);
    ctx.strokeStyle = 'rgba(110,130,166,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 82, 0, 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 68, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(110,130,166,0.85)'; font(ctx, 22, F.sans, 700); ctx.textAlign = 'center'; ctx.fillText(dDot(o.received), 0, 8);
    font(ctx, 14, F.sans, 700); spaced(ctx, 'FLOWER POST', 0, -28, 3, 'center'); ctx.restore();
    mark(ctx, o, x + w - 44, y + h - 76, 100, C.ink, 'right');
    ctx.restore();
  }});

  // 7. 네 컷 — 포토부스 세로 띠에 사진 4장 (2026-10-18 크롤링: 8년째 이어지는 한국식 형식)
  T.push({ id: 'fourcut', name: '네 컷', photos: 4, draw: function (ctx, o) {
    paper(ctx, '#EDE4DA', 29, 0.07);
    var sw = 640, ph = 268, gap = 12, top = 28, cap = 170, sh = top + 4 * ph + 3 * gap + cap;
    var sy = 196;
    ctx.save(); ctx.translate(CX, sy + sh / 2); ctx.rotate(-0.018);
    var x = -sw / 2, y = -sh / 2;
    shadow(ctx, 50, 22, 0.26); ctx.fillStyle = '#FFFDF8'; ctx.fillRect(x, y, sw, sh); noShadow(ctx);
    grain(ctx, x, y, sw, sh, 0.04, 31, 'multiply');
    for (var i = 0; i < 4; i++) photo(ctx, o, i, x + 28, y + top + i * (ph + gap), sw - 56, ph);
    var cy = y + top + 4 * ph + 3 * gap;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 28, cy + 20); ctx.lineTo(x + sw - 28, cy + 20); ctx.stroke();
    var L = two(ctx, o.text, sw - 80, 54, F.hand);
    if (L.lines.length > 1) { L.size = 40; lines(ctx, L, 0, cy + 62, 40, F.hand, C.ink, 'center'); }
    else lines(ctx, L, 0, cy + 80, 0, F.hand, C.ink, 'center');
    text(ctx, dDot(o.received) + (o.from ? '  ·  ' + o.from : ''), x + 28, cy + 136, 22, F.sans, C.muted, 'left', 500);
    mark(ctx, o, x + sw - 28, cy + 114, 86, C.ink, 'right');
    ctx.restore();
  }});

  // 8. 아치 창 — 아치 모양 사진 + 가는 금선
  T.push({ id: 'arch', name: '아치 창', photos: 1, draw: function (ctx, o) {
    paper(ctx, '#F1EEE6', 31, 0.05);
    var x = 200, w = 680, y = 250, h = 960, r = w / 2;
    function arch(c, off) { c.moveTo(x - off, y + h + off); c.lineTo(x - off, y + r); c.arc(x + r, y + r, r + off, Math.PI, 0); c.lineTo(x + w + off, y + h + off); c.closePath(); }
    ctx.save(); shadow(ctx, 50, 20, 0.2); ctx.fillStyle = '#FFFDF9'; ctx.beginPath(); arch(ctx, 0); ctx.fill(); ctx.restore();
    photo(ctx, o, 0, x, y, w, h, function (c) { c.beginPath(); arch(c, 0); });
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); arch(ctx, 20); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); arch(ctx, 31); ctx.stroke();
    var L = two(ctx, o.text, TW, 56, F.serif, 700);
    lines(ctx, L, CX, 1316 - (L.lines.length - 1) * 62, 62, F.serif, C.ink, 'center', 700);
    text(ctx, dEn(o.received) + (o.from ? '  ·  ' + from(o) : ''), CX, 1372, 28, F.latin, C.muted, 'center', 500, 'italic');
    mark(ctx, o, CX, 1414, 110, C.ink, 'center');
  }});

  // 9. 골드 라인 — 꽉 찬 사진 + 이중 금선 + 모서리 장식
  T.push({ id: 'goldline', name: '골드 라인', photos: 1, draw: function (ctx, o) {
    photo(ctx, o, 0, 0, 0, W, H);
    var g0 = ctx.createLinearGradient(0, 0, 0, 420); g0.addColorStop(0, 'rgba(20,16,13,0.45)'); g0.addColorStop(1, 'rgba(20,16,13,0)');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, 420);
    var g = ctx.createLinearGradient(0, 900, 0, H); g.addColorStop(0, 'rgba(20,16,13,0)'); g.addColorStop(0.5, 'rgba(20,16,13,0.62)'); g.addColorStop(1, 'rgba(20,16,13,0.72)');
    ctx.fillStyle = g; ctx.fillRect(0, 900, W, H - 900);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.lineWidth = 1.5; ctx.strokeRect(62, 62, W - 124, H - 124);
    ctx.fillStyle = C.gold;
    [[54, 54], [W - 54, 54], [54, H - 54], [W - 54, H - 54]].forEach(function (p) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore(); });
    var L = two(ctx, o.text, TW, 64, F.serif, 700);
    var ty = 1392 - (L.lines.length - 1) * 70;
    ctx.fillStyle = C.gold; ctx.fillRect(CX - 40, ty - 90, 80, 2);
    lines(ctx, L, CX, ty, 70, F.serif, C.cream, 'center', 700);
    text(ctx, dEn(o.received) + (o.from ? '  ·  ' + from(o) : ''), CX, 1452, 28, F.latin, 'rgba(250,247,241,0.88)', 'center', 500, 'italic');
    mark(ctx, o, CX, 244, 110, C.cream, 'center');
  }});

  // 10. 편지지 — 클립으로 꽂은 사진 + 줄 노트에 손글씨
  T.push({ id: 'letter', name: '편지지', photos: 1, draw: function (ctx, o) {
    paper(ctx, '#FBF6EC', 37, 0.05);
    font(ctx, 58, F.hand); var ls = wrap(ctx, o.text, 740, 4);
    var lh = 80, rows = ls.length + (o.from ? 1 : 0), ty = 1460 - (rows - 1) * lh;
    ctx.strokeStyle = 'rgba(110,130,166,0.22)'; ctx.lineWidth = 2;
    for (var ly = ty + 14; ly < H; ly += lh) { ctx.beginPath(); ctx.moveTo(100, ly); ctx.lineTo(W - 100, ly); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(201,169,97,0.5)'; ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, H); ctx.stroke();
    mark(ctx, o, 180, 246, 100, C.ink, 'left');
    text(ctx, dKo(o.received), 920, 282, 44, F.hand, C.muted, 'right');
    var ph = Math.min(860, ty - 470), pw = Math.min(700, ph * 0.86), cy = 350 + ph / 2 + 10;
    ctx.save(); ctx.translate(CX + 10, cy); ctx.rotate(0.02);
    shadow(ctx, 30, 12, 0.22); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-pw / 2 - 26, -ph / 2 - 26, pw + 52, ph + 52); noShadow(ctx);
    photo(ctx, o, 0, -pw / 2, -ph / 2, pw, ph);
    var kx = -pw / 2 + 90, ky = -ph / 2;
    ctx.strokeStyle = C.goldDeep; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(kx, ky + 50); ctx.lineTo(kx, ky - 80); ctx.arc(kx + 28, ky - 80, 28, Math.PI, 0); ctx.lineTo(kx + 56, ky + 20); ctx.arc(kx + 38, ky + 20, 18, 0, Math.PI); ctx.lineTo(kx + 20, ky - 62); ctx.stroke();
    ctx.restore();
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], 180, ty + i * lh, 58, F.hand, C.ink);
    if (o.from) text(ctx, from(o), 920, ty + ls.length * lh, 50, F.hand, C.body, 'right');
  }});

  // 11. 무드등 밤 — 어둠 속 앰버 빛 번짐
  T.push({ id: 'night', name: '무드등 밤', photos: 1, draw: function (ctx, o) {
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    var pulse = o.anim ? 0.7 + 0.3 * loop(o.t * 2 % 1) : 1;
    var gl = ctx.createRadialGradient(CX, 720, 60, CX, 720, 900); gl.addColorStop(0, 'rgba(239,176,84,' + (0.42 * pulse) + ')'); gl.addColorStop(1, 'rgba(239,176,84,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    grain(ctx, 0, 0, W, H, 0.08, 41, 'screen');
    var x = 170, y = 240, w = 740, h = 960;
    ctx.save(); shadow(ctx, 110, 0, 1, 'rgba(239,176,84,0.55)'); ctx.fillStyle = '#000'; ctx.beginPath(); rr(ctx, x, y, w, h, 28); ctx.fill(); ctx.restore();
    photo(ctx, o, 0, x, y, w, h, function (c) { c.beginPath(); rr(c, x, y, w, h, 28); });
    var v = ctx.createRadialGradient(CX, y + h / 2, h * 0.35, CX, y + h / 2, h * 0.75); v.addColorStop(0, 'rgba(20,16,13,0)'); v.addColorStop(1, 'rgba(20,16,13,0.45)');
    ctx.save(); ctx.beginPath(); rr(ctx, x, y, w, h, 28); ctx.clip(); ctx.fillStyle = v; ctx.fillRect(x, y, w, h); ctx.restore();
    var L = two(ctx, o.text, TW, 56, F.serif, 700);
    lines(ctx, L, CX, 1306 - (L.lines.length - 1) * 62, 62, F.serif, '#FBEFD8', 'center', 700);
    text(ctx, dDot(o.received) + (o.from ? '  ·  ' + from(o) : ''), CX, 1364, 28, F.latin, 'rgba(239,176,84,0.9)', 'center', 500, 'italic');
    mark(ctx, o, CX, 1410, 110, '#FBEFD8', 'center');
  }});

  // 12. 큰 날짜 — 날짜를 크게, 사진은 오른쪽
  T.push({ id: 'bigdate', name: '큰 날짜', photos: 1, draw: function (ctx, o) {
    paper(ctx, C.cream, 43, 0.045);
    photo(ctx, o, 0, 410, 240, 620, 930);
    ctx.save(); font(ctx, 230, F.latin, 500); ctx.fillStyle = C.ink; ctx.textAlign = 'left';
    ctx.fillText(p2(o.received.getMonth() + 1), SAFE.x0 + 6, 420); ctx.fillText(p2(o.received.getDate()), SAFE.x0 + 6, 640); ctx.restore();
    ctx.fillStyle = C.gold; ctx.fillRect(SAFE.x0 + 16, 690, 220, 3);
    ctx.save(); ctx.translate(124, 1150); ctx.rotate(-Math.PI / 2); font(ctx, 28, F.sans, 600); ctx.fillStyle = C.muted; spaced(ctx, String(o.received.getFullYear()) + '  ·  PRESERVED', 0, 0, 10, 'left'); ctx.restore();
    ctx.fillStyle = C.blue; ctx.fillRect(SAFE.x0 + 16, 1236, 64, 4);
    font(ctx, 54, F.serif, 700); var ls = wrap(ctx, o.text, 860, 2);
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], SAFE.x0 + 16, 1316 + i * 70, 54, F.serif, C.ink, 'left', 700);
    if (o.from) text(ctx, from(o), SAFE.x0 + 16, 1316 + ls.length * 70 - 10, 30, F.latin, C.muted, 'left', 500, 'italic');
    mark(ctx, o, SAFE.x1, 1440, 110, C.ink, 'right');
  }});

  // 13. 다이어리 스크랩 — 마스킹테이프로 붙인 사진 2장
  T.push({ id: 'scrap', name: '다이어리 스크랩', photos: 2, draw: function (ctx, o) {
    paper(ctx, '#FAF6EE', 47, 0.05);
    ctx.fillStyle = 'rgba(58,50,43,0.13)';
    for (var gy = 40; gy < H; gy += 44) for (var gx = 40; gx < W; gx += 44) { ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, 7); ctx.fill(); }
    text(ctx, dMd(o.received), 110, 310, 84, F.hand, C.ink);
    if (o.from) text(ctx, from(o), 420, 306, 46, F.hand, C.body);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(110, 336); ctx.quadraticCurveTo(250, 326, 370, 340); ctx.stroke();
    mark(ctx, o, SAFE.x1, 262, 100, C.ink, 'right');
    function snap(i, cx, cy, w, h, rot, tapeColor) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      shadow(ctx, 26, 10, 0.2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-w / 2, -h / 2, w, h); noShadow(ctx);
      photo(ctx, o, i, -w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
      ctx.rotate(-0.08); ctx.fillStyle = tapeColor; ctx.globalAlpha = 0.78; ctx.fillRect(-100, -h / 2 - 30, 200, 60);
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#FFFFFF'; for (var s = -90; s < 100; s += 26) ctx.fillRect(s, -h / 2 - 30, 11, 60);
      ctx.restore();
    }
    if (o.photos.length > 1) { snap(1, 680, 680, 540, 560, 0.06, C.sage); snap(0, 420, 1060, 560, 580, -0.05, C.blush); }
    else snap(0, CX, 840, 760, 860, -0.03, C.blush);
    font(ctx, 64, F.hand); var ls = wrap(ctx, o.text, TW, 2);
    var ty = 1450 - (ls.length - 1) * 74;
    for (var i = 0; i < ls.length; i++) text(ctx, ls[i], 110, ty + i * 74, 64, F.hand, C.ink);
  }});

  // 14. 미니멀 — 위는 꽉 찬 사진, 아래는 아주 작은 한 줄
  T.push({ id: 'minimal', name: '미니멀', photos: 1, draw: function (ctx, o) {
    ctx.fillStyle = '#FCFBF8'; ctx.fillRect(0, 0, W, H);
    photo(ctx, o, 0, 0, 0, W, 1190);
    var L = two(ctx, o.text, TW, 36, F.sans, 500), ex = (L.lines.length - 1) * 44;
    font(ctx, L.size, F.sans, 500); ctx.fillStyle = C.ink;
    for (var i = 0; i < L.lines.length; i++) spaced(ctx, L.lines[i], CX, 1290 + i * 44, 3, 'center');
    font(ctx, 22, F.sans, 500); ctx.fillStyle = C.soft; spaced(ctx, dDot(o.received) + (o.from ? '   ' + from(o) : ''), CX, 1352 + ex, 6, 'center');
    mark(ctx, o, CX, 1404 + Math.min(ex, 40), 92, C.ink, 'center');
  }});

  // 15. 변치 않는 날 — "받은 지 N일" 도장 (한 달 뒤 두 번째 사진용)
  T.push({ id: 'days', name: '변치 않는 날', photos: 1, draw: function (ctx, o) {
    paper(ctx, '#F7EEEA', 53, 0.05);
    mark(ctx, o, 120, 240, 100, C.ink, 'left');
    var x = 120, y = 310, w = 760, h = 820;
    ctx.save(); shadow(ctx, 40, 16, 0.2); ctx.fillStyle = '#FFF'; ctx.beginPath(); rr(ctx, x, y, w, h, 24); ctx.fill(); ctx.restore();
    photo(ctx, o, 0, x, y, w, h, function (c) { c.beginPath(); rr(c, x, y, w, h, 24); });
    var n = daysSince(o);
    // 움직임: 도장이 한 번 쿵 찍힌다 (0.15~0.3 구간), 끝에서 살짝 사라져 반복이 자연스럽게
    var st = 1, sa = 1;
    if (o.anim) {
      if (o.t < 0.15) { st = 0; sa = 0; }
      else if (o.t < 0.3) { var u = (o.t - 0.15) / 0.15; st = 1.6 - 0.6 * ease(u); sa = Math.min(1, u * 2); }
      else if (o.t > 0.94) { sa = 1 - (o.t - 0.94) / 0.06; }
    }
    if (sa > 0) {
      var s = stampImg(n, o);
      ctx.save(); ctx.globalAlpha = sa; ctx.translate(800, y + h - 30); ctx.rotate(-0.16); ctx.scale(st * 0.86, st * 0.86);
      ctx.drawImage(s, -180, -180, 360, 360); ctx.restore();
    }
    var L = two(ctx, o.text, TW, 56, F.serif, 700), ex = (L.lines.length - 1) * 62;
    lines(ctx, L, x, 1330, 62, F.serif, C.ink, 'left', 700);
    text(ctx, dKo(o.received) + '에 받은 꽃' + (o.from ? ' · ' + from(o) : ''), x, 1390 + ex, 28, F.sans, C.muted);
  }});

  /* ---------- 카톡 프사용 정사각 틀 (1080×1080) ----------
   * 카톡 친구 목록은 프로필을 동그라미로 자른다. 글자·로고는 지름 1080 원 안쪽에 둔다
   * (y 위치마다 쓸 수 있는 반폭 = √(540² − (y−540)²)). 영상·GIF 없이 사진만. */
  var SQ = 1080, Q = [];
  function halfW(y) { var d = y - SQ / 2; return Math.max(0, Math.sqrt(SQ * SQ / 4 - d * d)); }

  // 1. 꽉 찬 사진 — 아래에 작은 글귀와 날짜
  Q.push({ id: 'sq-full', name: '꽉 찬 사진', photos: 1, draw: function (ctx, o) {
    photo(ctx, o, 0, 0, 0, SQ, SQ);
    var g = ctx.createLinearGradient(0, 620, 0, SQ); g.addColorStop(0, 'rgba(20,16,13,0)'); g.addColorStop(1, 'rgba(20,16,13,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 620, SQ, SQ - 620);
    var z = fit(ctx, o.text, halfW(870) * 2 - 120, 46, F.serif, 700);
    text(ctx, o.text, SQ / 2, 870, z, F.serif, C.cream, 'center', 700);
    text(ctx, dDot(o.received) + (o.from ? '  ·  ' + from(o) : ''), SQ / 2, 924, 26, F.latin, 'rgba(250,247,241,0.88)', 'center', 500, 'italic');
    mark(ctx, o, SQ / 2, 950, 76, C.cream, 'center');
  }});

  // 2. 크림 여백 — 사진 아래 한 줄
  Q.push({ id: 'sq-mat', name: '크림 여백', photos: 1, draw: function (ctx, o) {
    ctx.fillStyle = '#F6F0E6'; ctx.fillRect(0, 0, SQ, SQ); grain(ctx, 0, 0, SQ, SQ, 0.05, 61, 'multiply');
    var x = 120, y = 90, w = 840, h = 740;
    ctx.save(); shadow(ctx, 30, 12, 0.18); ctx.fillStyle = '#fff'; ctx.beginPath(); rr(ctx, x, y, w, h, 22); ctx.fill(); ctx.restore();
    photo(ctx, o, 0, x, y, w, h, function (c) { c.beginPath(); rr(c, x, y, w, h, 22); });
    var z = fit(ctx, o.text, halfW(900) * 2 - 120, 42, F.serif, 700);
    text(ctx, o.text, SQ / 2, 900, z, F.serif, C.ink, 'center', 700);
    text(ctx, dDot(o.received), SQ / 2, 946, 24, F.sans, C.muted, 'center', 500);
    mark(ctx, o, SQ / 2, 966, 70, C.ink, 'center');
  }});

  // 3. 금빛 원 — 동그란 사진 + 금선, 글귀만 작게
  Q.push({ id: 'sq-ring', name: '금빛 원', photos: 1, draw: function (ctx, o) {
    ctx.fillStyle = '#F7EEEA'; ctx.fillRect(0, 0, SQ, SQ); grain(ctx, 0, 0, SQ, SQ, 0.05, 63, 'multiply');
    var cx = SQ / 2, cy = 470, r = 380;
    ctx.save(); shadow(ctx, 40, 14, 0.2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.restore();
    photo(ctx, o, 0, cx - r, cy - r, r * 2, r * 2, function (c) { c.beginPath(); c.arc(cx, cy, r, 0, 7); });
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + 18, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r + 28, 0, 7); ctx.stroke();
    var z = fit(ctx, o.text, halfW(940) * 2 - 100, 40, F.serif, 700);
    text(ctx, o.text, cx, 940, z, F.serif, C.ink, 'center', 700);
  }});

  // 도장은 따로 그린 뒤 잉크 번짐(구멍)을 도장에만 낸다 — 아래 사진은 건드리지 않음
  var stampCache = {};
  function stampImg(n, o) {
    var key = n + '|' + dNum(o.received);
    if (stampCache[key]) return stampCache[key];
    var c = document.createElement('canvas'); c.width = c.height = 360;
    var s = c.getContext('2d'); s.translate(180, 180);
    s.fillStyle = 'rgba(251,247,240,0.92)'; s.beginPath(); s.arc(0, 0, 168, 0, 7); s.fill();
    s.strokeStyle = C.blue; s.lineWidth = 6; s.beginPath(); s.arc(0, 0, 150, 0, 7); s.stroke();
    s.lineWidth = 2; s.beginPath(); s.arc(0, 0, 130, 0, 7); s.stroke();
    s.fillStyle = C.blue; s.textAlign = 'center';
    font(s, 26, F.sans, 700); s.fillText(n === 0 ? '꽃이 온 날' : '받은 지', 0, -48);
    font(s, n === 0 ? 70 : 92, F.latin, 600); s.fillText(n === 0 ? dNum(o.received) : n + '일', 0, n === 0 ? 30 : 44);
    font(s, 20, F.sans, 700); spaced(s, '변치 않는 날', 0, 86, 4, 'center');
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'destination-out'; s.globalAlpha = 0.2; s.fillStyle = s.createPattern(noise(57), 'repeat'); s.fillRect(0, 0, 360, 360);
    stampCache[key] = c;
    return c;
  }

  /* ---------- 그리기 진입점 ---------- */
  // opts: {photos:[{img, adj}], text, from, received:Date, today:Date, mark:bool, logo:Image, bright, warm,
  //        anim:bool, t:0..1(움직임 진행)}
  // scale: 1 = 1080×1920. 미리보기·영상은 더 작게 그려 빠르게 한다.
  function render(canvas, id, opts, scale) {
    var t = T.filter(function (x) { return x.id === id; })[0], sq = false;
    if (!t) { t = Q.filter(function (x) { return x.id === id; })[0]; sq = !!t; }
    t = t || T[0];
    var s = scale || 1, cw = Math.round(W * s), ch = Math.round((sq ? SQ : H) * s);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    var ctx = canvas.getContext('2d');
    var o = Object.assign({ text: '오늘, 꽃이 도착했어요', from: '', mark: true, bright: 0, warm: 0, anim: false, t: 0 }, opts);
    o.received = o.received || new Date(); o.today = o.today || new Date();
    o.text = (o.text || '').trim() || '오늘, 꽃이 도착했어요';
    // 영상·GIF: 문구가 2개 이상이면 시간에 따라 하나씩 바뀐다 (나타남 12% · 머묾 · 사라짐 12%)
    cap = null;
    var caps = (o.caps || []).map(function (c) { return String(c || '').trim(); }).filter(Boolean);
    if (o.anim && caps.length > 1) {
      var m = caps.length, seg = (o.t || 0) * m, k = Math.min(m - 1, Math.floor(seg)), f = seg - Math.floor(seg);
      var a = f < 0.12 ? ease(f / 0.12) : f > 0.88 ? 1 - ease((f - 0.88) / 0.12) : 1;
      o.text = caps[k]; cap = { text: caps[k], a: a, dy: f < 0.12 ? (1 - a) * 18 : 0 };
    } else if (caps.length) { o.text = caps[0]; }
    lite = !!o.lite;
    ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clearRect(0, 0, W, H); t.draw(ctx, o); ctx.restore();
    // 검수용: 인스타 안전영역 밖을 붉게 표시 (opts.guide)
    if (o.guide && sq) {
      ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); ctx.fillStyle = 'rgba(220,40,40,0.28)';
      ctx.beginPath(); ctx.rect(0, 0, SQ, SQ); ctx.arc(SQ / 2, SQ / 2, SQ / 2, 0, 7, true); ctx.fill('evenodd'); ctx.restore();
    } else if (o.guide) {
      ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); ctx.fillStyle = 'rgba(220,40,40,0.28)';
      ctx.fillRect(0, 0, W, SAFE.y0); ctx.fillRect(0, SAFE.y1, W, H - SAFE.y1); ctx.fillRect(0, SAFE.y0, SAFE.x0, SAFE.y1 - SAFE.y0); ctx.fillRect(SAFE.x1, SAFE.y0, W - SAFE.x1, SAFE.y1 - SAFE.y0);
      ctx.restore();
    }
    lite = false; cap = null;
    return canvas;
  }

  var FONT_FACES = ["700 40px 'Gowun Batang'", "400 40px 'Gowun Batang'", "400 40px 'Nanum Pen Script'", "500 40px 'Cormorant Garamond'", "italic 500 40px 'Cormorant Garamond'", "600 40px 'Cormorant Garamond'", "500 40px 'Pretendard'", "700 40px 'Pretendard'"];
  // 한글 웹글꼴은 글자 묶음(unicode-range)별로 나뉘어 있어서, 그릴 글자를 미리 불러와야 캔버스에 제 글꼴로 찍힌다.
  // 안 그러면 처음 쓰는 글자가 대체 글꼴로 찍힌다(2026-10-18 실제 사이트에서 발견).
  var FIXED = '가갤거골관꽃날낸네년는늘니님다당도드들등라랩러레로름리매멀무물미박받밤버변보서션스시신아않액어에엽오온요월은을의이인일임자지진짜착창치캡커컷크큰편폴프필했0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,·—-:\'!?…▸ ';
  var loadedText = '', pending = Promise.resolve();
  function loadFonts(extra) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var want = FIXED + (extra || ''), add = '';
    for (var i = 0; i < want.length; i++) { var ch = want.charAt(i); if (loadedText.indexOf(ch) < 0 && add.indexOf(ch) < 0) add += ch; }
    if (!add) return pending; // 이미 부르는 중인 글자는 그 불러오기가 끝날 때까지 기다린다
    loadedText += add;
    pending = Promise.all([pending].concat(FONT_FACES.map(function (f) { return document.fonts.load(f, add).catch(function () {}); })))
      .then(function () { stampCache = {}; });
    return pending;
  }

  // 필터 썸네일: 사진 한 장을 칸에 채우고 보정만 입힌다
  function swatch(canvas, p, t) {
    var ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, o = Object.assign({ bright: 0, warm: 0, sat: 0, fade: 0 }, t);
    ctx.clearRect(0, 0, w, h); cover(ctx, p.img, 0, 0, w, h, p.adj); tone(ctx, 0, 0, w, h, o);
  }

  global.TechaFrame = { swatch: swatch, SAFE: SAFE, W: W, H: H, templates: T.map(function (t) { return { id: t.id, name: t.name, photos: t.photos }; }), squares: Q.map(function (t) { return { id: t.id, name: t.name, photos: t.photos }; }), render: render, loadFonts: loadFonts };
})(window);
