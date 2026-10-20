(function () {
  "use strict";
  var milestones = [
    { name: "환갑", offset: 60, basis: "만 60세" },
    { name: "진갑", offset: 61, basis: "만 61세" },
    { name: "칠순·고희", offset: 69, basis: "세는 나이 70세" },
    { name: "희수", offset: 76, basis: "세는 나이 77세" },
    { name: "팔순", offset: 79, basis: "세는 나이 80세" },
    { name: "미수", offset: 87, basis: "세는 나이 88세" },
    { name: "구순", offset: 89, basis: "세는 나이 90세" }
  ];

  function parseYear(value, min, max) {
    if (!/^\d{4}$/.test(String(value))) return null;
    var year = Number(value);
    return year >= min && year <= max ? year : null;
  }

  function calculate(year, mode) {
    if (mode !== "birth" && mode !== "celebration") throw new Error("Unknown calculation mode");
    var valid = parseYear(year, mode === "birth" ? 1800 : 1900, mode === "birth" ? 9910 : 9999);
    if (valid === null) throw new Error("Invalid year");
    return milestones.map(function (item) {
      return { name: item.name, basis: item.basis, age: item.offset,
        birthYear: mode === "birth" ? valid : valid - item.offset,
        celebrationYear: mode === "birth" ? valid + item.offset : valid };
    });
  }

  // The same calculation is checked without requiring a browser or build step.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseYear: parseYear, calculate: calculate };
  }
  if (typeof document === "undefined") return;

  var currentYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Seoul", year: "numeric" }).format(new Date()));
  var birthInput = document.getElementById("birth-year");
  var yearInput = document.getElementById("celebration-year");
  birthInput.max = Math.min(currentYear, 9910);
  yearInput.value = currentYear;
  var exampleHost = document.getElementById("milestone-examples");
  [
    { title: "🌼 올해 칠순을 준비해요", birth: currentYear - 69, detail: currentYear + "년 칠순 · 세는 나이 70세" },
    { title: "🌷 내년이 환갑이에요", birth: currentYear + 1 - 60, detail: (currentYear + 1) + "년 환갑 · 만 60세" },
    { title: "🌸 올해 팔순을 챙겨요", birth: currentYear - 79, detail: currentYear + "년 팔순 · 세는 나이 80세" }
  ].forEach(function (example) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "age-example";
    button.innerHTML = "<b>" + example.title + "</b><span>" + example.birth + "년생 · " + example.detail + "</span><em>계산해 보기 ↗</em>";
    button.addEventListener("click", function () {
      birthInput.value = example.birth;
      render("birth");
    });
    exampleHost.appendChild(button);
  });

  function render(mode) {
    var isBirth = mode === "birth";
    var input = isBirth ? birthInput : yearInput;
    var error = document.getElementById(isBirth ? "birth-error" : "year-error");
    var result = document.getElementById(isBirth ? "birth-result" : "year-result");
    var year = parseYear(input.value, isBirth ? 1800 : 1900, isBirth ? Math.min(currentYear, 9910) : 9999);
    if (year === null) {
      error.textContent = isBirth ? "태어난 연도를 1800년부터 올해까지 네 자리 숫자로 입력해 주세요." : "확인할 연도를 1900년부터 9999년까지 네 자리 숫자로 입력해 주세요.";
      input.setAttribute("aria-invalid", "true");
      result.replaceChildren();
      input.focus();
      return;
    }
    error.textContent = "";
    input.removeAttribute("aria-invalid");
    var rows = calculate(year, mode);
    var next = isBirth ? rows.find(function (row) { return row.celebrationYear >= currentYear; }) : null;
    var summary = isBirth ? year + "년생의 잔치 해" : year + "년 잔치를 맞는 분";
    var nextText = next ? (next.celebrationYear === currentYear ? "올해는 " : "앞으로 가장 가까운 잔치는 ") + next.celebrationYear + "년 " + next.name + "입니다." : "";
    var featured = [rows[0], rows[2], rows[4]].map(function (row) {
      return '<div class="age-moment' + (isBirth && row.celebrationYear === currentYear ? ' is-current' : '') + '"><b>' + row.name + '</b><strong>' + (isBirth ? row.celebrationYear : row.birthYear) + '</strong><span>' + (isBirth ? '년에 맞아요' : '년생') + '</span><small>' + row.basis + '</small></div>';
    }).join('');
    result.innerHTML = '<p class="answer">' + summary + '</p>' + (nextText ? '<p>' + nextText + '</p>' : '') +
      '<div class="age-milestones">' + featured + '</div><details class="age-details"><summary>진갑·희수까지, 전체 7개 잔치 보기</summary>' +
      '<table class="milestone-table"><caption>' + (isBirth ? '출생 연도 + 나이 차이로 계산한 연도' : '잔치 연도 − 나이 차이로 계산한 출생 연도') + '</caption><thead><tr><th scope="col">잔치</th><th scope="col">' + (isBirth ? '잔치 해' : '출생 연도') + '</th><th scope="col">기준 / 생신에 되는 만 나이</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return '<tr' + (isBirth && row.celebrationYear === currentYear ? ' class="upcoming"' : '') + '><th scope="row">' + row.name + '</th><td>' + (isBirth ? row.celebrationYear + '년' : row.birthYear + '년생') + '</td><td>' + row.basis + (row.age > 61 ? ' / 만 ' + row.age + '세' : '') + '</td></tr>';
      }).join('') + '</tbody></table></details>';
  }

  [["birth-form", "birth"], ["year-form", "celebration"]].forEach(function (entry) {
    document.getElementById(entry[0]).addEventListener("submit", function (event) {
      event.preventDefault();
      render(entry[1]);
    });
  });
  // Clear an old answer when its input changes so it cannot be mistaken for the new result.
  [[birthInput, "birth"], [yearInput, "year"]].forEach(function (entry) {
    entry[0].addEventListener("input", function () {
      document.getElementById(entry[1] + "-result").replaceChildren();
      document.getElementById(entry[1] + "-error").textContent = "";
      entry[0].removeAttribute("aria-invalid");
    });
  });
  render("celebration");
})();
