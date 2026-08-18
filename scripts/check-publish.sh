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
  chars=$(grep -o '<p>[^<]*' "blog/$SLUG/index.html" | wc -m)
  imgs=$(grep -c '<img ' "blog/$SLUG/index.html")
  ok "blog/$SLUG/index.html" "본문 약 ${chars}자 · 이미지 ${imgs}장"
  [ "$chars" -lt 1200 ] && warn "본문 분량" "약 ${chars}자 — 목표 1,200~1,800자"
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
  chk "1,200~1,800" stage3-magazine.md "매거진 분량"
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
