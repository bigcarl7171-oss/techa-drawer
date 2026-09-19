#!/usr/bin/env bash
# 매거진 발행 검증 — techa-publish 스킬 S1~S4(발행본·목록·메인·사이트맵·내부링크)를
# 기계적으로 확인한다. 분량 기준은 docs/channel-specs.md 에서 읽는다.
#
# 왜 스크립트인가: 절차 2·3·4번은 파일 위치가 고정돼 매번 지켜졌지만, 7번(내부링크)만
# "적당한 페이지를 찾아서"라 판단이 필요해 두 번 연속 누락됐다(2026-08-17, 08-18).
# 규칙 문장을 더 쓰는 대신, 안 지켜지면 실패하게 만든다.
#
# 사용법:  scripts/check-publish.sh <slug> --blog <스크래치폴더/blog.md>
#          scripts/check-publish.sh <slug> --no-blog      # 네이버판을 안 쓰는 글일 때만
#   예)    scripts/check-publish.sh flower-gift-better-than-photo --blog "C:/연습/x_원고/blog.md"

set -uo pipefail
SLUG="${1:-}"
[ -z "$SLUG" ] && { echo "사용법: $0 <slug> --blog <blog.md> | --no-blog"; exit 2; }
shift
BLOG=""; NO_BLOG=0
while [ $# -gt 0 ]; do
  case "$1" in
    --blog) BLOG="${2:-}"; shift 2 ;;
    --no-blog) NO_BLOG=1; shift ;;
    *) echo "알 수 없는 인자: $1"; exit 2 ;;
  esac
done

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

# 분량 기준은 docs/channel-specs.md 가 단일 출처다. 값이 바뀌면 그 파일만 고친다.
SPECS="docs/channel-specs.md"
mag_min=$(sed -n 's/^magazine_min=\([0-9]*\).*/\1/p' "$SPECS" 2>/dev/null)
mag_max=$(sed -n 's/^magazine_max=\([0-9]*\).*/\1/p' "$SPECS" 2>/dev/null)
[ -z "$mag_min" ] && mag_min=1500
[ -z "$mag_max" ] && mag_max=2800

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
  # 목표 분량은 docs/channel-specs.md 에서 읽는다 (위 SPECS). 공백을 뺀 문자 수.
  [ "$chars" -lt "$mag_min" ] && warn "본문 분량" "약 ${chars}자 — 목표 ${mag_min}~${mag_max}자"
  [ "$chars" -gt "$mag_max" ] && warn "본문 분량" "약 ${chars}자 — 목표 ${mag_min}~${mag_max}자"
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
  ok "들어오는 링크(블로그 밖 → 새 글)" "${#linkers[@]}개 — ${linkers[*]}"
else
  bad "들어오는 링크(블로그 밖 → 새 글)" "0개 — 최소 1개 필요 (예: care/, ko/gift-finder/)"
fi

# 나가는 링크 — 2026-09-19 추가.
# 위 검사만 있었더니 링크가 한 방향으로만 흘렀다: 발행할 때마다 도구 페이지가 매거진에
# 링크를 주기만 하고(도구→매거진 22건) 되받지는 못해(매거진→도구 0건), 도구 22개 중
# 15개가 사이트 안에서 피링크 1개짜리로 남았다. 그 15개는 구글 색인에도 거의 안 잡혀 있다.
out_links=$(grep -oE 'href="/(ko/[a-z-]+|care)/' "blog/$SLUG/index.html" 2>/dev/null | sort -u)
out_n=$(printf '%s' "$out_links" | grep -c . || true)
if [ "$out_n" -ge 1 ]; then
  ok "나가는 링크(새 글 → 도구/관리법)" "$out_n개 — $(printf '%s' "$out_links" | sed 's|href="||' | tr '\n' ' ')"
else
  bad "나가는 링크(새 글 → 도구/관리법)" "0개 — 본문에서 관련 도구 1곳으로 링크할 것 (예: /ko/birth-flower/, /ko/dday/, /care/)"
fi

