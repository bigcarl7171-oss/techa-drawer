/* SunCalc 1.9.0: bright-limb angle minus parallactic angle gives the
 * observer's zenith angle (anticlockwise from up). SVG rotates clockwise.
 * https://github.com/mourner/suncalc/tree/v1.9.0#moon-illumination
 */
(function (global) {
  'use strict';
  const places = {seoul:{name:'서울',lat:37.5665,lon:126.978},busan:{name:'부산',lat:35.1796,lon:129.0756},jeju:{name:'제주',lat:33.4996,lon:126.5312}};
  function view(date, time, city) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !places[city]) return null;
    const instant = new Date(date+'T'+time+':00+09:00');
    if (!Number.isFinite(+instant) || new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date) return null;
    const place = places[city], illumination = global.SunCalc.getMoonIllumination(instant), position = global.SunCalc.getMoonPosition(instant,place.lat,place.lon);
    const phase=illumination.phase;
    const name=phase<.035||phase>.965?'삭 무렵':phase<.215?'초승달':phase<.285?'상현달 무렵':phase<.465?'차오르는 달':phase<.535?'보름달 무렵':phase<.715?'기우는 달':phase<.785?'하현달 무렵':'그믐달';
    const rotation=-(illumination.angle-position.parallacticAngle)*180/Math.PI-90;
    // Outline of the illuminated portion projected onto the visible disk.
    const points=[],r=48,c=50,steps=96;
    for(let i=0;i<=steps;i++){const y=-r+2*r*i/steps;points.push([c+Math.sqrt(Math.max(0,r*r-y*y)),c+y]);}
    for(let i=steps;i>=0;i--){const y=-r+2*r*i/steps;points.push([c+(1-2*illumination.fraction)*Math.sqrt(Math.max(0,r*r-y*y)),c+y]);}
    return {name,fraction:illumination.fraction,phase,rotation,altitude:position.altitude*180/Math.PI,aboveHorizon:position.altitude>0,city:place.name,date,time,path:'M'+points.map(p=>p.map(n=>n.toFixed(3)).join(',')).join('L')+'Z'};
  }
  global.TechaMoon = Object.freeze({view,places});
})(typeof window!=='undefined'?window:this);
