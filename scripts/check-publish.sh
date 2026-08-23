#!/usr/bin/env bash
# 매거진 발행 검증 — blog-seo-guide.md "새 글 발행 절차" 1~7번을 기계적으로 확인한다.
#
# 왜 스크립트인가: 절차 2·3·4번은 파일 위치가 고정돼 매번 지켜졌지만, 7번(내부링크)만
# "적당한 페이지를 찾아서"라 판단이 필요해 두 번 연속 누락됐다(2026-08-17, 08-18).
# 규칙 문장을 더 쓰는 대신, 안 지켜지면 실패하게 만든다.
#
# 사용법:  scripts/check-publish.sh <slug>
#   예)    scripts/check-publish.sh flower-gift-better-than-photo

set -uo pipefail
SLUG="${1:-}"
[ -z "$SLUG" ] && { echo "사용법: $0 <slug>"; exit 2; }

DRAWER="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DRAWER" || exit 2
[ -f techa-brand-rules.md ] || { echo "여기는 techa-drawer 저장소가 아니다: $DRAWER"; exit 2; }

# 형제 저장소를 특징 파일로 찾는다 (폴더 이름·드라이브가 PC마다 달라서).
PARENT="$(dirname "$DRAWER")"
find_repo() {  # $1=특징파일
  for d in "$PARENT"/*/; do [ -f "${d}$1" ] && { echo "${d%/}"; return 0; }; done
  return 1
}
CARDNEWS="$(find_repo topic-pool.md || true)"
SHORTS="$(find_repo script-guide.md || true)"

# ── 본문 자수 세기
#
# ⚠️ wc -m 은 로케일이 UTF-8 이 아니면 '문자'가 아니라 '바이트'를 센다. 한글은 3바이트라
# 자수가 3배로 부풀려졌고, 그래서 분량 경고가 한 번도 걸리지 않았다(2026-08-23 발견).
# 실측 결과 발행글 14편의 실제 본문은 746~2,152자였다 — 표시값은 2,156~6,232자였다.
CHARLOC=""
for loc in C.UTF-8 en_US.UTF-8 ko_KR.UTF-8; do
  [ "$(printf '가나다' | LC_ALL="$loc" wc -m 2>/dev/null)" = "3" ] && { CHARLOC="$loc"; break; }
done

# 줄 단위로 뽑으면 <p> 가 여러 줄에 걸친 옛 글이 통째로 누락된다. article 을 한 줄로
# 만든 뒤 태그를 지운다. 사진 설명(figcaption)은 본문이 아니라 뺀다.
body_chars() {
  local txt
  txt=$(tr '\n' ' ' < "$1" \
    | sed 's/.*<article class="article">//; s|</article>.*||' \
    | sed 's|<figcaption>[^<]*</figcaption>||g' \
    | sed 's/<[^>]*>/ /g' \
    | tr -d '[:space:]')
  if [ -n "$CHARLOC" ]; then printf '%s' "$txt" | LC_ALL="$CHARLOC" wc -m
  else printf '%s' "$txt" | wc -c; fi   # UTF-8 로케일이 없으면 바이트 수라도 낸다
}

FAIL=0; WARN=0
ok()   { printf "  \033[32m✅\033[0m %-26s %s\n" "$1" "${2:-}"; }
bad()  { printf "  \033[31m❌\033[0m %-26s %s\n" "$1" "${2:-}"; FAIL=$((FAIL+1)); }
warn() { printf "  \033[33m⚠️\033[0m  %-25s %s\n" "$1" "${2:-}"; WARN=$((WARN+1)); }

echo
echo "발행 검증: $SLUG"
echo "저장소: $DRAWER"
echo

# ── 1. 글 파일
echo "[1] 글 파일"
if [ -f "blog/$SLUG/index.html" ]; then
  chars=$(body_chars "blog/$SLUG/index.html")
  imgs=$(grep -c '<img ' "blog/$SLUG/index.html")
  ok "blog/$SLUG/index.html" "본문 약 ${chars}자 · 이미지 ${imgs}장"
  [ -z "$CHARLOC" ] && warn "자수 신뢰도" "UTF-8 로케일이 없어 바이트로 셌다 — 한글은 약 3배로 부풀려진다"
  # 목표는 stage3-magazine.md 원본과 같은 1,800~2,800자 (2026-08-19 상향).
  # 예전엔 이 줄만 옛 기준 1,200~1,800으로 남아 아래 [규격] 대조와 자기모순이었다.
  [ "$chars" -lt 1800 ] && warn "본문 분량" "약 ${chars}자 — 목표 1,800~2,800자"
  [ "$chars" -gt 2800 ] && warn "본문 분량" "약 ${chars}자 — 목표 1,800~2,800자"
  # 참조한 이미지 파일이 실제로 있는지. 없으면 라이브에 깨진 이미지가 그대로 나간다 —
  # 무인 발행이라 사람 눈이 중간에 없다.
  missing=""
  for src in $(grep -o 'src="/blog/'"$SLUG"'/[^"]*"' "blog/$SLUG/index.html" | sed 's/src="//; s/"$//'); do
    [ -f ".$src" ] || missing="$missing $(basename "$src")"
  done
  [ -z "$missing" ] && ok "이미지 파일 실재" "${imgs}장 모두 있음" \
    || bad "이미지 파일 실재" "없음 —$missing"
  og=$(grep -o 'og:image" content="[^"]*' "blog/$SLUG/index.html" | head -1)
  [ -n "$og" ] && ok "대표 이미지" "$(basename "$og")" || bad "대표 이미지" "og:image 없음"
else
  bad "blog/$SLUG/index.html" "글 파일이 없다"; echo; exit 1
fi

# ── 2~4. 고정 위치 반영
echo "[2~4] 목록·메인·사이트맵"
n=$(grep -c "/blog/$SLUG/" blog/index.html); [ "$n" -ge 1 ] && ok "blog/index.html 카드" "$n" || bad "blog/index.html 카드" "없음"
# 캐러셀(3)·위젯(5)은 상한이 있어 최신 글만 올라간다. 최신 글일 때만 필수로 본다.
NEWEST=$(grep -o '/blog/[a-z0-9-]*/' blog/index.html | head -1 | sed 's|/blog/||;s|/||')
n=$(grep -c "shell-mag-card[^>]*href=\"/blog/$SLUG/\"" index.html)
n2=$(grep -c "<a class=\"shell-mag-row\" href=\"/blog/$SLUG/\"" index.html)
if [ "$SLUG" = "$NEWEST" ]; then
  [ "$n" -ge 1 ]  && ok "index.html 캐러셀" "$n" || bad "index.html 캐러셀" "최신 글인데 없음"
  [ "$n2" -ge 1 ] && ok "index.html 위젯" "$n2" || bad "index.html 위젯" "최신 글인데 없음"
else
  ok "index.html 캐러셀/위젯" "캐러셀 $n · 위젯 $n2 (최신 글 아님 — 상한상 정상)"
fi
n=$(grep -c "/blog/$SLUG/" sitemap.xml); [ "$n" -ge 1 ] && ok "sitemap.xml" "$n" || bad "sitemap.xml" "없음"

# 상한 (4개 이상이면 그리드가 깨진다)
c=$(grep -c '<a class="shell-mag-card' index.html)
r=$(grep -c '<a class="shell-mag-row"' index.html)
[ "$c" -le 3 ] && ok "캐러셀 상한" "$c / 3" || bad "캐러셀 상한" "$c 개 — 3개까지만"
[ "$r" -le 5 ] && ok "위젯 상한" "$r / 5" || bad "위젯 상한" "$r 개 — 5개까지만"

# ── 7. 내부링크 (여기가 반복 누락 지점)
echo "[7] 내부링크"
mapfile -t linkers < <(grep -rl "/blog/$SLUG/" --include='*.html' . 2>/dev/null \
  | grep -v "^./blog/" | grep -v "^./index.html" | sed 's|^\./||')
if [ "${#linkers[@]}" -ge 1 ]; then
  ok "블로그 밖 내부링크" "${#linkers[@]}개 — ${linkers[*]}"
else
  bad "블로그 밖 내부링크" "0개 — 최소 1개 필요 (예: care/, ko/gift-finder/)"
fi

# ── 이력 (topic-pool.md, 다른 저장소)
echo "[이력] topic-pool"
if [ -n "$CARDNEWS" ]; then
  grep -q "$SLUG" "$CARDNEWS/topic-pool.md" \
    && ok "이미 다룬 주제 표" "$(basename "$CARDNEWS")/topic-pool.md" \
    || bad "이미 다룬 주제 표" "$SLUG 기록 없음 — 중복 추천 원인이 된다"
else
  warn "topic-pool.md" "저장소를 못 찾음 (형제 폴더에 없다)"
fi

# ── 채널 규격 3중 복제 대조
echo "[규격] 보드 ↔ stage3 원본"
if [ -n "$SHORTS" ]; then
  REF="$SHORTS/.claude/skills/techa-content-studio/references"
  chk() { # $1=수치  $2=stage3파일  $3=이름
    local inref inboard
    inref=$(grep -c -- "$1" "$REF/$2" 2>/dev/null || echo 0)
    inboard=$(grep -c -- "$1" "$REF/topic-board.html" 2>/dev/null || echo 0)
    if [ "$inref" -ge 1 ] && [ "$inboard" -ge 1 ]; then ok "$3" "$1 일치"
    else bad "$3" "$1 — stage3:$inref board:$inboard 불일치"; fi
  }
  chk "1,800~2,800" stage3-magazine.md "매거진 분량"
  chk "1,500~2,000" stage3-blog.md     "네이버 분량"
  chk "300~500"     stage3-threads.md  "스레드 분량"
else
  warn "stage3 원본" "techa-shorts 저장소를 못 찾음"
fi

# ── 배포
echo "[배포] 라이브 확인"
code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 "https://www.techa.kr/blog/$SLUG/" 2>/dev/null || echo 000)
[ "$code" = "200" ] && ok "라이브 페이지" "$code" || warn "라이브 페이지" "$code — 아직 배포 전일 수 있다"
curl -s --max-time 15 https://www.techa.kr/sitemap.xml 2>/dev/null | grep -q "/blog/$SLUG/" \
  && ok "라이브 sitemap" "포함됨" || warn "라이브 sitemap" "아직 미반영"

echo
if [ "$FAIL" -gt 0 ]; then
  echo "실패 $FAIL 건 — 위 ❌ 를 처리한 뒤 색인 요청하세요."; echo; exit 1
fi
echo "통과. 남은 건 손으로: 구글 서치콘솔 URL 검사 → 색인 생성 요청 / 네이버 서치어드바이저 수집 요청"
echo
