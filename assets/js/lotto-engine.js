(function (root) {
  "use strict";
  function validNumbers(xs, count) {
    return Array.isArray(xs) && (count == null || xs.length === count) && new Set(xs).size === xs.length && xs.every(function (n) { return Number.isInteger(n) && n >= 1 && n <= 45; });
  }
  function choose(n, k) { if (k < 0 || k > n) return 0; var c = 1; for (var i = 1; i <= k; i++) c = c * (n - i + 1) / i; return Math.round(c); }
  function random(n) {
    var x = new Uint32Array(1), limit = 4294967296 - 4294967296 % n;
    do { root.crypto.getRandomValues(x); } while (x[0] >= limit);
    return x[0] % n;
  }
  function generate(count, fixed, excluded, reserved, rand) {
    if (!Number.isInteger(count) || count < 0 || count > 10 || !validNumbers(fixed) || fixed.length > 5 || !validNumbers(excluded) || fixed.some(function (n) { return excluded.includes(n); })) throw new Error("번호 조건을 확인해 주세요.");
    reserved = reserved || []; rand = rand || random;
    var pool = []; for (var n = 1; n <= 45; n++) if (!fixed.includes(n) && !excluded.includes(n)) pool.push(n);
    var k = 6 - fixed.length, total = choose(pool.length, k), keys = new Set(reserved.map(function (row) { return row.slice().sort(function (a,b) { return a-b; }).join(","); }));
    var blocked = new Set(reserved.filter(function (row) { return validNumbers(row,6) && fixed.every(function(n){return row.includes(n);}) && row.every(function(n){return !excluded.includes(n);}); }).map(function(row){return row.slice().sort(function(a,b){return a-b;}).join(",");})).size;
    if (total - blocked < count) throw new Error("현재 조건으로 서로 다른 " + count + "게임을 만들 수 없어요. 게임 수를 줄이거나 포함·제외 번호를 조정해 주세요.");
    var result = [], swaps = {}, left = total;
    while (result.length < count) {
      var index = rand(left), rank = swaps[index] === undefined ? index : swaps[index];
      left--; swaps[index] = swaps[left] === undefined ? left : swaps[left];
      var row = fixed.slice(), start = 0;
      for (var remaining = k; remaining > 0; remaining--) {
        for (var j = start; j < pool.length; j++) {
          var block = choose(pool.length - j - 1, remaining - 1);
          if (rank < block) { row.push(pool[j]); start = j + 1; break; }
          rank -= block;
        }
      }
      row.sort(function(a,b){return a-b;}); var key = row.join(",");
      if (!keys.has(key)) { keys.add(key); result.push({main:row,locked:false}); }
    }
    return result;
  }
  var api = {generate:generate,validNumbers:validNumbers,choose:choose};
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.TechaLottoEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
