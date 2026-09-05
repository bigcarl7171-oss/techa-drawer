#!/usr/bin/env bash
# 네이버 검색 지형 측정 — 키워드마다 "그 화면을 어느 업계가 차지했는지"를 뽑는다.
#
# 왜 스크립트인가: 2026-09-05에 키워드 58개를 손으로 재서 지형도를 만들었는데
# (docs/serp-terrain-2026-09-05.md), 그 방식으로는 다음 달에 다시 못 잰다.
# 그리고 naver-ads-keyword-data-2026-08.md 가 이미 지적했듯 **1회성 조회로는
# 계절 곡선이 안 나온다** — 같은 키워드를 매달 다시 재서 시계열을 쌓아야 한다.
# 그래서 측정 자체를 재실행 가능하게 만든다.
#
# 무엇을 보는가 — 광고를 켜기 *전에* 적합도를 판정하기 위한 네 갈래:
#   ① 쇼핑 브랜드 필터에 꽃 브랜드가 있다      → 우리 시장. 쇼핑광고가 맞다
#   ② 쇼핑 브랜드 필터가 남의 업계로 차 있다   → 남의 시장. 켜면 CTR이 먼저 죽는다
#   ③ 브랜드 필터가 없다 (쇼핑은 있다)         → 저경쟁 롱테일. 저입찰로 싸게 산다
#   ④ 쇼핑 모듈 자체가 0 이다                  → 정보 탐색. 광고가 아니라 매거진이다
# 무드등에 90일 4,446,329원을 쓰고 나서야 ②라는 걸 알았다. 화면을 먼저 보면 미리 안다.
#
# 사용법:
#   scripts/serp-check.sh 키워드1 "키워드 2" …        # 인자로
#   scripts/serp-check.sh -f keywords.txt              # 한 줄에 하나씩 담긴 파일로
#   BRAND=테차 scripts/serp-check.sh -f kw.txt > out.tsv
#
# 환경변수:
#   BRAND       화면에서 찾을 브랜드명 (기본 테차)
#   SERP_SLEEP  요청 간 대기 초 (기본 2). 과하게 두드리지 않기 위한 것이니 줄이지 말 것
#   KEEP_HTML   1 이면 받은 HTML 을 남긴다 (기본은 임시폴더에 두고 지움)
#
# 출력: TSV — 키워드 / 페이지KB / 브랜드노출 / 쇼핑모듈 / 브랜드필터 / 지금광고중 / 판정
#   그대로 열어봐도 되고, 마크다운 표로 옮겨 원장에 붙여도 된다.
#   `지금광고중` 은 그 순간 쇼핑광고를 돌리고 있는 브랜드다 — **요일·시간대마다 달라진다.**
#   요일별 광고 판단을 하려면 같은 시각대에 며칠치를 재서 비교해야 한다
#   (docs/ad-daypart-2026-09.md 참고).
#
# ⚠️ 한계 — 결론을 어디까지 쓸 수 있는지가 여기서 정해진다:
#   · 비로그인 PC 통합검색 1회다. 개인화·지역·모바일·시간대에 따라 달라진다.
#   · 브랜드 필터의 정렬 기준을 네이버가 공개하지 않는다. **"있나 없나"까지만 믿을 것.**
#     순위 숫자를 절대적으로 읽으면 안 된다.
#   · 브랜드 필터 노출과 상품 개별 순위는 다른 지표다. 이 스크립트는 전자만 본다.
#   · 검색량은 재지 못한다. 볼륨은 네이버 검색광고 키워드도구로 따로 확인해야 한다.

set -uo pipefail

