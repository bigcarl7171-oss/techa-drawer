(function () {
  var K = window.KoreanLunarCalendar;
  var ZODIAC = { "자":"쥐", "축":"소", "인":"호랑이", "묘":"토끼", "진":"용", "사":"뱀",
                 "오":"말", "미":"양", "신":"원숭이", "유":"닭", "술":"개", "해":"돼지" };
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];

  var btnS = document.getElementById("mode-s2l"), btnL = document.getElementById("mode-l2s");
  var paneS = document.getElementById("pane-s2l"), paneL = document.getElementById("pane-l2s");
  var sdate = document.getElementById("sdate");
  var ly = document.getElementById("ly"), lm = document.getElementById("lm"), ld = document.getElementById("ld");
  var leap = document.getElementById("leap"), leapRow = document.getElementById("leapRow"), leapHint = document.getElementById("leapHint");
  var result = document.getElementById("result"), subs = document.getElementById("subs");
  var gapjaEl = document.getElementById("s-gapja"), dowEl = document.getElementById("s-dow"), zodEl = document.getElementById("s-zodiac");

  var sy=document.getElementById("sy"), sm=document.getElementById("sm"), sd=document.getElementById("sd");
  var help=document.getElementById("date-input-help"), lastSol=null, lastLun=null;
  var mode = "s2l";
  function fillOptions(el,max,suffix) { var old=Number(el.value)||1;el.replaceChildren();for(var i=1;i<=max;i++)el.add(new Option(i+suffix,String(i)));el.value=String(Math.min(old,max));return old>max; }
  function syncSolar() { var y=Number(sy.value),m=Number(sm.value),max=31;if(Number.isInteger(y)&&y>=1000&&y<=2050&&m){var date=new Date(0);date.setUTCFullYear(y,m,0);max=date.getUTCDate();}var clamped=fillOptions(sd,max,"일");sdate.value=String(sy.value).padStart(4,"0")+"-"+String(sm.value).padStart(2,"0")+"-"+String(sd.value).padStart(2,"0");help.textContent=clamped?"선택한 달은 "+max+"일까지여서 마지막 날로 맞췄어요.":"연도는 직접 입력하고, 월·일은 목록에서 고르세요."; }
  function syncLunarDays() { var y=integerValue(ly),m=integerValue(lm),c=new K(),max=30;if(y>=1000&&y<=2050&&m&&!c.setLunarDate(y,m,30,leap.checked&&!leap.disabled))max=29;var clamped=fillOptions(ld,max,"일");help.textContent=clamped?"이 음력 달은 "+max+"일까지여서 마지막 날로 맞췄어요.":"음력 날짜를 선택하고, 윤달인 경우에만 체크해 주세요."; }
  function setSolarFields(sol) { sy.value=sol.year;sm.value=sol.month;syncSolar();sd.value=sol.day;syncSolar(); }
  function updateMoon(sol) { var iso=sol.year+"-"+String(sol.month).padStart(2,"0")+"-"+String(sol.day).padStart(2,"0"),v=TechaMoon.view(iso,document.getElementById("moon-time").value,document.getElementById("moon-city").value);if(!v){document.getElementById("moon-caption").textContent="달 그림 기준 시각을 선택해 주세요.";document.querySelectorAll("[data-moon-light]").forEach(function(el){el.setAttribute("d","");});document.getElementById("moon-inline-caption").textContent="날짜와 시각을 확인해 주세요.";document.getElementById("moon-figure").setAttribute("aria-label","달 그림을 표시할 수 없습니다");document.getElementById("moon-visibility").textContent="시각을 입력하면 달 그림이 갱신돼요.";return;}document.querySelectorAll("[data-moon-light]").forEach(function(el){el.setAttribute("d",v.path);el.setAttribute("transform","rotate("+v.rotation+" 50 50)");});document.getElementById("moon-inline-caption").textContent=v.name+" · 밝은 면 "+Math.round(v.fraction*100)+"%";document.getElementById("moon-inline").setAttribute("aria-label",v.name+", 밝은 면 "+Math.round(v.fraction*100)+"퍼센트");document.getElementById("moon-caption").textContent=v.name+" · 밝은 면 "+Math.round(v.fraction*100)+"%";document.getElementById("moon-figure").setAttribute("aria-label",iso+" "+v.city+" "+v.time+", "+v.name+", 밝은 면 "+Math.round(v.fraction*100)+"퍼센트");document.getElementById("moon-visibility").textContent=iso+" · "+v.city+" "+v.time+" 기준 · "+(v.aboveHorizon?"지평선 위":"지평선 아래 (선택한 시각에는 볼 수 없어요)"); }

  var resultText = "";
  var actions = document.getElementById("lunar-actions");
  var status = document.getElementById("lunar-status");
  function koreaToday() { return new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
  function integerValue(el) { return /^\d+$/.test(el.value) ? Number(el.value) : NaN; }


  function setMode(next,carry) {
    if(carry&&lastSol){if(next==="s2l")setSolarFields(lastSol);else{ly.value=lastLun.year;lm.value=lastLun.month;syncLeap();leap.checked=!!lastLun.intercalation;syncLunarDays();ld.value=lastLun.day;}}

    mode = next;
    var isS = mode === "s2l";
    btnS.setAttribute("aria-pressed", String(isS));
    btnL.setAttribute("aria-pressed", String(!isS));
    paneS.hidden = !isS;
    paneL.hidden = isS;
    calc();
  }
  btnS.addEventListener("click", function () { setMode("s2l",true); });
  btnL.addEventListener("click", function () { setMode("l2s",true); });

  function empty(msg) {
    lastSol=null;lastLun=null;
    document.getElementById("moon-caption").textContent="올바른 날짜를 입력하면 달이 표시돼요.";
    document.querySelectorAll("[data-moon-light]").forEach(function(el){el.setAttribute("d","");});document.getElementById("moon-inline-caption").textContent="날짜와 시각을 확인해 주세요.";document.getElementById("moon-figure").setAttribute("aria-label","달 그림을 표시할 수 없습니다");
    document.getElementById("moon-visibility").textContent="날짜를 확인해 주세요.";
    actions.hidden = true;
    resultText = "";
    status.textContent = "";
    result.className = "result empty";
    result.textContent = msg;
    subs.style.display = "none";
  }

  // 그 해에 윤달이 있는지, 있다면 몇 월인지
  function leapMonthOf(year) {
    for (var m = 1; m <= 12; m++) {
      var c = new K();
      if (c.setLunarDate(year, m, 1, true) && c.getLunarCalendar().intercalation) return m;
    }
    return 0;
  }

  function syncLeap() {
    var y = integerValue(ly);
    if (!y) { leapRow.classList.add("is-off"); leap.disabled = true; leap.checked = false;
      leapHint.textContent = "— 그 해에 윤달이 있을 때만 켤 수 있어요"; return; }
    var lmo = leapMonthOf(y);
    if (!lmo) {
      leapRow.classList.add("is-off"); leap.disabled = true; leap.checked = false;
      leapHint.textContent = "— " + y + "년에는 윤달이 없습니다";
    } else if (integerValue(lm) !== lmo) {
      leapRow.classList.add("is-off"); leap.disabled = true; leap.checked = false;
      leapHint.textContent = "— " + y + "년은 윤" + lmo + "월만 있습니다. 해당 월을 선택하면 켤 수 있어요";
    } else {
      leapRow.classList.remove("is-off"); leap.disabled = false;
      leapHint.textContent = "— " + y + "년은 윤" + lmo + "월이 있습니다";
    }
  }

  function show(sol, lun, gapja) {
    lastSol=sol;lastLun=lun;updateMoon(sol);
    var d = new Date(sol.year, sol.month - 1, sol.day);
    var solText = sol.year + "년 " + sol.month + "월 " + sol.day + "일";
    var lunText = lun.year + "년 " + (lun.intercalation ? "윤" : "") + lun.month + "월 " + lun.day + "일";

    result.className = "result";
    var primary = mode === "s2l" ? lun : sol;
    var primaryLeap = mode === "s2l" && lun.intercalation ? "윤" : "";
    result.innerHTML = '<span class="lunar-result-label">' + (mode === "s2l" ? '음력으로는' : '양력으로는') + '</span>' +
      '<div class="lunar-result-year">' + primary.year + '년</div>' +
      '<div class="lunar-result-day">' + primaryLeap + primary.month + '<small>월</small> ' + primary.day + '<small>일</small></div>' +
      '<div class="lunar-result-source">' + (mode === "s2l" ? '양력 ' + solText : '음력 ' + lunText) + ' 기준</div>';

    gapjaEl.textContent = gapja || "-";
    dowEl.textContent = DOW[d.getDay()] + "요일";
    var branch = gapja ? gapja.charAt(1) : "";
    zodEl.textContent = ZODIAC[branch] ? ZODIAC[branch] + "띠" : "-";
    subs.style.display = "";
    resultText = "양력 " + solText + " ↔ 음력 " + lunText;
    document.getElementById("lunar-dday").href = "/ko/dday/#date=" + sol.year + "-" + String(sol.month).padStart(2,"0") + "-" + String(sol.day).padStart(2,"0");
    document.getElementById("lunar-dday").hidden = sol.year < 1900;
    actions.hidden = false;
    status.textContent = "";
  }

  function calc() {
    if (mode === "s2l") {
      if (!sdate.value) return empty("양력 날짜를 선택해 주세요.");
      var p = sdate.value.split("-");
      var c = new K();
      if (!c.setSolarDate(+p[0], +p[1], +p[2])) return empty("변환할 수 있는 범위를 벗어났습니다 (1000년 2월 13일 ~ 2050년 12월 31일).");
      show(c.getSolarCalendar(), c.getLunarCalendar(), c.getKoreanGapja().year);
    } else {
      var y = integerValue(ly), m = integerValue(lm), d = integerValue(ld);
      if (!y || !m || !d) return empty("음력 연도·월·일을 모두 입력해 주세요.");
      var k = new K();
      if (!k.setLunarDate(y, m, d, leap.checked && !leap.disabled)) {
        return empty(leap.checked
          ? "그 해 윤" + m + "월에는 " + d + "일이 없습니다. 날짜를 확인해 주세요."
          : "음력 " + y + "년 " + m + "월 " + d + "일은 없는 날짜입니다. 작은달은 29일까지입니다.");
      }
      show(k.getSolarCalendar(), k.getLunarCalendar(), k.getKoreanGapja().year);
    }
  }

  [sy,sm,sd].forEach(function(el){el.addEventListener("input",function(){syncSolar();calc();});});
  ld.addEventListener("input", calc);
  lm.addEventListener("input", function () { syncLeap(); syncLunarDays(); calc(); });
  ly.addEventListener("input", function () { syncLeap(); syncLunarDays(); calc(); });
  leap.addEventListener("change", function(){syncLunarDays();calc();});

  document.getElementById("example-today").addEventListener("click", function () { var p=koreaToday().split("-").map(Number);setSolarFields({year:p[0],month:p[1],day:p[2]});setMode("s2l"); });
  document.getElementById("example-seollal").addEventListener("click", function () { ly.value="2028"; lm.value="1"; ld.value="1"; leap.checked=false; syncLeap(); syncLunarDays(); setMode("l2s"); });
  document.getElementById("example-birthday").addEventListener("click", function () { ly.value=koreaToday().slice(0,4); lm.value="8"; ld.value="10"; leap.checked=false; syncLeap(); syncLunarDays(); setMode("l2s"); });
  document.getElementById("copy-lunar").addEventListener("click", async function () { if(!resultText) return; try { await navigator.clipboard.writeText(resultText); status.textContent="변환 결과를 복사했어요."; } catch (_) { status.textContent="브라우저의 복사 권한을 확인해 주세요."; } });
  fillOptions(sm,12,"월");fillOptions(sd,31,"일");fillOptions(lm,12,"월");fillOptions(ld,30,"일");
  var parts=koreaToday().split("-").map(Number);setSolarFields({year:parts[0],month:parts[1],day:parts[2]});
  function moveDay(offset){if(!lastSol)return;var d=new Date(0);d.setUTCFullYear(lastSol.year,lastSol.month-1,lastSol.day);d.setUTCHours(12,0,0,0);d.setUTCDate(d.getUTCDate()+offset);var c=new K();if(!c.setSolarDate(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())){help.textContent="변환 가능한 날짜 범위의 끝입니다.";return;}var solar=c.getSolarCalendar(),lunar=c.getLunarCalendar();if(mode==="s2l")setSolarFields(solar);else{ly.value=lunar.year;lm.value=lunar.month;syncLeap();leap.checked=!!lunar.intercalation;syncLunarDays();ld.value=lunar.day;}calc();}
  document.getElementById("date-prev").onclick=function(){moveDay(-1);};document.getElementById("date-next").onclick=function(){moveDay(1);};document.getElementById("date-today").onclick=function(){document.getElementById("example-today").click();};
  ["moon-city","moon-time"].forEach(function(id){document.getElementById(id).addEventListener("input",function(){if(lastSol)updateMoon(lastSol);});});
  syncLeap();
  calc();
})();
