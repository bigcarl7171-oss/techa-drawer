// node --test tests/dday-occasions.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({});
for (const file of ['korean-lunar.js', 'dday-occasions.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), context);
}
const { nextDate, occasions } = context.TechaOccasions;
test('fixed dates include today and roll forward only after the occasion', () => {
  assert.equal(nextDate('valentine', '2026-10-21'), '2027-02-14');
  assert.equal(nextDate('white-day', '2027-03-14'), '2027-03-14');
  assert.equal(nextDate('white-day', '2027-03-15'), '2028-03-14');
  assert.equal(nextDate('pepero-day', '2026-10-21'), '2026-11-11');
  assert.equal(nextDate('new-year', '2026-12-31'), '2027-01-01');
});
test('KASI 2026 festival dates match the published calendar', () => {
  for (const [key, date] of Object.entries({seollal:'2026-02-17',daeboreum:'2026-03-03',dano:'2026-06-19',chilseok:'2026-08-19',chuseok:'2026-09-25'})) {
    assert.equal(nextDate(key, '2026-01-01'), date);
  }
});
test('Korean new year differs from Chinese new year in 2027 and 2028', () => {
  assert.equal(nextDate('seollal', '2026-10-21'), '2027-02-07');
  assert.equal(nextDate('seollal', '2027-02-08'), '2028-01-27');
  assert.equal(nextDate('seollal', '2028-01-27'), '2028-01-27');
  assert.equal(nextDate('chuseok', '2026-10-21'), '2027-09-15');
});
test('all presets resolve and unsupported lunar years fail without a fake date', () => {
  for (const item of occasions) assert.ok(nextDate(item.key, '2026-10-21'));
  assert.equal(nextDate('seollal', '2051-01-01'), null);
  assert.equal(nextDate('chuseok', '2050-12-31'), null);
  assert.equal(nextDate('missing', '2026-10-21'), null);
});
