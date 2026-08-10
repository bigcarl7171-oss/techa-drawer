# 상품 사진 (assets/products/)

상황별 선물 큐레이션(`/ko/gift-finder/`) 결과 카드에 쓰는 상품 사진.

## 넣는 방법

파일 이름을 **제품 라인 id와 똑같이** 맞춰서 이 폴더에 넣고, 스크립트를 다시 돌리면 끝.

```
python scripts/build-products.py
```

`techa-products.json`의 `image` 필드가 자동으로 채워진다. 경로를 어딘가에 적어둘
필요 없고, xlsx에 칸을 추가할 필요도 없다. **파일명만 맞으면 된다.**

스크립트 마지막에 몇 개가 연결됐는지, 아직 없는 파일이 무엇인지 출력한다.
id와 안 맞는 파일이 있으면 오타로 보고 따로 경고해준다.

## 파일 규격

| 항목 | 값 |
|---|---|
| 파일명 | `{라인 id}.jpg` (예: `rose-hydrangea-bouquet.jpg`) |
| 확장자 | `.webp` > `.jpg` > `.png` 순으로 우선 적용 |
| 비율 | **1:1 정사각** (카드가 정사각 틀로 자름) |
| 권장 크기 | 800 x 800px |
| 용량 | 장당 150KB 이하 목표 |

정사각이 아니어도 깨지지는 않는다. CSS `object-fit: cover`로 가운데를 기준으로
잘라내지만, 상품이 화면 밖으로 밀릴 수 있으니 되도록 정사각으로 준비할 것.

## 라인 id 25개

```
rose-hydrangea-bouquet      장미수국 꽃다발
hydrangea-bouquet           수국 꽃다발
superior-rose               수페리어 장미
```

전체 목록은 `assets/data/techa-products.json`의 `lines[].id`를 보거나,
스크립트를 한 번 돌리면 "아직 없는 파일" 줄에 전부 찍힌다.

## 사진이 없을 때

`image`가 `null`이면 카드가 기존 카테고리 이모지 자리표시자를 그대로 보여준다.
사진이 하나도 없어도 페이지는 정상 동작하므로, **한 장씩 채워 넣어도 된다.**
