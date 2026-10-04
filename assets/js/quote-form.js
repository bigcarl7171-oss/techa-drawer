/* B2B 견적 폼 — /api/quote 로 보낸다 (worker/index.js → bigcarl@naver.com 메일).
   마크업은 scripts/build-quote-form.js 가 찍는다. JS 가 없어도 폼은 그대로 POST 되고
   Worker 가 /contact/?sent=1 로 돌려보낸다. 이 파일은 그 위에 얹는 개선이다. */
(function () {
  var CONTACT_EMAIL = "bigcarl@naver.com";
  var MESSAGES = {
    agree: "개인정보 수집·이용에 동의해 주셔야 보낼 수 있어요.",
    company: "회사·기관 이름을 적어 주세요.",
    name: "담당자 이름을 적어 주세요.",
    contact: "연락처와 이메일 중 하나는 적어 주세요.",
    email: "이메일 주소 형식을 확인해 주세요.",
    phone: "연락처 형식을 확인해 주세요.",
  };
  var LABELS = { company: "회사·기관", name: "담당자", phone: "연락처", email: "이메일", purpose: "용도",
    date: "행사 날짜", quantity: "수량", budget: "예산", destinations: "배송지 개수", color: "원하는 색상", message: "요청 사항" };

  function mailFallback(form) {
    var lines = Object.keys(LABELS).map(function (k) {
      var el = form.elements[k];
      return LABELS[k] + ": " + (el && el.value ? el.value : "");
    });
    lines.push("메시지 카드: " + (form.elements.card.checked ? "필요" : "-"));
    lines.push("견적서·세금계산서: " + (form.elements.invoice.checked ? "필요" : "-"));
    return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("[테차] 단체 주문 견적 문의") +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function localCheck(form) {
    var f = form.elements;
    if (!f.company.value.trim()) return "company";
    if (!f.name.value.trim()) return "name";
    if (!f.phone.value.trim() && !f.email.value.trim()) return "contact";
    if (f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return "email";
    if (!f.agree.checked) return "agree";
    return "";
  }

  function init(form) {
    var started = Date.now();
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
          say("문의가 접수됐어요. 확인하는 대로 남겨 주신 연락처로 견적을 안내해 드릴게요.", "ok");
          if (window.TECHA && TECHA.track) TECHA.track("quote_submit", { placement: location.pathname });
          return;
        }
        if (MESSAGES[res.error]) { say(MESSAGES[res.error], "error"); return; }
        throw new Error(res.code || res.error || "upstream");
      }).catch(function (err) {
        var code = String((err && err.message) || "network").replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 40) || "network";
        say('지금 접수가 잠시 안 돼요. 적어 주신 내용 그대로 <a href="' + mailFallback(form) +
          '">이메일로 보내기</a>나 <a href="https://talk.naver.com/W4GQDO" target="_blank" rel="noopener">네이버 톡톡</a>으로 문의해 주세요.' +
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
    st.textContent = ok ? "문의가 접수됐어요. 확인하는 대로 견적을 안내해 드릴게요."
      : (MESSAGES[q.get("error")] || "접수가 잠시 안 돼요. 이메일이나 네이버 톡톡으로 문의해 주세요.");
  }
})();