BRAND="${BRAND:-테차}"
SLEEP="${SERP_SLEEP:-2}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ── 키워드 모으기
KEYWORDS=()
if [ "${1:-}" = "-f" ]; then
  [ -f "${2:-}" ] || { echo "파일이 없다: ${2:-}" >&2; exit 2; }
  while IFS= read -r line; do
    line="${line#"${line%%[![:space:]]*}"}"      # 앞 공백 제거
    line="${line%"${line##*[![:space:]]}"}"      # 뒤 공백 제거
    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac        # # 로 시작하면 주석
    KEYWORDS+=("$line")
  done < "$2"
else
  KEYWORDS=("$@")
fi
[ ${#KEYWORDS[@]} -eq 0 ] && { sed -n '/^# 사용법:/,/^#$/p' "$0" | sed 's/^# \{0,2\}//'; exit 2; }

WORK="$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/serp-$$")"
mkdir -p "$WORK"
[ "${KEEP_HTML:-0}" = "1" ] || trap 'rm -rf "$WORK"' EXIT

# 한글은 반드시 직접 퍼센트 인코딩한다.
# curl --data-urlencode 는 Git Bash 로케일에 따라 빈 쿼리를 보내는 일이 있었다(2026-09-05 확인).
urlenc() { printf '%s' "$1" | od -An -tx1 | tr -d ' \n' | sed 's/\(..\)/%\1/g'; }

printf '# 측정: %s\n' "$(TZ='Asia/Seoul' date '+%Y-%m-%d(%a) %H:%M KST')"
printf '키워드\t페이지KB\t%s노출\t쇼핑모듈\t브랜드필터\t지금광고중\t판정\n' "$BRAND"

first=1
for kw in "${KEYWORDS[@]}"; do
  # 첫 요청은 기다리지 않는다
  [ $first -eq 1 ] && first=0 || sleep "$SLEEP"

  f="$WORK/$(printf '%s' "$kw" | tr -c 'A-Za-z0-9' '_').html"
  if ! curl -s --max-time 30 -A "$UA" -H "Accept-Language: ko-KR,ko;q=0.9" \
        "https://search.naver.com/search.naver?where=nexearch&ssc=tab.nx.all&query=$(urlenc "$kw")" \
        -o "$f"; then
    printf '%s\t-\t-\t-\t-\t요청 실패\n' "$kw"; continue
  fi

  kb=$(( $(wc -c < "$f") / 1024 ))
  if [ "$kb" -lt 20 ]; then
    printf '%s\t%s\t-\t-\t-\t응답이 비정상적으로 작다 — 차단 여부 확인\n' "$kw" "$kb"; continue
  fi

  hits=$(grep -c "$BRAND" "$f")
  # 쇼핑 영역은 두 종류다. 일반 쇼핑은 filterSet(브랜드 필터)을 쓰고,
  # 선물성 검색어에 붙는 "선물샵"은 sp_nshop_gift 라는 다른 모듈이다 — 둘 다 봐야 한다.
  # (2026-09-05: filterSet 만 보다가 `여자친구꽃선물` 을 정보탐색으로 잘못 판정했다)
  fs=$(grep -c 'filterSet' "$f")
  gift=$(grep -c 'sp_nshop_gift' "$f")
  shop=$(( fs + gift ))
  brands=$(grep -o '"filterSet":\[{"id":"brand".\{0,650\}' "$f" \
           | grep -o '"name":"[^"]*"' | sed 's/"name":"//; s/"$//' \
           | grep -v '^브랜드$' | head -8 | paste -sd' ' -)

  # 지금 쇼핑광고를 돌리고 있는 브랜드. 요일·시간대별로 누가 켜는지 보려고 넣었다
  # (2026-09-05 토요일에 손으로 재보니 테차와 배송 조건이 같은 프리저브드 업체들이
  #  주말에도 광고를 돌리고 있었다 — 그 관측을 재현 가능하게 만든 것).
  # ⚠️ 클래스명이 해시라 네이버가 마크업을 바꾸면 조용히 빈 값이 된다.
  #    빈 값이 곧 "광고 없음"은 아니니, 결과가 계속 비면 셀렉터부터 의심할 것.
  advertisers=$(grep -o '>[^<>]\{2,20\}</a><div class="[^"]*"><button[^>]*><span class="blind">광고' "$f" \
           | sed 's/^>//; s/<.*//' | sort | uniq -c | sort -rn \
           | awk '{printf "%s(%s) ",$2,$1}')

  # 판정 — 위 주석의 네 갈래. ①과 ②는 업계 판단이 필요해 사람이 봐야 한다.
  if [ "$shop" -eq 0 ]; then
    verdict="④ 정보탐색 — 매거진"
  elif [ -z "$brands" ]; then
    if [ "$gift" -gt 0 ]; then
      verdict="선물샵 모듈 — 브랜드 목록은 화면에서 확인"
    else
      verdict="③ 저경쟁 롱테일 — 저입찰"
    fi
  else
    verdict="①/② 브랜드필터 확인 필요 — 꽃 업계인가?"
  fi
  [ "$hits" -gt 0 ] && verdict="$verdict · $BRAND 노출됨"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$kw" "$kb" "$hits" "$shop" "${brands:--}" "${advertisers:--}" "$verdict"
done
