const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context=vm.createContext({});
context.window=context;
for(const file of ['vendor/suncalc.js','lunar-moon.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),context);
const view=context.TechaMoon.view;
test('known 2024 eclipse dates show new and full moon',()=>{
  // April 8 solar eclipse near 18 UTC; March 25 lunar eclipse near 07 UTC.
  assert.ok(view('2024-04-09','03:00','seoul').fraction<.002);
  assert.ok(view('2024-03-25','16:00','seoul').fraction>.998);
  assert.equal(view('2024-03-25','16:00','seoul').fullMoon,true);
  assert.equal(view('2024-04-09','03:00','seoul').fullMoon,false);
});
test('illumination shape has the expected projected area',()=>{
  for(const date of ['2026-10-11','2026-10-18','2026-10-21','2026-10-26','2026-11-02']){
    const moon=view(date,'21:00','seoul');
    const points=moon.path.slice(1,-1).split('L').map(p=>p.split(',').map(Number));
    const area=Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
    assert.ok(Math.abs(area/(Math.PI*48*48)-moon.fraction)<.003);
    assert.ok(!moon.path.includes('NaN'));
  }
});
test('observer location and time change tilt, without changing date-only conversion',()=>{
  const evening=view('2026-10-21','21:00','seoul'),morning=view('2026-10-21','06:00','seoul'),busan=view('2026-10-21','21:00','busan');
  assert.ok(Math.abs(evening.rotation-morning.rotation)>5);
  assert.ok(Math.abs(evening.rotation-busan.rotation)>.1);
  assert.ok(Number.isFinite(evening.altitude));
  assert.equal(typeof morning.aboveHorizon,'boolean');
});
test('invalid observer settings do not produce a moon diagram',()=>{
  assert.equal(view('bad','21:00','seoul'),null);
  assert.equal(view('2026-10-21','','seoul'),null);
  assert.equal(view('2026-10-21','25:00','seoul'),null);
  assert.equal(view('2026-10-21','21:00','unknown'),null);
});