# ── 중복: 매거진 ↔ 네이버 blog.md 문장 겹침
#
# 두 글은 범위는 같고 문장은 달라야 한다. 2026-09-16 사람이 완성해 온 블로그 원고 문장을
# 매거진에 거의 그대로 옮겨 발행한 사고(겹침 78%)가 있었다. 대조를 건너뛰면 실패로 본다.
echo "[중복] blog.md 문장 겹침"
if [ -n "$BLOG" ]; then
  if [ -f "$BLOG" ]; then
    out=$(node scripts/check-overlap.js "$SLUG" --blog "$BLOG" 2>&1); rc=$?
    pct=$(printf '%s' "$out" | grep -o '"containment": "[^"]*"' | grep -o '[0-9.]*%')
    cps=$(printf '%s' "$out" | grep -o '"copiedSentences": [0-9]*' | grep -o '[0-9]*$')
    if [ "$rc" = "0" ]; then ok "매거진↔blog.md" "겹침 ${pct} · 옮겨 온 문장 ${cps}개"
    else bad "매거진↔blog.md" "겹침 ${pct} · 옮겨 온 문장 ${cps}개 — 문장을 새로 써라 (node scripts/check-overlap.js $SLUG --blog …)"; fi
  else
    bad "매거진↔blog.md" "blog.md 가 없다: $BLOG"
  fi
elif [ "$NO_BLOG" = "1" ]; then
  warn "매거진↔blog.md" "--no-blog — 네이버판 없이 발행"
else
  bad "매거진↔blog.md" "대조 안 함 — --blog <스크래치/blog.md> 를 주거나, 네이버판이 없으면 --no-blog"
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

# ── 도구 허브 (ko/index.html)
#
# 허브는 정적 HTML 이고 도구 목록의 원본은 assets/js/site.js 의 APPS 배열이다. 도구를
# 추가하고 허브를 안 고치면 그 페이지는 다시 고아가 된다 — 색인이 안 잡히던 원인이
# 정확히 이거였다(2026-09-08). 두 목록이 어긋나면 여기서 잡는다.
echo "[허브] 도구 목록 동기화"
if [ -f ko/index.html ] && [ -f assets/js/site.js ]; then
  apps=$(grep -o 'path: "/ko/[a-z-]*/"' assets/js/site.js | sed 's|.*/ko/||;s|/"||' | sort -u)
  hub=$(grep -o 'href="/ko/[a-z-]*/"' ko/index.html | sed 's|.*/ko/||;s|/"||' | sort -u)
  missing=$(comm -23 <(echo "$apps") <(echo "$hub"))
  if [ -z "$missing" ]; then
    ok "도구 허브" "$(echo "$hub" | grep -c .)개 전부 링크됨"
  else
    bad "도구 허브" "ko/index.html 에 빠진 도구: $(echo $missing) — 추가해야 색인된다"
  fi
else
  warn "도구 허브" "ko/index.html 또는 site.js 를 못 찾음"
fi

# ── 정적 링크 (홈 도구 표 · 관련 도구) — 2026-09-19 추가
#
# 위 허브 검사와 같은 종류의 사고를 두 곳에서 더 발견했다. 홈의 도구 표와 도구 페이지
# 하단의 "관련 도구"는 둘 다 site.js 가 브라우저에서 그리고 있어서 HTML 소스에는
# 주소가 없었다 — 홈에 도구 22개 중 7개만, 관련 도구는 0개. 이제 스크립트가 HTML로
# 구워 넣고, site.js 를 고친 뒤 안 돌리면 여기서 잡는다.
echo "[정적] 목록이 HTML에 구워졌는가"
for b in build-home-tools build-home-curation build-tool-hub build-chrome build-related build-posts build-blog-products build-tool-products; do
  if [ -f "scripts/$b.js" ]; then
    out=$(node "scripts/$b.js" --check 2>&1) \
      && ok "$b" "$(echo "$out" | tail -1 | sed 's/^[✅ ]*//')" \
      || bad "$b" "$(echo "$out" | tail -1 | sed 's/^[❌ ]*//')"
  else
    warn "$b" "스크립트를 못 찾음"
  fi
done

# 홈 큐레이션은 달이 바뀌면 사람 검토 없이 자동 배포된다. 12월 구성이 깨져 있어도
# 12월 1일 새벽에야 알게 되므로, 데이터를 고친 시점에 12개월치를 전부 빌드해 본다.
echo "[정적] 홈 큐레이션 12개월이 전부 빌드되는가"
if [ -f scripts/build-home-curation.js ]; then
  out=$(node scripts/build-home-curation.js --verify-all 2>&1) \
    && ok "큐레이션 12개월" "$(echo "$out" | tail -1 | sed 's/^[✅ ]*//')" \
    || bad "큐레이션 12개월" "$(echo "$out" | tail -1)"
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
