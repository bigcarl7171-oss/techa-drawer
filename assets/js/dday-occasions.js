/* Recurring dates use Korea's lunar converter already bundled by TECHA.
 * Sources: https://www.kasi.re.kr/kor/post/newsMaterial/32031
 * https://www.kasi.re.kr/kor/publication/post/newsMaterial/2151
 * These are the occasion dates, not holiday ranges or substitute holidays.
 */
(function (global) {
  'use strict';
  const occasions = [
    { key: 'valentine', name: '발렌타인데이', group: '연인과 함께', month: 2, day: 14 },
    { key: 'white-day', name: '화이트데이', group: '연인과 함께', month: 3, day: 14 },
    { key: 'rose-day', name: '로즈데이', group: '연인과 함께', month: 5, day: 14 },
    { key: 'couples-day', name: '부부의 날', group: '연인과 함께', month: 5, day: 21 },
    { key: 'pepero-day', name: '빼빼로데이', group: '연인과 함께', month: 11, day: 11 },
    { key: 'christmas', name: '크리스마스', group: '연인과 함께', month: 12, day: 25 },
    { key: 'new-year', name: '새해 첫날', group: '가족·감사', month: 1, day: 1 },
    { key: 'children-day', name: '어린이날', group: '가족·감사', month: 5, day: 5 },
    { key: 'parents-day', name: '어버이날', group: '가족·감사', month: 5, day: 8 },
    { key: 'teachers-day', name: '스승의날', group: '가족·감사', month: 5, day: 15 },
    { key: 'seollal', name: '설날', group: '한국 명절·음력 행사', lunar: true, month: 1, day: 1 },
    { key: 'daeboreum', name: '정월대보름', group: '한국 명절·음력 행사', lunar: true, month: 1, day: 15 },
    { key: 'buddha-day', name: '부처님오신날', group: '한국 명절·음력 행사', lunar: true, month: 4, day: 8 },
    { key: 'dano', name: '단오', group: '한국 명절·음력 행사', lunar: true, month: 5, day: 5 },
    { key: 'chilseok', name: '칠석', group: '한국 명절·음력 행사', lunar: true, month: 7, day: 7 },
    { key: 'chuseok', name: '추석', group: '한국 명절·음력 행사', lunar: true, month: 8, day: 15 }
  ];
  function nextDate(key, reference) {
    const item = occasions.find(item => item.key === key);
    if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(reference)) return null;
    const year = Number(reference.slice(0, 4));
    for (let y = year; y <= year + 1; y++) {
      let date;
      if (item.lunar) {
        if (y < 1000 || y > 2050 || !global.KoreanLunarCalendar) continue;
        const calendar = new global.KoreanLunarCalendar();
        // Traditional festivals fall in the regular month, never the leap month.
        if (!calendar.setLunarDate(y, item.month, item.day, false)) continue;
        const solar = calendar.getSolarCalendar();
        date = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`;
      } else {
        if (y > 9990) continue;
        date = `${y}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
      }
      if (date >= reference) return date;
    }
    return null;
  }
  global.TechaOccasions = Object.freeze({ occasions, nextDate });
})(typeof window !== 'undefined' ? window : this);
