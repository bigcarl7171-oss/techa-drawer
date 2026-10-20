(function () {
  var MAX_FIXED = 5, MIN_GAMES = 1, MAX_GAMES = 10;
  var LETTERS = "ABCDEFGHIJ";
  var fixed = [], excluded = [], selectionMode = "fixed";
  var engine = window.TechaLottoEngine;
  var currentStamp = "", currentRound = null, saved = [], deleted = null;
  var games = 5;
  var rows = [];       // { main:[6], locked:bool } — 아직 안 뽑은 줄은 main 이 null
  var $ = function (id) { return document.getElementById(id); };
  var results = $("results"), copyBtn = $("copy"), drawBtn = $("draw");



  // ---------- 그리기 ----------
  function colorClass(n) { return n <= 10 ? "y" : n <= 20 ? "b" : n <= 30 ? "r" : n <= 40 ? "" : "g"; }
  function ball(n, extra, delay) {
    var cls = "ball " + colorClass(n) + (extra || "") + (delay != null ? " in" : "");
    var st = delay != null ? ' style="--dl:' + delay + 'ms"' : "";
    return '<span class="' + cls + '"' + st + '>' + n + '</span>';
  }
  var ICON = {
    redo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    unlock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.9"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'
  };

  // animate: 애니메이션할 줄 번호 배열
  function render(animate) {
    animate = animate || [];
    var html = "", order = 0;
    rows.forEach(function (r, i) {
      var L = LETTERS[i], drawn = !!r.main, anim = animate.indexOf(i) !== -1;
      var base = anim ? order++ * 90 : 0;
      var balls = "";
      for (var k = 0; k < 6; k++) balls += drawn ? ball(r.main[k], "", anim ? base + k * 45 : null) : '<span class="ball empty"></span>';

      var st = "";
      if (drawn) {
        var sum = 0, odd = 0;
        r.main.forEach(function (x) { sum += x; if (x % 2) odd++; });
        st = "합 " + sum + " · 홀" + odd + " 짝" + (6 - odd);
      }
      var dis = drawn ? "" : " disabled";
      html += '<div class="game' + (r.locked ? " locked" : "") + '" data-i="' + i + '">' +
        '<div class="game-top"><span class="lb">' + L + '</span><span class="st">' + st + '</span>' +
        '<span class="acts">' +
          '<button type="button" data-act="redo" aria-label="' + L + '줄 다시 뽑기" title="이 줄만 다시 뽑기"' + (drawn && !r.locked ? "" : " disabled") + '>' + ICON.redo + '</button>' +
          '<button type="button" data-act="lock" aria-pressed="' + r.locked + '" aria-label="' + L + '줄 유지" title="이 줄 유지"' + dis + '>' + (r.locked ? ICON.lock : ICON.unlock) + '</button>' +
          '<button type="button" data-act="copy" aria-label="' + L + '줄 복사" title="이 줄 복사"' + dis + '>' + ICON.copy + '</button>' +
        '</span></div>' +
        '<div class="balls" aria-label="' + (drawn ? L + "게임 " + r.main.join(", ") : L + "게임 아직 안 뽑음") + '">' + balls + '</div></div>';
    });
    results.innerHTML = html;

    var any = rows.some(function (r) { return r.main; });
    copyBtn.disabled = !any;
    $("save-ticket").disabled = !any;
    $("export-ticket").disabled = !any;
    persist();
    $("share-text").textContent = allText();
    var locked = rows.filter(function (r) { return r.locked; }).length;
    $("draw-label").textContent = !any ? "번호 뽑기" : locked === rows.length ? "모든 줄을 유지하고 있어요" : locked ? "유지한 줄 빼고 다시 뽑기" : "다시 뽑기";
    drawBtn.disabled = locked === rows.length;
    $("draw-status").textContent = !any ? "번호 뽑기를 눌러 나의 번호표를 채워보세요."
      : locked === rows.length ? "모든 줄을 유지하고 있어요. 자물쇠를 풀면 다시 뽑을 수 있어요."
      : rows.filter(function (r) { return r.main; }).length + "게임 번호 준비 완료" + (locked ? " · " + locked + "줄 유지 중" : " · 마음에 드는 줄을 유지해 보세요.");
  }

  function rowText(r, i) { return LETTERS[i] + ": " + r.main.join(", "); }
  function allText() {
    return rows.map(function (r, i) { return r.main ? rowText(r, i) : null; }).filter(Boolean).join("\n");
  }
  function copy(text, btn, done) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      $("draw-status").textContent = "이 브라우저에서는 복사를 사용할 수 없어요. 번호를 직접 적어 주세요.";
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      var prev = btn.innerHTML; btn.innerHTML = done;
      $("draw-status").textContent = "번호를 복사했어요. 메모장 등에 붙여 넣어 보관하세요.";
      setTimeout(function () { btn.innerHTML = prev; }, 1200);
    }).catch(function () {
      $("draw-status").textContent = "복사하지 못했어요. 브라우저의 복사 권한을 확인해 주세요.";
    });
  }

  // ---------- 게임 수 ----------
  function setGames(n) {
    games = Math.min(MAX_GAMES, Math.max(MIN_GAMES, n));
    $("games").textContent = games;
    $("g-minus").disabled = games <= MIN_GAMES;
    $("g-plus").disabled = games >= MAX_GAMES;
    $("game-presets").querySelectorAll("button[data-games]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(+b.getAttribute("data-games") === games));
    });
    while (rows.length < games) rows.push({ main: null, locked: false });
    rows.length = games;
    render();
  }
  $("g-minus").addEventListener("click", function () { setGames(games - 1); });
  $("g-plus").addEventListener("click", function () { setGames(games + 1); });

  $("game-presets").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-games]");
    if (b) setGames(+b.getAttribute("data-games"));
  });

  // ---------- 고정·제외 번호판 ----------
  var board = $("board"), msg = $("board-msg");
  function renderBoard() {
    var h = "";
    for (var n = 1; n <= 45; n++) {
      var f = fixed.indexOf(n) !== -1, e = excluded.indexOf(n) !== -1;
      h += '<button type="button" data-n="' + n + '" class="' + (f ? "fixed" : e ? "excluded" : "") + '" aria-pressed="' + (f || e) + '" aria-label="' + n + "번" + (f ? ", 포함" : e ? ", 제외" : "") + '">' + n + '</button>';
    }
    board.innerHTML = h;
    $("selected-numbers").innerHTML = fixed.map(function(n){return '<button type="button" data-remove="'+n+'">포함 '+n+' ×</button>';}).concat(excluded.map(function(n){return '<button type="button" data-remove="'+n+'">제외 '+n+' ×</button>';})).join("");
    var parts = [];
    if (fixed.length) parts.push("포함 " + fixed.slice().sort(function (a, b) { return a - b; }).join("·"));
    if (excluded.length) parts.push("제외 " + excluded.length + "개");
    $("board-sum").textContent = parts.length ? parts.join(" / ") : "선택 안 함";
    persist();
  }
  function remove(arr, n) { var i = arr.indexOf(n); if (i !== -1) arr.splice(i, 1); }
  board.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-n]"); if (!b) return;
    var n = +b.getAttribute("data-n");
    msg.textContent = "";
    var selected = selectionMode === "fixed" ? fixed : excluded;
    if (selected.includes(n)) remove(selected, n);
    else if (selectionMode === "fixed" && fixed.length >= 5) msg.textContent = "꼭 넣을 번호는 5개까지 선택할 수 있어요.";
    else if (selectionMode === "excluded" && excluded.length >= 39) msg.textContent = "번호 6개는 남겨 두어야 해요.";
    else { remove(selectionMode === "fixed" ? excluded : fixed, n); selected.push(n); }
    renderBoard();
    var nb = board.querySelector('[data-n="' + n + '"]'); if (nb) nb.focus();
  });
  $("board-reset").addEventListener("click", function () { fixed = []; excluded = []; msg.textContent = ""; renderBoard(); });

  // ---------- 뽑기 ----------
  function stamp() {
    var d = new Date();
    currentStamp = d.toISOString();
    currentRound = Number($("di-round").textContent.replace(/\D/g,"")) || null;
    $("ticket-date").textContent = d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " 발행";
  }
  drawBtn.addEventListener("click", function () {
    var targets = rows.map(function(r,i){return r.locked ? null : i;}).filter(function(i){return i !== null;});
    try {
      var batch = engine.generate(targets.length, fixed, excluded, rows.filter(function(r){return r.locked && r.main;}).map(function(r){return r.main;}));
      targets.forEach(function(i,j){rows[i]=batch[j];}); stamp(); render(targets);
      results.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
    } catch (err) { $("draw-status").textContent = err.message; }
  });
  results.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-act]"); if (!b || b.disabled) return;
    var i = +b.closest(".game").getAttribute("data-i"), r = rows[i], act = b.getAttribute("data-act");
    if (act === "redo") { try { rows[i] = engine.generate(1,fixed,excluded,rows.filter(function(row,j){return j !== i && row.main;}).map(function(row){return row.main;}))[0]; stamp(); render([i]); } catch(err) { $("draw-status").textContent=err.message; } }
    else if (act === "lock") { r.locked = !r.locked; render(); }
    else if (act === "copy") { copy(rowText(r, i), b, ICON.check); return; }
    var again = results.querySelector('.game[data-i="' + i + '"] [data-act="' + act + '"]');
    if (again && !again.disabled) again.focus();
  });
  copyBtn.addEventListener("click", function () { copy(allText(), copyBtn, "복사됨!"); });

  // ---------- 다음 추첨 카운트다운 (한국 시간 기준, 매주 토 20:35) ----------
  var WEEK = 7 * 864e5, FIRST = Date.UTC(2002, 11, 7, 20, 35); // 1회: 2002-12-07
  var DAYS = "일월화수목금토";
  function tickDraw() {
    var t = Date.now() + 9 * 36e5, d = new Date(t); // UTC 게터 = 한국 시간
    var target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 20, 35) + ((6 - d.getUTCDay() + 7) % 7) * 864e5;
    if (target <= t) target += WEEK;
    var round = Math.round((target - FIRST) / WEEK) + 1, td = new Date(target);
    $("di-round").textContent = "제 " + round + "회 추첨";
    $("di-when").textContent = (td.getUTCMonth() + 1) + "월 " + td.getUTCDate() + "일(" + DAYS[td.getUTCDay()] + ") 오후 8:35";
    var left = target - t, m = Math.floor(left / 6e4), h = Math.floor(m / 60), day = Math.floor(h / 24);
    $("di-left").textContent = left <= 35 * 6e4 ? "판매 마감 · 곧 추첨"
      : day ? day + "일 " + (h % 24) + "시간 남음"
      : h ? h + "시간 " + (m % 60) + "분 남음"
      : m + "분 남음";
  }
  tickDraw();
  setInterval(tickDraw, 30000);

  // Browser-local records are validated before use; no user input is inserted as markup.
  var LAST_KEY = "techa.lotto.last.v1", SAVED_KEY = "techa.lotto.saved.v1";
  function notify(text) { $("storage-status").textContent = text; }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function write(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch (_) { notify("브라우저 저장을 사용할 수 없어요. 전체 복사나 이미지 저장으로 보관해 주세요."); return false; } }
  function cleanRows(value, allowEmpty) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 10) return null;
    var keys = new Set();
    var clean = value.map(function(row){
      if (allowEmpty && row && row.main === null) return {main:null,locked:false};
      if (!row || !engine.validNumbers(row.main,6)) return null;
      var nums = row.main.slice().sort(function(a,b){return a-b;}), key = nums.join(",");
      if (keys.has(key)) return null; keys.add(key);
      return {main:nums,locked:row.locked === true};
    });
    return clean.every(Boolean) ? clean : null;
  }
  function displayDate(iso) { var date = new Date(iso); return Number.isFinite(date.getTime()) ? date.toLocaleString("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "날짜 정보 없음"; }
  function persist() {
    if (!rows.length) return;
    write(LAST_KEY,{rows:rows, fixed:fixed, excluded:excluded, stamp:currentStamp,round:currentRound});
  }
  function restore() {
    var last = read(LAST_KEY), clean = last && cleanRows(last.rows,true);
    if (clean) {
      rows=clean; games=rows.length; currentStamp=typeof last.stamp === "string" ? last.stamp : "";
      currentRound=Number.isInteger(last.round) && last.round > 0 ? last.round : null;
      if (engine.validNumbers(last.fixed) && last.fixed.length<=5 && engine.validNumbers(last.excluded) && last.excluded.length<=39 && !last.fixed.some(function(n){return last.excluded.includes(n);})) { fixed=last.fixed; excluded=last.excluded; }
      $("ticket-date").textContent=(currentRound ? "제 "+currentRound+"회 참고 · " : "")+displayDate(currentStamp)+" 생성";
      if (clean.some(function(row){return row.main;})) notify("마지막 번호표를 복원했어요. 계속 보관할 번호표는 번호함에 저장해 주세요.");
    }
    var list=read(SAVED_KEY);
    saved=Array.isArray(list) ? list.filter(function(ticket){return ticket && cleanRows(ticket.rows) && typeof ticket.stamp === "string";}).slice(0,20) : [];
  }
  function renderSaved() {
    $("saved-count").textContent=saved.length;
    $("saved-count-top").textContent=saved.length;
    var host=$("saved-list"); host.replaceChildren();
    if (!saved.length) { var empty=document.createElement("p");empty.textContent="아직 보관한 번호표가 없어요. 번호를 뽑은 뒤 ‘번호함 보관’을 눌러 주세요.";empty.className="hint";host.appendChild(empty); }
    saved.forEach(function(ticket,index){
      var item=document.createElement("div");item.className="saved-entry";
      var time=document.createElement("time");time.textContent=(Number.isInteger(ticket.round) && ticket.round > 0 ? "제 "+ticket.round+"회 참고 · " : "")+displayDate(ticket.stamp)+" · "+ticket.rows.length+"게임";
      var text=document.createElement("p");text.textContent=ticket.rows.map(function(row,i){return LETTERS[i]+"  "+row.main.join(" · ");}).join("\n");
      var actions=document.createElement("div");actions.className="saved-actions";
      [["불러오기",function(){ rows=cleanRows(ticket.rows);games=rows.length;currentStamp=ticket.stamp;currentRound=Number.isInteger(ticket.round) && ticket.round > 0 ? ticket.round : null;setGames(games);$("ticket-date").textContent=(currentRound ? "제 "+currentRound+"회 참고 · " : "")+displayDate(currentStamp)+" 생성";notify("저장한 번호표를 불러왔어요. 포함·제외 설정은 다음 뽑기에 적용됩니다.");results.scrollIntoView({block:"nearest"}); }],
       ["삭제",function(){var next=saved.slice();var removed=next.splice(index,1)[0];if(write(SAVED_KEY,next)){deleted={ticket:removed,index:index};saved=next;renderSaved();$("undo-delete").hidden=false;$("saved-status").textContent="번호표를 삭제했어요. 삭제 취소로 되돌릴 수 있습니다.";$("undo-delete").focus();}}]].forEach(function(entry){var button=document.createElement("button");button.type="button";button.className="btn btn-ghost btn-sm";button.textContent=entry[0];button.setAttribute("aria-label",displayDate(ticket.stamp)+" 번호표 "+entry[0]);button.addEventListener("click",entry[1]);actions.appendChild(button);});
      item.append(time,text,actions);host.appendChild(item);
    });
  }
  $("save-ticket").addEventListener("click",function(){
    var clean=cleanRows(rows.filter(function(row){return row.main;}));if(!clean)return;
    var signature=function(list){return list.map(function(row){return row.main.join(",");}).join(";");};
    if(saved.some(function(ticket){return ticket.round===currentRound && signature(ticket.rows)===signature(clean);})){notify("이미 번호함에 보관한 번호표예요.");return;}
    if(saved.length>=20){notify("번호함에 20개가 있어요. 불필요한 번호표를 삭제한 뒤 보관해 주세요.");return;}
    var next=[{rows:clean,stamp:currentStamp||new Date().toISOString(),round:currentRound}].concat(saved);
    if(write(SAVED_KEY,next)){saved=next;deleted=null;$("undo-delete").hidden=true;renderSaved();notify("번호함에 보관했어요. 같은 브라우저에서 다시 확인할 수 있습니다.");}
  });
  $("undo-delete").addEventListener("click",function(){if(!deleted)return;var next=saved.slice();next.splice(Math.min(deleted.index,next.length),0,deleted.ticket);if(write(SAVED_KEY,next)){saved=next;deleted=null;$("undo-delete").hidden=true;renderSaved();$("saved-status").textContent="삭제한 번호표를 복원했어요.";$("saved-tickets").querySelector("summary").focus();}});
  $("open-saved").addEventListener("click",function(){var panel=$("saved-tickets");panel.open=true;panel.querySelector("summary").focus({preventScroll:true});panel.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});});
  document.querySelectorAll("[data-mode]").forEach(function(button){button.addEventListener("click",function(){selectionMode=button.dataset.mode;document.querySelectorAll("[data-mode]").forEach(function(b){b.setAttribute("aria-pressed",String(b===button));});});});
  $("selected-numbers").addEventListener("click",function(ev){var button=ev.target.closest("[data-remove]");if(!button)return;var n=Number(button.dataset.remove);remove(fixed,n);remove(excluded,n);renderBoard();board.querySelector('[data-n="'+n+'"]').focus();});
  $("export-ticket").addEventListener("click",function(){
    var drawn=rows.filter(function(row){return row.main;});if(!drawn.length)return;
    try {
      var canvas=document.createElement("canvas"), width=1000,height=300+drawn.length*115;canvas.width=width;canvas.height=height;
      var ctx=canvas.getContext("2d");if(!ctx)throw new Error("canvas");
      ctx.fillStyle="#faf5ee";ctx.fillRect(0,0,width,height);ctx.fillStyle="#344f42";ctx.font="bold 36px sans-serif";ctx.fillText("TECHA · 나의 번호표",60,78);
      ctx.fillStyle="#756b5b";ctx.font="22px sans-serif";ctx.fillText((currentRound ? "제 "+currentRound+"회 참고 · " : "")+displayDate(currentStamp)+" · "+drawn.length+"게임",60,120);
      drawn.forEach(function(row,i){var y=195+i*115;ctx.fillStyle="#685534";ctx.font="bold 25px sans-serif";ctx.fillText(LETTERS[i],60,y+9);row.main.forEach(function(n,j){ctx.beginPath();ctx.fillStyle=n<=10?"#d9b652":n<=20?"#5278a0":n<=30?"#b46559":n<=40?"#77736d":"#69835e";ctx.arc(190+j*135,y,44,0,Math.PI*2);ctx.fill();ctx.fillStyle=n<=10?"#3a322b":"white";ctx.font="bold 31px sans-serif";ctx.textAlign="center";ctx.fillText(n,190+j*135,y+11);ctx.textAlign="left";});});
      ctx.fillStyle="#756b5b";ctx.font="20px sans-serif";ctx.fillText("생성한 참고 번호 · 복권 구매 내역이 아닙니다.",60,height-65);ctx.fillText("www.techa.kr/ko/lotto/",60,height-30);
      canvas.toBlob(function(blob){if(!blob){notify("이미지를 만들지 못했어요. 전체 복사를 이용해 주세요.");return;}var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="techa-lotto-"+new Date().toISOString().slice(0,10)+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);notify("번호표 이미지를 만들었어요. 다운로드 목록을 확인해 주세요.");},"image/png");
    } catch(_){notify("이미지 저장을 사용할 수 없어요. 전체 복사를 이용해 주세요.");}
  });
  restore();
  renderBoard();
  setGames(games);
  renderSaved();
})();
