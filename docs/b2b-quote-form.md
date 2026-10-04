# B2B 견적 폼 — 메일 접수 (2026-10-04)

`/contact/`와 용도별 페이지 4개(`/contact/event/` · `employee-gift/` · `vip-gift/` · `flower-class/`)의
견적 폼을 보내면 **bigcarl@naver.com** 으로 메일이 한 통 온다. 받은 메일에서 **답장**을 누르면
문의한 분의 이메일로 바로 간다(이메일을 남긴 경우).

처음엔 노션 DB에 쌓도록 만들었다가, 같은 날 사장님 지시로 메일로 바꿨다.
(그때 만든 노션 DB "테차 B2B 견적 문의"는 쓰지 않는다. 노션에서 지워도 된다.)

## 흐름

```
폼(정적 HTML, scripts/build-quote-form.js 가 찍음)
  → POST /api/quote
  → worker/index.js : 입력 확인 · 스팸 거르기
  → Cloudflare Email Service (send_email 바인딩 QUOTE_MAIL)
  → bigcarl@naver.com
```

| 파일 | 하는 일 |
|---|---|
| `worker/index.js` | `/api/quote` 만 받는다. 나머지 요청은 정적 자산 그대로 |
| `wrangler.toml` | `main`, `run_worker_first = ["/api/*"]`, `[[send_email]]` 바인딩, `QUOTE_FROM`·`QUOTE_TO` |
| `scripts/build-quote-form.js` | 폼 마크업을 5쪽에 찍는다. 필드를 바꾸면 Worker 의 `validate()` 도 같이 |
| `assets/js/quote-form.js` | 브라우저에서 보내기·안내 문구. JS 가 없어도 폼은 그대로 동작한다 |
| `privacy/index.html#quote` | 수집 항목·목적·보관 기간·국외 이전 고지 |

## ⚠️ main 에 머지하기 전에 할 일 (사장님, Cloudflare 대시보드에서 1번만)

1. **Compute → Email Service → Email Sending → Onboard Domain** → `techa.kr` 선택 → **Done**
   - Cloudflare 가 `cf-bounce.techa.kr`(MX·SPF·DKIM)과 `_dmarc.techa.kr`(DMARC) 레코드를 자동으로 넣는다.
   - **루트 도메인의 MX 는 건드리지 않는다.** techa.kr 로 받는 메일이 있다면 그대로 유지된다.
   - 이미 `_dmarc.techa.kr` 레코드가 있으면 충돌 안내가 뜬다. 그때는 손대지 말고 알려 주세요.
2. 받는 주소 인증을 요구하면 `bigcarl@naver.com` 으로 온 확인 메일의 링크를 누른다.
3. 머지 후 배포가 끝나면 `/contact/` 폼으로 시험 문의를 1건 보내서 메일이 오는지 확인한다.

1번을 안 한 채로 배포되면 사이트는 정상이고, 폼만 "지금 접수가 잠시 안 돼요"와 함께
**적은 내용이 그대로 담긴 이메일 보내기 링크**와 네이버 톡톡을 안내한다 — 문의를 잃지는 않는다.

## "지금 접수가 잠시 안 돼요"가 뜰 때

문구 끝의 **(오류 코드: …)** 를 보면 원인이 나온다. Cloudflare 대시보드 Workers → techa-automation →
Logs 에도 `send_email <코드>` 로 남는다.

| 코드 | 원인 | 할 일 |
|---|---|---|
| `E_SENDER_DOMAIN_NOT_CONFIGURED` · `E_SENDER_DOMAIN_NOT_AVAILABLE` · `E_SENDER_NOT_VERIFIED` | techa.kr 이 Email Sending 에 등록 안 됨 (2026-10-04 미리보기에서 실제로 `…NOT_CONFIGURED` 확인) | 위 "머지하기 전에 할 일" 1번 |
| `E_RECIPIENT_NOT_ALLOWED` · `E_RECIPIENT_SUPPRESSED` | 받는 주소 인증 안 됨 / 반송 이력 | 위 2번, 또는 Email Sending 설정에서 suppression 확인 |
| `E_RATE_LIMIT_EXCEEDED` · `E_DAILY_LIMIT_EXCEEDED` | 발송 한도 | 잠시 뒤 재시도. 반복되면 스팸 유입 의심 |
| `http_404` · `http_405` · `http_501` | 접수 API 가 없는 배포(Worker 코드 없이 정적 파일만 올라간 경우) | 배포 로그 확인 |
| `origin` | 허용 목록 밖 주소에서 보냄 | `worker/index.js` 의 `ALLOWED_ORIGINS` |
| `Failedtofetch` | 방문자 쪽 네트워크 끊김 | — |

## 스팸·안전장치

- **받는 주소 고정**: 바인딩에 `destination_address = "bigcarl@naver.com"` — 코드가 다른 주소로는 못 보낸다.
  폼이 스팸 발송기로 악용될 수 없다.
- **허니팟**: 화면에 안 보이는 칸(`website`)을 채우면 봇으로 보고 성공한 척 버린다.
- **작성 시간**: 페이지를 연 지 3초 안에 보내면 버린다.
- **출처 확인**: techa.kr · 미리보기 주소 · localhost 밖에서 온 요청은 거절한다.
- **줄바꿈 제거**: 한 줄 칸(회사명 등)의 줄바꿈을 지운다 — 메일 제목 조작을 막는다.
- **개인정보 동의 필수**: 동의하지 않으면 보낼 수 없다. 동의하지 않는 분은 이메일·톡톡으로 안내.

스팸이 실제로 늘면 Cloudflare Turnstile(무료 봇 확인)을 붙인다. 지금은 넣지 않았다 — 칸 하나가
늘면 문의가 줄 수 있어서다.

## 로컬에서 시험하는 법

```bash
npx wrangler dev            # http://localhost:8787
curl -H 'content-type: application/json' -H 'Origin: https://www.techa.kr' \
  -d '{"company":"테스트","name":"홍길동","phone":"010-1234-5678","agree":true,"elapsed_ms":"9000"}' \
  http://localhost:8787/api/quote
```

로컬에서는 메일이 실제로 나가지 않고 `.wrangler/tmp/email/…/*.txt` 에 본문이 저장된다(2026-10-04 확인).
