/* 문의 양식 — 기업 견적(/api/quote)과 공간 스타일링 상담(/api/space).
   worker/index.js 가 받아 bigcarl@naver.com 으로 메일을 보낸다.
   마크업은 scripts/build-quote-form.js 가 찍는다. JS 가 없어도 양식은 그대로 POST 되고
   Worker 가 원래 페이지(?sent=1)로 돌려보낸다. 이 파일은 그 위에 얹는 개선이다.
   양식 종류는 <form data-kind="space"> 로 가른다 (없으면 기업 견적). 2026-10-05 */
(function () {
  var CONTACT_EMAIL = "bigcarl@naver.com";
  var TALK = "https://talk.naver.com/W4GQDO";
  var MESSAGES = {
    agree: "개인정보 수집·이용에 동의해 주셔야 보낼 수 있어요.",
    company: "회사·기관 이름을 적어 주세요.",
    name: "이름을 적어 주세요.",
    contact: "연락처와 이메일 중 하나는 적어 주세요.",
    email: "이메일 주소 형식을 확인해 주세요.",
    phone: "연락처 형식을 확인해 주세요.",
  };
  var KINDS = {
    quote: {
      required: ["company", "name"],
      subject: "[테차] 단체 주문 견적 문의",
      labels: { company: "회사·기관", name: "담당자", phone: "연락처", email: "이메일", purpose: "용도",
        date: "행사 날짜", quantity: "수량", budget: "예산", destinations: "배송지 개수", color: "원하는 색상", message: "요청 사항" },
      done: "문의가 접수됐어요. 확인하는 대로 남겨 주신 연락처로 견적을 안내해 드릴게요.",
      event: "quote_submit",
    },
    space: {
      required: ["name"],
      subject: "[테차] 공간 스타일링 상담",
      labels: { name: "이름", phone: "연락처", email: "이메일", space: "공간", company: "회사·매장 이름",
        spot: "꽃을 놓을 곳", area: "지역", budget: "예산", delivery: "받는 방법", plan: "교체 계획", message: "요청 사항" },
      done: "상담 신청이 접수됐어요. 꽃을 놓을 곳 사진을 톡톡으로 보내주시면 더 빨리 제안해 드릴 수 있어요. " +
        '<a href="' + TALK + '" target="_blank" rel="noopener">톡톡으로 사진 보내기 ↗</a>',
      event: "space_submit",
    },
  };
  function kindOf(form) { return KINDS[form.getAttribute("data-kind")] || KINDS.quote; }

  function mailFallback(form) {
    var k = kindOf(form);
    var lines = Object.keys(k.labels).map(function (key) {
      var el = form.elements[key];
      return k.labels[key] + ": " + (el && el.value ? el.value : "");
    });
    if (form.elements.card) lines.push("메시지 카드: " + (form.elements.card.checked ? "필요" : "-"));
    if (form.elements.invoice) lines.push("견적서·세금계산서: " + (form.elements.invoice.checked ? "필요" : "-"));
    return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(k.subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function localCheck(form) {
    var f = form.elements, k = kindOf(form);
    for (var i = 0; i < k.required.length; i++) {
      if (!f[k.required[i]].value.trim()) return k.required[i];
    }
    if (!f.phone.value.trim() && !f.email.value.trim()) return "contact";
    if (f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return "email";
    if (!f.agree.checked) return "agree";
    return "";
  }

  function init(form) {
    var started = Date.now();
    var k = kindOf(form);
    var status = form.querySelector(".qf-status");
    var button = form.querySelector(".qf-submit");
    form.elements.page.value = location.pathname;

    function say(html, kind) {
      status.innerHTML = html;
      status.className = "qf-status" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.elements.elapsed_ms.value = String(Date.now() - started);
      var err = localCheck(form);
      if (err) {
        say(MESSAGES[err], "error");
        var target = form.elements[err === "contact" ? "phone" : err];
        if (target && target.focus) target.focus();
        return;
      }
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        data[el.name] = el.type === "checkbox" ? el.checked : el.value;
      });
      button.disabled = true;
      say("보내는 중이에요…", "");
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(function (r) {
        // JSON 이 아니면(예: 접수 API 가 없는 배포) 상태 코드를 원인으로 남긴다
        return r.json().catch(function () { return { ok: false, error: "upstream", code: "http_" + r.status }; });
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          say(k.done, "ok");
          if (window.TECHA && TECHA.track) TECHA.track(k.event, { placement: location.pathname });
          return;
        }
        if (MESSAGES[res.error]) { say(MESSAGES[res.error], "error"); return; }
        throw new Error(res.code || res.error || "upstream");
      }).catch(function (err) {
        var code = String((err && err.message) || "network").replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 40) || "network";
        say('지금 접수가 잠시 안 돼요. 적어 주신 내용 그대로 <a href="' + mailFallback(form) +
          '">이메일로 보내기</a>나 <a href="' + TALK + '" target="_blank" rel="noopener">네이버 톡톡</a>으로 문의해 주세요.' +
          ' <small class="qf-code">(오류 코드: ' + code + ')</small>', "error");
      }).then(function () { button.disabled = false; });
    });
  }

  // JS 없이 보낸 뒤 돌아온 경우
  var q = new URLSearchParams(location.search);
  var forms = document.querySelectorAll(".quote-form");
  Array.prototype.forEach.call(forms, init);
  if (forms.length && (q.has("sent") || q.has("error"))) {
    var st = forms[0].querySelector(".qf-status");
    var ok = q.has("sent");
    st.className = "qf-status " + (ok ? "is-ok" : "is-error");
    if (ok) st.innerHTML = kindOf(forms[0]).done;
    else st.textContent = MESSAGES[q.get("error")] || "접수가 잠시 안 돼요. 이메일이나 네이버 톡톡으로 문의해 주세요.";
  }
})();
