/**
 * techa.kr Worker — 정적 사이트 앞단. 하는 일은 하나: B2B 견적 폼 접수.
 *
 *   POST /api/quote  → bigcarl@naver.com 으로 문의 메일 발송 (Cloudflare Email Service)
 *   그 외 모든 요청  → 정적 자산(env.ASSETS) 그대로
 *
 * wrangler.toml 의 run_worker_first = ["/api/*"] 때문에 /api/ 밖의 요청은 애초에
 * 이 코드를 거치지 않는다. 아래 ASSETS 위임은 혹시 설정이 바뀌어도 사이트가
 * 안 깨지게 하는 안전망이다.
 *
 * 받는 주소는 wrangler.toml 의 send_email 바인딩(QUOTE_MAIL)에 destination_address 로
 * 고정돼 있다 — 이 코드가 다른 주소로는 보낼 수 없다(폼이 스팸 발송기가 되지 않게).
 * 보내는 주소 QUOTE_FROM(quote@techa.kr)은 techa.kr 이 Cloudflare Email Service 에
 * 등록돼 있어야 쓸 수 있다. 등록 전이거나 발송이 실패하면 502/503 을 돌려주고,
 * 폼은 적은 내용 그대로 이메일·톡톡으로 보내도록 안내한다 — 문의를 잃지 않게.
 * 2026-10-04 처음엔 노션 DB 로 쌓았다가, 같은 날 사장님 지시로 메일로 바꿨다.
 *
 * 절차·근거: docs/b2b-quote-form.md
 */

const PURPOSES = ['행사·시상', '직원 선물', 'VIP·거래처', '플라워 클래스', '기타'];
const ALLOWED_ORIGINS = [/^https:\/\/www\.techa\.kr$/, /^https:\/\/techa\.kr$/, /^https:\/\/[a-z0-9-]+-techa-automation\.[a-z0-9-]+\.workers\.dev$/, /^http:\/\/localhost(:\d+)?$/];
const MIN_FILL_MS = 3000;   // 사람이 3초 안에 이 폼을 채울 수는 없다
const MAX_BODY = 16 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/quote') return handleQuote(request, env);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function handleQuote(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, { Allow: 'POST' });

  const ctype = request.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');
  // JS 없이 보낸 폼은 결과를 페이지로 돌려준다
  const reply = (ok, error, status) => isJson
    ? json(ok ? { ok: true } : { ok: false, error }, status)
    : Response.redirect(new URL('/contact/?' + (ok ? 'sent=1' : 'error=' + error) + '#contact-form', request.url).toString(), 303);

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) return reply(false, 'origin', 403);

  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return reply(false, 'too_large', 413);

  let raw;
  try {
    raw = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(false, 'bad_body', 400);
  }

  // 스팸: 숨김 칸을 채웠거나 너무 빨리 보냈으면 성공한 척하고 버린다(봇에게 신호를 주지 않는다)
  const elapsed = Number(raw.elapsed_ms);
  if (str(raw.website) || (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS)) return reply(true);

  const v = validate(raw);
  if (v.error) return reply(false, v.error, 422);

  if (!env.QUOTE_MAIL || !env.QUOTE_FROM || !env.QUOTE_TO) return reply(false, 'not_configured', 503);

  const mail = toMail(v.data);
  try {
    await env.QUOTE_MAIL.send({
      to: env.QUOTE_TO,
      from: { email: env.QUOTE_FROM, name: '테차 견적 문의' },
      subject: mail.subject,
      text: mail.text,
      // 받은 메일에서 '답장'을 누르면 바로 문의한 분에게 간다
      ...(v.data.email ? { replyTo: v.data.email } : {}),
    });
  } catch (e) {
    console.error('send_email', e && e.code, e && e.message);
    return reply(false, 'upstream', 502);
  }
  return reply(true);
}

function validate(raw) {
  const d = {
    company: str(raw.company, 100),
    name: str(raw.name, 50),
    phone: str(raw.phone, 30),
    email: str(raw.email, 120),
    purpose: str(raw.purpose, 20),
    date: str(raw.date, 10),
    quantity: str(raw.quantity, 7),
    budget: str(raw.budget, 100),
    destinations: str(raw.destinations, 4),
    color: str(raw.color, 100),
    card: truthy(raw.card),
    invoice: truthy(raw.invoice),
    message: str(raw.message, 1500, true),
    page: str(raw.page, 200),
  };
  if (!truthy(raw.agree)) return { error: 'agree' };
  if (!d.company) return { error: 'company' };
  if (!d.name) return { error: 'name' };
  if (!d.phone && !d.email) return { error: 'contact' };
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { error: 'email' };
  if (d.phone && !/^[0-9+\-\s()]{8,}$/.test(d.phone)) return { error: 'phone' };
  if (!PURPOSES.includes(d.purpose)) d.purpose = '기타';
  if (d.date && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) d.date = '';
  d.quantity = /^\d+$/.test(d.quantity) ? Number(d.quantity) : null;
  d.destinations = /^\d+$/.test(d.destinations) ? Number(d.destinations) : null;
  return { data: d };
}

const LABELS = [
  ['company', '회사·기관'], ['name', '담당자'], ['phone', '연락처'], ['email', '이메일'],
  ['purpose', '용도'], ['date', '행사 날짜'], ['quantity', '수량'], ['budget', '예산'],
  ['destinations', '배송지 개수'], ['color', '원하는 색상'],
];

function toMail(d) {
  const oneLine = (x) => String(x).replace(/[\r\n]+/g, ' ');
  const subject = oneLine(['[테차 견적 문의]', d.company, d.purpose, d.quantity !== null ? d.quantity + '개' : '']
    .filter(Boolean).join(' · ').replace('] · ', '] '));
  const lines = LABELS.map(([k, label]) => `${label}: ${d[k] === null || d[k] === '' ? '-' : d[k]}`);
  lines.push(`메시지 카드: ${d.card ? '필요' : '-'}`);
  lines.push(`견적서·세금계산서: ${d.invoice ? '필요' : '-'}`);
  lines.push('', '[요청 사항]', d.message || '-', '', `보낸 페이지: https://www.techa.kr${d.page || '/contact/'}`);
  lines.push('', d.email ? '이 메일에 답장하면 문의하신 분 이메일로 바로 갑니다.' : '이메일을 남기지 않으셨어요. 연락처로 연락해 주세요.');
  return { subject, text: lines.join('\n') };
}

// 한 줄 칸은 줄바꿈을 지운다. 여러 줄은 요청 사항(message)만 받는다
function str(v, max = 200, multiline = false) {
  if (typeof v !== 'string') return '';
  const s = multiline ? v : v.replace(/[\r\n]+/g, ' ');
  return s.trim().slice(0, max);
}

function truthy(v) {
  return v === true || v === 'on' || v === 'true' || v === '1';
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export { validate, toMail };
