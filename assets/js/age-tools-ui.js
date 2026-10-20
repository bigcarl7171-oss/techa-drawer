(function () {
  "use strict";
  var examples = document.querySelectorAll(".age-example");
  function clearSelection() {
    examples.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
  }
  function reveal(result) {
    if (!result || !result.textContent.trim() || result.classList.contains("empty")) return;
    result.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  examples.forEach(function (button) {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", function () {
      clearSelection();
      button.setAttribute("aria-pressed", "true");
      reveal(document.getElementById("birth-result") || document.getElementById("result"));
    });
  });
  document.querySelectorAll(".age-tools main input").forEach(function (input) {
    input.addEventListener("input", clearSelection);
  });
  document.querySelectorAll(".age-tools main form").forEach(function (form) {
    form.addEventListener("submit", function () {
      reveal(document.getElementById(form.id === "year-form" ? "year-result" : form.id === "birth-form" ? "birth-result" : "result"));
    });
  });
  document.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      var mode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      document.getElementById("birth-panel").hidden = mode !== "birth";
      document.getElementById("year-panel").hidden = mode !== "year";
    });
  });
  var thisYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Seoul", year: "numeric" }).format(new Date()));
  document.querySelectorAll("[data-year]").forEach(function (button) {
    button.addEventListener("click", function () {
      var input = document.getElementById("celebration-year");
      input.value = thisYear + Number(button.dataset.year);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      document.getElementById("year-form").requestSubmit();
    });
  });
  document.querySelectorAll("[data-reset]").forEach(function (button) {
    button.addEventListener("click", function () {
      clearSelection();
      var mode = button.dataset.reset;
      if (mode === "age") {
        document.getElementById("age-form").reset();
        var result = document.getElementById("result");
        result.className = "result empty";
        result.textContent = "생년월일을 입력하면 나이를 알려드려요.";
        document.getElementById("birth").focus({ preventScroll: true });
      } else {
        var input = document.getElementById(mode === "birth" ? "birth-year" : "celebration-year");
        input.value = mode === "birth" ? "" : thisYear;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        if (mode === "year") document.getElementById("year-form").requestSubmit();
        input.focus({ preventScroll: true });
      }
    });
  });
})();
