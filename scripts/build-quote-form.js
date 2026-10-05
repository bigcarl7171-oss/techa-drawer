#!/usr/bin/env node
/**
 * B2B 견적 폼을 정적 HTML로 찍는다.
 *
 * 왜 만들었나 — 2026-10-04 사이트 점검: /contact/ 에 폼이 0개였다. 체크리스트 복사·메일·톡톡뿐이라
 * 문의가 몇 건 왔는지 사이트에서 셀 방법이 없었다(정의 문서 목적 ③ B2B).
 * 폼은 /api/quote(worker/index.js)로 보내고, Worker 가 bigcarl@naver.com 으로 메일을 보낸다.
 *
 * 같은 폼이 /contact/ 와 용도별 페이지 4개에 들어간다. 손으로 복사하면 한쪽만 고쳐지므로
 * 여기서 한 번에 찍는다. 페이지마다 다른 건 '용도' 기본값 하나뿐이다.
 *
 * 필드 이름을 바꾸면 worker/index.js 의 validate() 도 같이 바꾼다.
 *
 * 사용: node scripts/build-quote-form.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { ROOT, esc, eolOf, toEol } = require('./lib/site-registry');

const BEGIN = '<!-- BEGIN quote-form (생성: scripts/build-quote-form.js — 직접 고치지 말 것) -->';
const END = '<!-- END quote-form -->';

// 값은 worker/index.js 의 PURPOSES 와 같아야 한다
const PURPOSES = ['행사·시상', '직원 선물', 'VIP·거래처', '플라워 클래스', '기타'];

// 페이지 → 용도 기본값. 여기 없는 페이지에 BEGIN/END 가 있으면 '기타'.
// 2026-10-05: 용도별 페이지 4개(contact/event 등)는 아직 main 에 없다(claude/cool-mccarthy-wev4g6 브랜치).
// 그 페이지들을 들일 때 아래 주석을 푼다.
const PAGES = {
  'contact/index.html': '',
  // 'contact/event/index.html': '행사·시상',
  // 'contact/employee-gift/index.html': '직원 선물',
  // 'contact/vip-gift/index.html': 'VIP·거래처',
  // 'contact/flower-class/index.html': '플라워 클래스',
};

function formMarkup(purpose) {
  const opts = ['<option value="">고르지 않음</option>']
    .concat(PURPOSES.map((p) => '<option' + (p === purpose ? ' selected' : '') + '>' + esc(p) + '</option>'))
    .join('');
  return [
    BEGIN,
    '<form class="quote-form" method="post" action="/api/quote" novalidate>',
    '  <div class="qf-grid">',
    '    <label class="qf-field"><span>회사·기관 이름 <b>필수</b></span><input name="company" required maxlength="100" autocomplete="organization"></label>',
    '    <label class="qf-field"><span>담당자 이름 <b>필수</b></span><input name="name" required maxlength="50" autocomplete="name"></label>',
    '    <label class="qf-field"><span>연락처</span><input name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="010-0000-0000"></label>',
    '    <label class="qf-field"><span>이메일</span><input name="email" type="email" maxlength="120" autocomplete="email"></label>',
    '    <label class="qf-field"><span>용도</span><select name="purpose">' + opts + '</select></label>',
    '    <label class="qf-field"><span>행사 날짜</span><input name="date" type="date"></label>',
    '    <label class="qf-field"><span>수량</span><input name="quantity" type="number" min="1" max="999999" inputmode="numeric" placeholder="예: 30"></label>',
    '    <label class="qf-field"><span>예산</span><input name="budget" maxlength="100" placeholder="총액 또는 1개당 금액"></label>',
    '    <label class="qf-field"><span>배송지 개수</span><input name="destinations" type="number" min="1" max="9999" inputmode="numeric" placeholder="예: 1"></label>',
    '    <label class="qf-field"><span>원하는 색상</span><input name="color" maxlength="100" placeholder="회사 색상, 행사 분위기 등"></label>',
    '  </div>',
    '  <p class="qf-hint">연락처와 이메일 중 하나는 꼭 적어 주세요. 나머지는 정해진 것만 적으셔도 됩니다.</p>',
    '  <div class="qf-checks">',
    '    <label><input type="checkbox" name="card" value="on"> 메시지 카드가 필요합니다</label>',
    '    <label><input type="checkbox" name="invoice" value="on"> 견적서·세금계산서가 필요합니다</label>',
    '  </div>',
    '  <label class="qf-field qf-wide"><span>요청 사항</span><textarea name="message" rows="4" maxlength="1500" placeholder="행사 종류, 받는 분, 원하는 상품 등 편하게 적어 주세요"></textarea></label>',
    '  <div class="qf-hp" aria-hidden="true"><label>비워 두세요 <input name="website" tabindex="-1" autocomplete="off"></label></div>',
    '  <input type="hidden" name="elapsed_ms" value="">',
    '  <input type="hidden" name="page" value="">',
    '  <div class="qf-agree">',
    '    <label><input type="checkbox" name="agree" value="on" required> <b>개인정보 수집·이용에 동의합니다 (필수)</b></label>',
    '    <p>수집 항목: 회사·기관 이름, 담당자 이름, 연락처, 이메일, 문의 내용 · 목적: 견적 안내와 상담 · 보관: 문의일로부터 1년 뒤 파기. 동의하지 않으셔도 이메일이나 네이버 톡톡으로 문의하실 수 있습니다. 자세한 내용은 <a href="/privacy/#quote">개인정보처리방침</a>에 있습니다.</p>',
    '  </div>',
    '  <button type="submit" class="btn btn-primary btn-block qf-submit">견적 문의 보내기</button>',
    '  <p class="qf-status" role="status" aria-live="polite"></p>',
    '</form>',
    END,
  ].join('\n');
}

// ---------- 공간 스타일링 상담 양식 (2026-10-05) ----------
// /api/space 로 보낸다. 값 목록은 worker/index.js 의 SPACES·DELIVERIES·PLANS 와 같아야 한다.
// 사진은 양식으로 받지 않는다 — 접수 뒤 톡톡이나 답장 메일로 받는다.
const SPACE_BEGIN = '<!-- BEGIN space-form (생성: scripts/build-quote-form.js — 직접 고치지 말 것) -->';
const SPACE_END = '<!-- END space-form -->';
const SPACE_PAGES = ['space/index.html'];
const SPACES = ['집', '사무실', '매장', '기타'];
const DELIVERIES = ['택배', '방문 설치', '상담 후 결정'];
const PLANS = ['한 번만', '계절마다 교체', '아직 모름'];

function select(name, values) {
  return '<select name="' + name + '"><option value="">고르지 않음</option>' +
    values.map((v) => '<option>' + esc(v) + '</option>').join('') + '</select>';
}

function spaceFormMarkup() {
  return [
    SPACE_BEGIN,
    '<form class="quote-form" data-kind="space" method="post" action="/api/space" novalidate>',
    '  <div class="qf-grid">',
    '    <label class="qf-field"><span>이름 <b>필수</b></span><input name="name" required maxlength="50" autocomplete="name"></label>',
    '    <label class="qf-field"><span>공간 종류</span>' + select('space', SPACES) + '</label>',
    '    <label class="qf-field"><span>연락처</span><input name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="010-0000-0000"></label>',
    '    <label class="qf-field"><span>이메일</span><input name="email" type="email" maxlength="120" autocomplete="email"></label>',
    '    <label class="qf-field"><span>꽃을 놓고 싶은 곳</span><input name="spot" maxlength="150" placeholder="예: 현관 신발장 위, 안내데스크"></label>',
    '    <label class="qf-field"><span>회사·매장 이름</span><input name="company" maxlength="100" autocomplete="organization" placeholder="사무실·매장이면 적어 주세요"></label>',
    '    <label class="qf-field"><span>지역</span><input name="area" maxlength="60" placeholder="시·구까지 (방문 설치 확인용)"></label>',
    '    <label class="qf-field"><span>예산</span><input name="budget" maxlength="100" placeholder="대략적인 금액"></label>',
    '    <label class="qf-field"><span>받는 방법</span>' + select('delivery', DELIVERIES) + '</label>',
    '    <label class="qf-field"><span>교체 계획</span>' + select('plan', PLANS) + '</label>',
    '  </div>',
    '  <p class="qf-hint">연락처와 이메일 중 하나는 꼭 적어 주세요. 나머지는 아는 것만 적으셔도 됩니다.</p>',
    '  <label class="qf-field qf-wide"><span>요청 사항</span><textarea name="message" rows="4" maxlength="1500" placeholder="공간 분위기, 가구·벽 색, 원하는 꽃 색 등 편하게 적어 주세요"></textarea></label>',
    '  <p class="qf-photo">사진은 이 양식으로 받지 않아요. 접수 후 <a href="https://talk.naver.com/W4GQDO" target="_blank" rel="noopener">네이버 톡톡</a>으로 보내주시거나, 저희가 보내드리는 답장 메일에 첨부해 주세요.</p>',
    '  <div class="qf-hp" aria-hidden="true"><label>비워 두세요 <input name="website" tabindex="-1" autocomplete="off"></label></div>',
    '  <input type="hidden" name="elapsed_ms" value="">',
    '  <input type="hidden" name="page" value="">',
    '  <div class="qf-agree">',
    '    <label><input type="checkbox" name="agree" value="on" required> <b>개인정보 수집·이용에 동의합니다 (필수)</b></label>',
    '    <p>수집 항목: 이름, 연락처, 이메일, 지역, 문의 내용 · 목적: 공간 스타일링 상담 · 보관: 문의일로부터 1년 뒤 파기. 동의하지 않으셔도 이메일이나 네이버 톡톡으로 문의하실 수 있습니다. 자세한 내용은 <a href="/privacy/#quote">개인정보처리방침</a>에 있습니다.</p>',
    '  </div>',
    '  <button type="submit" class="btn btn-primary btn-block qf-submit">상담 신청 보내기</button>',
    '  <p class="qf-status" role="status" aria-live="polite"></p>',
    '</form>',
    SPACE_END,
  ].join('\n');
}

function stamp(rel, begin, end, markup, check, changed) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.error('❌ ' + rel + ' 가 없다'); process.exit(1); }
  const html = fs.readFileSync(file, 'utf8');
  const b = html.indexOf(begin), e = html.indexOf(end);
  if (b === -1 || e === -1) { console.error('❌ ' + rel + ': 양식 BEGIN/END 를 못 찾음'); process.exit(1); }
  const next = html.slice(0, b) + toEol(markup, eolOf(html)) + html.slice(e + end.length);
  if (next !== html) {
    if (!check) fs.writeFileSync(file, next);
    changed.push(rel);
  }
}

function main() {
  const check = process.argv.includes('--check');
  const changed = [];
  let filled = 0;
  for (const [rel, purpose] of Object.entries(PAGES)) {
    stamp(rel, BEGIN, END, formMarkup(purpose), check, changed);
    filled++;
  }
  for (const rel of SPACE_PAGES) {
    stamp(rel, SPACE_BEGIN, SPACE_END, spaceFormMarkup(), check, changed);
    filled++;
  }
  if (changed.length && check) {
    console.error(`❌ 문의 양식이 어긋난다 (${changed.join(', ')}). node scripts/build-quote-form.js 를 돌릴 것`);
    process.exit(1);
  }
  console.log(changed.length ? `✅ ${changed.length}쪽 갱신 — 문의 양식 ${filled}곳 (견적·공간 상담)` : `✅ 최신 상태 — 문의 양식 ${filled}곳 (견적·공간 상담)`);
}

main();
