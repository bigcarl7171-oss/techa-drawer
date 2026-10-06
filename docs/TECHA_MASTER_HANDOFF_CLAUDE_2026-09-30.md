# TECHA MASTER HANDOFF — Claude / AI 협업용

> 이 문서는 techa-drawer와 techa-tea-platform 두 저장소의 `docs/`에 **같은 내용으로** 있다. 한쪽을 고치면 다른 쪽에도 그대로 복사한다. 2026-10-06에 두 사본이 갈라져 있던 것을 합쳤다.

작성 기준일: 2026-09-30  
우선순위: **꽃과 차는 동일한 비중의 TECHA 핵심 사업**  
이 문서는 Claude·ChatGPT 등 다른 AI가 프로젝트를 이어받을 때 가장 먼저 읽어야 하는 최상위 핸드오프다.

---

## 0. 가장 중요한 한 문장

**TECHA는 꽃 사업을 차 사업으로 바꾸는 프로젝트가 아니다.**

- 꽃은 현재의 매출·고객·상품·공방·제작 역량을 가진 핵심 사업이다.
- 차는 장기적으로 데이터·콘텐츠·커뮤니티·경험을 쌓아가는 또 하나의 핵심 사업이다.
- 둘 중 하나를 부사업으로 취급하지 않는다.
- 단, **검색·브랜드 첫인상은 당분간 꽃공방이 먼저**다 (2026-10-06, 1장 「검색·브랜드 노출 우선순위」).
- 단, 두 사업의 **시간축과 운영 방식은 다르다.**
  - 꽃: 현재 매출과 고객경험을 계속 개선해야 한다.
  - 차: 성급한 판매보다 데이터와 신뢰를 먼저 쌓아야 한다.

AI가 현재 차 저장소에서 작업 중이라는 이유로 TECHA 전체를 “차 프로젝트”로 좁게 해석하면 안 된다.

---

# 1. 브랜드 구조

## TECHA 모브랜드

TECHA는 꽃과 차를 함께 품는 생활문화 브랜드다.

### 꽃 축
- 브랜드/사업: **테차 꽃공방 / TECHA Flower**
- 표기 규칙 (2026-10-04 확정): 한글 「테차 꽃공방」, 영문 「TECHA Flower」 (TECHA 대문자 + Flower), 아이디·주소는 소문자 `techa_flower`·`techa.kr`. 차는 「TECHA Tea」, 모브랜드는 「TECHA」. 네이버 플레이스·구글 비즈니스 프로필 이름은 「테차 꽃공방」(사업자 상호 「테차」와 달라도 됨 — 상호는 사이트 스키마 legalName 에 둔다)
- 브랜드 허브: **https://www.techa.kr**
- 핵심 판매채널: 네이버 스마트스토어
- 보조 채널: 자사몰/아이디어스/오늘의집/인스타그램/유튜브 쇼츠 등
- 오프라인: 고양시 덕양구 화정역·덕양구청 인근 쇼룸/공방
- 주요 수익: 꽃 상품 판매, 맞춤·단체 주문, 기업/기관 납품, 클래스, 향후 공간 스타일링·구독형 관리

### 차 축
- 사이트: **https://techa.co.kr**
- 역할: 차 지식·데이터·문화 플랫폼
- 커뮤니티: **풍류와 차 | by TECHA** 네이버카페
- 장기 확장: 직접 시음, 소규모 클래스, 큐레이션, 선택적 커머스, 산지 여행
- 차는 초기부터 대형 쇼핑몰로 만들지 않는다.

### 중요한 분리 원칙
- techa.kr = 꽃 브랜드 허브/콘텐츠/도구/구매 연결
- techa.co.kr = 차 지식·문화·데이터 플랫폼
- 꽃 판매와 차 정보는 TECHA 아래에서 연결되지만 사이트 역할은 분명히 구분한다.

### 검색·브랜드 노출 우선순위 — 현재 단계 (2026-10-06 사장님 확정)
사업 비중은 위 0장처럼 꽃과 차가 같다. 다만 **검색과 사람의 첫인상에서는 당분간 "테차 = 꽃공방"을 먼저 세운다.** 차 사이트가 충분히 자라면 그때 이 항목을 다시 정한다.

- `테차`·`TECHA`·`techa`·`테차꽃공방`·`techaflower` 검색 → **www.techa.kr(테차 꽃공방)** 으로 모은다.
- techa.co.kr은 **`TECHA Tea`(테차티·techatea)** 로만 부른다. 화면 표시명, 페이지 제목(`| TECHA Tea`), 구조화 데이터 이름 모두 해당한다. 단독 `TECHA`·`테차`를 차 사이트 이름이나 alternateName으로 쓰지 않는다.
- 구조화 데이터의 기준은 이렇다. 모브랜드 Organization `TECHA`의 @id는 `https://www.techa.kr/#organization`(techa-drawer `scripts/build-chrome.js`)이다. 차 사이트 Organization `TECHA Tea`는 `parentOrganization`으로 이 @id를 가리킨다(techa-tea-platform `app/layout.tsx`). 차 사이트에서 techa.kr을 `sameAs`로 두지 않는다. 같은 회사라는 뜻이 되어 틀린 정보다.
- 차 사이트에서 꽃 쪽으로 가는 링크 이름은 「테차 꽃공방」으로 통일한다.
- 사람에게 보이는 문장도 같은 방향으로 쓴다. 꽃 사이트 푸터는 "테차(TECHA)는 고양시 덕양구 … 꽃공방 브랜드", 차 사이트 푸터는 "TECHA Tea는 … 테차 꽃공방이 함께 운영하는 차 공간"이다.
- AI 검색용 브랜드 요약은 `https://www.techa.kr/llms.txt`(techa-drawer 루트)다. 주소·전화·채널 같은 업체 정보의 원본은 `scripts/build-chrome.js`의 `BUSINESS`다. 그쪽을 고치면 llms.txt도 같이 고친다.
- 남은 외부 작업(사람): Bing Webmaster Tools에 두 사이트 등록, 네이버 서치어드바이저 techa.kr 사이트맵 재제출과 홈·소개 수집 요청.

---

# 2. 최상위 경영 원칙 — 소탐대실 금지

모든 신규 기능·제휴·광고·상품·사이트 변경은 아래 질문을 먼저 통과해야 한다.

> 단기 매출이나 편의를 위해 장기 브랜드 신뢰·데이터 품질·고객경험을 잃는가?

그렇다면 하지 않는다.

공통 레드라인:
- 사실을 과장하지 않는다.
- 없는 고객 반응·성과·효과를 만들지 않는다.
- 단기 광고수익 때문에 사이트 가독성을 망치지 않는다.
- 꽃 사업의 현금흐름을 해치면서 차 재고를 쌓지 않는다.
- 차 판매를 위해 차 평가를 좋게 만들지 않는다.
- 전설을 역사적 사실처럼 쓰지 않는다.
- 건강효능을 마케팅 문구로 단정하지 않는다.
- 사용자 반응이 없는데 큰 시스템부터 만들지 않는다.

---

# 3. 두 사업의 동일 비중을 실제 운영에 적용하는 방법

“동일 비중”은 매주 정확히 50:50 시간을 쓰라는 뜻이 아니다.

## 꽃
현재 사업을 지키고 성장시키는 축이다.

핵심 질문:
- 주문이 더 잘 일어나는가?
- 객단가가 올라가는가?
- 비수기 매출원이 늘어나는가?
- 스마트스토어 전환이 좋아지는가?
- B2B·단체·공간 스타일링·구독이 커지는가?
- 상세페이지·사진·고객응대가 신뢰를 높이는가?

## 차
장기 자산을 만드는 축이다.

핵심 질문:
- 검증 가능한 데이터가 누적되는가?
- 반복 방문할 이유가 생기는가?
- 검색할 가치가 있는 차 DB가 만들어지는가?
- 전설·역사·산지·제품 정보를 구분하고 있는가?
- 나중에 시음·커머스·여행으로 확장할 기반이 생기는가?

## 권장 작업 리듬
한쪽만 장기간 계속 진행하지 않는다.

예:
1. 차 데이터 배치 1회
2. 꽃 사이트/상품/콘텐츠/매출 개선 배치 1회
3. 다시 차 데이터 심화

사용자가 특정 시점에 한쪽을 우선하라고 하면 그 요청을 따르되, 전체 전략에서는 두 축을 동일하게 중요하게 본다.

---

# 4. 꽃 사업 현황

## 사업 기본
- 법인: 테차(TECHA)
- 설립: 2021-06-22
- 주력: 프리저브드플라워, 비누꽃, 실크플라워
- 상품: 꽃다발, 무드등/유리돔, 용돈상품, 인테리어 소품, 시즌 선물, 클래스
- 핵심 고객: 20대 중반~50대 선물 구매자 + 기업/기관/단체
- 스마트스토어 중심 월매출: 대략 1,000만~1,200만원 수준
- 단기 목표: 1,500만원 → 2,000만원
- 목표 객단가: 약 45,000원 → 55,000원

수치는 경영 참고값이며, 외부 공개문구에 자동 사용하지 않는다.

## 브랜드 표현
자주 사용해 온 핵심 방향:
- “시들지 않는 꽃”
- “변치 않는 선물 당신의 꽃가게”
- “꽃으로 채우는 당신의 순간”

단, 실제 페이지에서는 문구를 과도하게 반복하지 않는다.

## 공방/오프라인
- 고양 덕양구청·화정역 인근
- 방문수령
- 현장구매
- 소규모 클래스
- 포토존/쇼룸
- 맞춤제작 및 기업/단체 대응

## B2B
실제 납품 경험이 있으며 다음 영역을 강화한다.
- 기업 행사
- 시상식
- 퇴임
- 창립기념
- 송년회
- 학교/유치원 행사
- 공공기관/지원센터
- 군부대
- 단체 선물

핵심 메시지:
**핸드메이드이지만 비교적 빠른 시간 안에 대량 제작 대응이 가능하다.**

---

# 5. 꽃 사이트 techa.kr 전략

techa.kr의 가장 중요한 목적은 “사이트 자체 매출”보다 아래다.

1. TECHA 꽃 브랜드 인지도
2. 스마트스토어 구매 전환
3. B2B·공간 스타일링·구독·클래스 신뢰 형성
4. 매거진과 도구를 통한 검색/재방문 자산

## 현재 중요한 원칙
- 스마트스토어 직접 주소를 코드에 난립시키지 않고 관리되는 마케팅 링크를 사용한다.
- “온라인 주문을 통해” 같은 표현을 사용하되 오프라인 공방 판매도 병행한다.
- 상품 판매 CTA만 과도하게 반복하지 않는다.
- 매거진·공간 스타일링·선물 메시지·기업단체주문도 함께 키운다.
- 모바일에서 메뉴가 너무 많거나 스크롤이 과도하지 않게 한다.
- 기존 도구는 없애지 않는다. 약 23개 도구는 접힘 구조 등으로 유지 가능하다.
- **선물 추천 기능은 핵심 기능**으로 유지한다.
- 후기 숫자는 계속 변하므로 “리뷰 2천개” 같은 고정 정량표기는 사이트 핵심 신뢰 문구로 과도하게 쓰지 않는다.
- 필요하면 “리뷰가 꾸준히 쌓이는 브랜드”처럼 정성적으로 표현한다.

## 비수기 매출 확장
상품 판매 외에 다음을 중요하게 본다.
- 기업/단체주문
- 공간 스타일링
- 매장·쇼룸·오피스 꽃 연출
- 정기 교체/유지관리
- 꽃다발/공간 구독
- 클래스
- 맞춤 제작

---

# 6. 꽃 상품/콘텐츠의 제작 원칙

## 이미지
- 원본 상품의 꽃 형태·개수·색상을 함부로 바꾸지 않는다.
- 스톡 느낌과 과도한 AI 연출을 피한다.
- 실제 공방 촬영 같은 자연스러운 사진을 선호한다.
- 배경: 아이보리/웜그레이/크림/베이지 계열
- LED 상품은 조명만 따뜻하게.
- 얼굴을 억지로 숨겨 부자연스럽게 만들지 않는다.
- 인물이 필요하면 연령·직업·생활환경을 다양하게 하고 AI 특유의 반복 인상을 피한다.
- 카메라는 지나치게 제품 가까이 붙이지 않고 배경 여유를 준다.

## 상세페이지
핵심은 과장보다 재료·균형·디자인 이유를 설명하는 것.
- 꽃의 결
- 색 균형
- 포장 비례
- 소재 조화
- 플로리스트의 큐레이션

프리저브드/비누꽃/조화가 섞인 경우 소재를 숨기지 않는다.

## 고객응대
- 고객 후기 답변에는 **이모지 사용 금지**
- 정중하지만 지나치게 장황하지 않게
- 입력된 사실만 사용
- 배송·재고·효과·반응을 창작하지 않는다.

---

# 7. 차 사업의 최상위 포지션

TECHA Tea의 핵심은:

> **차를 사기 전에 찾아보는 곳**
>
> 겉은 쉽고 따뜻하게, 속은 깊고 정확하게.

초기 목표는 차를 빨리 판매하는 것이 아니다.

순서:
**검증 데이터 → 쉬운 콘텐츠 → 신뢰 → 반복 방문 → 직접 시음 → 구매 연결 → 선택적 커머스 → 커뮤니티 → 클래스 → 산지여행**

수익 때문에 이 순서를 뒤집지 않는다.

---

# 8. 차 데이터/편집 원칙

## 데이터 워크플로우
RAW → candidate → review → VERIFIED → EDITED → PUBLISHED

## 검증 레벨
- L1: 권위 있는 1차/공식 출처 1개
- L2: 독립된 두 번째 출처로 교차검증
- L3: 복수 독립 근거/공식표준+연구 등 높은 합의

핵심 공개 사실은 L2 이상을 목표로 한다.

## Evidence Pack
글부터 쓰지 않는다.

질문 → 사실 주장 → 출처 → 교차검증 → 쉬운 한국어 → 공개

전설·역사·시장통설·건강정보·생산자 자기서술은 서로 같은 증거로 취급하지 않는다.

## 절대 금지
- 전설을 역사로 단정
- 판매자 설명 하나를 일반 사실로 확대
- 등급을 품질순위로 자동 번역
- 보이차의 연도=품질점수
- 명산명채 이름=등급
- 지역명=저장방식
- 건강연구=효능 보장

---

# 9. 차 데이터 구성 방향

사용자 결정:
- 청차 약 5%
- 황차 약 5%
- 나머지는 기존 핵심 축
- **장기적으로 보이차와 홍차의 비율이 가장 커진다.**

이 비율은 강제 쿼터가 아니라 수집 우선순위다.

## 중국차 1차 마무리
청차:
- 대홍포
- 철관음
- 봉황단총
- 동방미인
- 동정오룡
- 무이육계
- 무이수선

황차:
- 군산은침
- 몽정황아
- 곽산황아

흑차 비교축:
- 육보차

육보차를 넣는 이유:
**“흑차=보이차”라는 단순화를 피하고, 흑차 안에서 보이차의 위치와 생차/숙차 분류 논점을 자연스럽게 설명하기 위해서다.**

## 일본
종류를 무한히 늘리지 않는다.
핵심:
- 센차
- 옥로
- 텐차/말차
- 호지차
- 현미차
- 우지
- 시즈오카
- 가고시마

## 인도
핵심:
- 다즐링
- 아쌈
- 닐기리
- 시킴

## 스리랑카
핵심:
- 우바
- 누와라엘리야
- 딤불라
- 루후나
- 사바라가무와

전체 지역을 균등하게 채우는 것이 아니라 **인지도·검색성·이야기·대표성·공식자료 확보 가능성**을 우선한다.

---

# 10. 보이차 심화 전략

보이차는 TECHA의 장기 핵심 데이터 자산 중 하나다.

데이터 연결 순서:

**산지 → 품종/원료 → 차창/생산자 → 레시피 → 생산연도 → 배치 → 저장 이력**

## 이미 중요하게 잡은 산지/명채
- 이우
- 노반장
- 빙도
- 시구이
- 징마이산
- 난눠산
- 부랑산
- 멍쿠

중요:
이 이름들은 같은 행정단위가 아니다.
진/향/촌/자연촌/산/문화경관/제품명이 섞여 있다.
사이트에서 “유명 산지”로 한 줄에 놓더라도 DB에서는 단위를 분리한다.

## 품종/원료
- 멍쿠대엽종차 등
- 품종·GI·마을 원료를 같은 뜻으로 합치지 않는다.

## 차창/레시피
핵심:
- 멍하이차창
- 대익
- 7542
- 7572
- 8582
- 8592
- 7262

7542/7572는 이미 1975년 개발 이력을 교차검증했다.

## 배치
7542 2301처럼:
- recipe_code = 7542
- batch_code = 2301
- production_year = 별도 필드

배치코드 숫자의 각 자릿수 의미는 **공식 근거 확보 전 추정하지 않는다.**

## 저장
저장지역명보다 실제 환경을 우선한다.

기록:
- 저장 시작/종료
- 국가/도시/장소
- 온도
- 상대습도
- 수분활성
- 용기
- 포장
- 통풍
- 빛
- 이취 관리
- 소유/이동 이력

“쿤밍=건창, 홍콩=습창”처럼 자동 분류하지 않는다.

---

# 11. 차 데이터 현재 완료 상태

## 완료/병합
2026-10-01 기준 다음 데이터 배치는 main에 병합됨.

- PR #47: 중국차 핵심 마무리
- PR #48: 일본 핵심차
- PR #49: 인도·스리랑카 핵심 산지
- PR #50: 보이차 산지·레시피 심화 1차
- PR #51: 보이차 배치·저장 이력 심화 2차
- PR #53: 보이차 제품 연감·별칭·방위표/내비·복각/진위 근거 심화 3차
- PR #55: 홍차 제품 라벨 관계 구조 v0.12 — 기문·정산소종·다즐링
- PR #56: 다즐링 87개 다원 source-scoped registry v0.13
- PR #58: 다즐링 87개 공식 명칭 전수 교차대조 v0.14
- PR #59: 대표 다원 4곳 현재 운영·제품 근거 및 entity 승격 v0.15
- PR #61: 대표 다원 6곳 추가 승격·인증/생산자/리테일 근거 분리 v0.16
- PR #63: 다즐링 추적번호 체계 분리 v0.17
- PR #64: Ging·Happy Valley·Okayti·Sungma·Singbulli·Tumsong 추가 승격 v0.18
- PR #65: Assam Orthodox·Nilgiri Orthodox GI/license 관계 모델 v0.19
- PR #67: Assam·Nilgiri Orthodox 라이선스 lifecycle·Schedule III v0.20
- PR #68: Assam 대표 다원 Mangalam·Meleng·Halmari 2026 product evidence v0.21
- PR #69: Nilgiri 대표 다원·winter/quality-season descriptor v0.22
- PR #70: Sikkim·Temi 4개 flush·다류 제품 구조 v0.23
- PR #72: Assam·Nilgiri User License holder context 분리 v0.24
- PR #73: Darjeeling current CoO traceability·2026 sourcing policy v0.25
- PR #74: Sri Lanka 7개 regional certification mark·Lion Logo 구조 v0.26
- PR #76: Sri Lanka 7개 지역 License Number·Authorized User governance 교차검증 v0.27
- PR #77: Nuwara Eliya Annex II 18개 registry·Labookellie/Pedro/Somerset current evidence v0.28
- PR #79: Dimbula·Ruhuna·Sabaragamuwa Annex II 468개 registry 확장 v0.29
- PR #80: Sri Lanka 대표 estate/factory 5곳 current evidence 승격 v0.30
- PR #82: Sri Lanka 7개 지역 Annex II 전체 669행 registry 완성·충돌 audit v0.31
- PR #83: Uva·Kandy·Uda Pussellawa 대표 current estate/factory 3곳 승격 v0.32
- PR #85: Sri Lanka Lion Logo named-holder evidence·MF0041/MF0620 conflict recheck v0.33
- PR #86: Darjeeling retailer CTM holder-context·2026 EX/DJ invoice traces v0.34
- PR #88: Darjeeling CoO Form C·CTM/Exporter/Invoice 관계 모델 v0.35
- PR #89: Darjeeling auction Invoice·Mark·Grade field semantics v0.36
- main direct data batches v0.37~v0.46: 세계 홍차 산지 확장 → 중국 홍차 GI/표준 → 보이차 산지 계층·보호명칭 → 7542/7572 → 빙도·이우·부랑산 → 하관 8653
- PR #91: Darjeeling current broker primary path·CTM legal-holder candidate narrowing v0.47

Evidence Pack:
- EP-0001~EP-0016: 기존 공개/검증 축
- EP-0017~EP-0090: 확장 연구팩
- 새로 추가된 팩은 대부분 **research 상태**로 유지
- 연구팩을 자동으로 공개 문구로 승격시키지 않는다.

## 현재 차 디자인/문구 우선순위
사용자 결정:
**당분간 디자인보다 데이터 확보가 1순위.**

현재 Preview 디자인은 많은 수정이 필요하지만,
데이터 구조가 충분히 쌓이기 전 대규모 디자인 재작업을 우선하지 않는다.

문구도 지금은 최종 확정단계가 아니다.

---

# 12. 보이차 연감 v0.11 완료 상태

기존 WIP 브랜치 **data/puer-chronicle-v0.11** 작업은 완료됐다.

완료 내용:
- 8582·8592·7262 사실후보
- 7542 역사 별칭의 출처별 병렬 보존과 conflict 정책
- 대익 방위표/내비 버전 이력
- 2010·2013·2020 방위체계 교차사용 사례
- 복각판과 원판 분리
- 단일 포장·방위표로 진위 확정 금지
- `data/puer-product-chronicle-schema-v1.0.json`
- `data/puer-product-chronicle-seeds-v0.11.json`
- `data/fact-candidates-v0.11.csv`
- EP-0042~EP-0045

PR #53은 CI 전체 통과 후 main에 병합됐다.

다음 단계부터는 이 브랜치를 재개하지 말고 **main을 기준으로 새 브랜치**를 만든다.

## 차 데이터 심화 v0.12~v0.47 완료 상태

2026-10-01 추가 완료:
- `data/black-tea-label-schema-v1.0.json`
- `data/black-tea-product-relations-v0.12.json`
- 기문공부·기홍향라·기홍모봉·기홍금침 제품형 분리
- 무이홍차·정산소종·소종홍차·연소종 관계 분리
- 다즐링의 다원·플러시·잎등급·GI·CoO·Garden Invoice 필드 분리
- `data/darjeeling-estate-registry-seeds-v0.13.json`: Tea Board 기존 Schedule 87개를 DJE001~DJE087 source-scoped 보존
- `data/darjeeling-estate-registry-seeds-v0.14.json`: 현재 Tea Board 사이트 제공 Schedule IV와 87개 전수 교차대조
- v0.14 결과: 의미상 86개 일치, formatting variant 4건, substantive source conflict 1건
- unresolved conflict: DJE026 `Jungpana (Jungpana Upper)` ↔ `Jungpana(Jungpapa Upper)`; 임의 오타 수정 금지
- `data/darjeeling-estate-current-evidence-v0.15.json`
- 최근 운영·제품 근거가 확보된 4개 다원을 global candidate entity로 승격:
  - B054 Castleton
  - B055 Margaret's Hope
  - B056 Glenburn
  - B057 Makaibari
- 실제 product relation 사례:
  - Margaret's Hope 2026 → First Flush/Spring → FTGFOP1
  - Castleton 2025 → First Flush/Spring → FTGFOP1(Moonlight)/Whole leaf
  - Glenburn 2026 → First Flush / Second Flush 별도 record
  - Makaibari Spring Time Bloom → First Flush, production year는 미표기라 null
- EP-0046~EP-0051
- `data/darjeeling-estate-current-evidence-v0.16.json`
- 추가 승격 6개 다원:
  - B058 Badamtam
  - B059 Barnesbeg
  - B060 Thurbo
  - B061 Goomtee
  - B062 Gopaldhara
  - B063 Arya
- 현재 candidate estate 총 10개
- IMO Control 2025-10-09 active operator list에서 2026까지 유효한 개별 organic certification 확인:
  - Badamtam → 2026-07-11
  - Barnesbeg → 2026-07-26
  - Goomtee → 2026-07-16
  - Arya → 2026-09-06
- organic certification은 Darjeeling GI license/CoO와 분리
- Badamtam Spring Moonlight 판매 페이지는 title=2026 / body=2025 충돌 → production_year=null + conflict 보존
- Thurbo 2026 First Flush black tea / whole leaf 실제 제품 관계 추가
- Gopaldhara 2026 First Flush·Second Flush를 별도 product record로 추가
- Arya 2026 EX-31 및 EX 40/2026 리테일 traceability 사례 추가
- 리테일 EX/Invoice 표기는 primary Garden Invoice 원문 확보 전 공식 Garden Invoice로 승격 금지
- EP-0052
- v0.17:
  - `data/darjeeling-traceability-schema-v1.0.json`
  - `data/darjeeling-traceability-seeds-v0.17.json`
  - Tea Board garden registration reference / Darjeeling GI·CTM license / CoO / Garden Invoice / auction lot / EX label을 별도 식별자 층으로 분리
  - 승격 10개 다원 중 과거 Tea Board TB_Reg_No 8개 source-scoped seed 확보
  - 과거 TB_Reg_No는 현재 GI license로 해석 금지
  - EP-0053
- v0.18:
  - `data/darjeeling-estate-current-evidence-v0.18.json`
  - `data/darjeeling-traceability-seeds-v0.18.json`
  - 추가 승격: B064 Ging, B065 Happy Valley, B066 Okayti, B067 Sungma, B068 Singbulli, B069 Tumsong
  - 현재 candidate estate 총 16개
  - Ging·Happy Valley·Tumsong 등은 official/certification + producer cross-check로 L2 후보 확보
  - Sungma 2026 First Flush: 2026-02-23 harvest, FTGFOP1 FLOWERY
  - Sungma 2026 Second Flush Green: 2026-06-03 harvest, FTGFOP Green
  - Sungma historical identifier conflict: 1189/1190 (SUNGMA & TURZUM TE) ↔ 2589 (SUNGMA TEA ESTATE)
  - Singbulli/Singbuli source spelling 차이는 alias로 보존
  - EP-0054
- v0.19:
  - `data/india-black-tea-gi-relations-v0.19.json`
  - B070 Assam Orthodox Tea
  - B071 Assam Orthodox Logo
  - B072 Nilgiri Orthodox Tea
  - B073 Nilgiri Orthodox Logo
  - Assam·Nilgiri region 전체와 Orthodox protected identity 분리
  - 두 산지 모두 Orthodox와 CTC가 생산됨을 별도 process relation으로 유지
  - IP India Assam application 115 exact title은 `Assam (Orthodox) Logo`, application 118은 115에 merged
  - IP India Nilgiri application 116은 `Nilgiri (Orthodox)` Registered, application 117 Logo는 116에 merged
  - Tea Board current product taxonomy도 Assam/Assam Orthodox, Nilgiri/Nilgiri Orthodox를 별도 항목으로 구분
  - EP-0055
- v0.20:
  - `data/india-orthodox-license-schema-v1.0.json`
  - `data/assam-orthodox-schedule-iii-seeds-v0.20.json`: Assam Orthodox Schedule III 241개 source-scoped registry
  - `data/nilgiri-orthodox-schedule-iii-seeds-v0.20.json`: Nilgiri Orthodox Schedule III 51개 source-scoped registry
  - Schedule IV는 licensee 명단이 아니라 Authorized User가 체결하는 blank License Agreement template임을 확인
  - Form I → Schedule IV 계약 → Schedule V 사용료 → User License Number → Schedule VI 연차보고 lifecycle 분리
  - IP India GI application / Certification Mark application / Tea Board User License Number를 별도 식별자로 유지
  - Schedule III 존재는 현재 운영·현재 license 보유를 자동 증명하지 않음
  - EP-0056
- v0.21:
  - `data/assam-estate-current-evidence-v0.21.json`
  - B074 Mangalam, B075 Meleng, B076 Halmari candidate estate 승격
  - Mangalam 2026 Second Flush P126/Betjan 제품을 cultivar·grade·harvest date로 분리
  - Meleng 2026 First/Second Flush 및 product-level wither·oxidation·drying parameters 연결
  - Halmari 2026 Second Flush current producer collection/product 연결
  - retailer CTM/User License 표기는 판매자·packer holder context로 유지하고 estate 번호로 추정 금지
  - Mangalam First Flush 페이지 내부 Single Estate ↔ multiple-estate copy 충돌 보존
  - EP-0057
- v0.22:
  - `data/nilgiri-estate-season-evidence-v0.22.json`
  - B077 Chamraj, B078 Korakundah, B079 Glendale, B080 Kairbetta candidate estate 승격
  - Tea Board 공식 baseline은 Nilgiri 연중 채엽
  - UPASI의 winter quality는 slow-growth quality context로 저장
  - Quality Season / Winter Flush / Winter Frost는 product/source-specific season descriptor로 저장하고 법정 등급으로 통합 금지
  - Glendale 2026 Jan Quality Season lot와 Mar Winter Flush batch를 별도 product record로 보존
  - EP-0058
- v0.23:
  - `data/sikkim-temi-evidence-v0.23.json`
  - B081 Temi Tea Estate candidate 승격
  - Sikkim/Temi 4개 계절축: Spring/First, Summer/Second, Monsoon/Third, Autumn/Final
  - Sikkim은 black뿐 아니라 green·white·oolong도 생산 → tea type과 flush 분리
  - Sikkim 정부 2026 자료로 Temi current operation 교차확인
  - Temi current First Pluck·Second Pluck는 수확연도 미표기 → production_year=null
  - 2008 organic certification history는 current certificate number/validity와 분리
  - Bermiok은 current evidence 확보 전 source-scoped 유지
  - EP-0059
- v0.24:
  - `data/india-orthodox-license-schema-v1.1.json`
  - `data/india-orthodox-license-holder-evidence-v0.24.json`
  - Assam/Nilgiri User License Number를 source estate와 분리해 Authorized User holder-context로 관리
  - Teabox self-disclosure: Assam `AS/116/18032015/E`, Nilgiri `NG/002/27042015/E`
  - VAHDAM page context: Assam `AS/144/22062016/PKT`, legal holder unresolved
  - 현재 공개 웹에서 Tea Board Authorized User roster direct match는 확보하지 못함
  - seller self-disclosure는 official register match보다 낮은 근거층으로 유지
  - retailer/packer CTM 번호를 Halmari·Glendale 등 source estate에 자동 배정 금지
  - EP-0060
- v0.25:
  - `data/darjeeling-coo-traceability-v0.25.json`
  - 현재 Tea Board DarjeelingTea portal의 trace 구조: CoO number → authorized-stakeholder invoice number → garden-invoice detail context
  - CoO는 export-consignment traceability이며 CTM license·garden registration과 분리
  - 2026-08-24 Tea Board 공지:
    - Discontinuation of Generation of COOs without sourcing data
    - Submission of Undertaking regarding sourcing of green leaf within Darjeeling GI
  - 공지 본문 미확보 상태에서는 제목이 보장하는 범위만 정책 이벤트로 저장
  - 실제 individual CoO sample은 확보 전 null; 가짜 예시 번호 생성 금지
  - EP-0061
- v0.26:
  - `data/srilanka-regional-certification-relations-v0.26.json`
  - B082 Nuwara Eliya Certification Mark
  - B083 Uda Pussellawa Certification Mark
  - B084 Dimbula Certification Mark
  - B085 Uva Certification Mark
  - B086 Kandy Certification Mark
  - B087 Ruhuna Certification Mark
  - B088 Sabaragamuwa Certification Mark
  - B089 Ceylon Tea Lion Logo
  - Ceylon Tea 국가 origin identity / 7개 regional protected names / regional mark license / Lion Logo / exporter·packer registration을 분리
  - Uva regulation에서 License Number on retail packs·Authorized User Register·pure Uva eligibility 확인
  - Kandy·Uda Pussellawa는 Authorized User Register/monitoring governance 교차확인
  - Nuwara Eliya는 defined region 내 cultivation/growing + manufacture 요건 교차확인
  - Lion Logo는 pure Ceylon Tea packed in Sri Lanka의 국가 단위 표시이며 regional mark와 별도
  - EP-0062
- v0.27:
  - `data/srilanka-regional-license-schema-v1.0.json`
  - Dimbula·Ruhuna·Sabaragamuwa 상세 규정 추가 확인
  - 7개 지역 모두 공통 골격 확인: application → license/letter of authority → License Number → retail pack 표시 → Authorized User Register → annual declaration/monitoring
  - regional License Number는 estate/factory Reg.No·exporter registration·Lion Logo approval·product lot와 분리
  - pure regional tea는 같은 지역 내 여러 garden blend가 가능할 수 있으나 cross-region/foreign-origin 혼합은 regional mark 사용 대상에서 제외되는 구조
  - 공통 lifecycle은 통합하되 정확한 조항·Annex는 region별 source provenance 유지
  - EP-0063
- v0.28:
  - `data/srilanka-nuwara-eliya-annex-ii-v0.28.json`: Nuwara Eliya Annex II 18개 estate/factory source-scoped registry
  - `data/srilanka-estate-current-evidence-v0.28.json`
  - B090 Labookellie, B091 Pedro, B092 Somerset candidate estate 승격
  - Labookellie: SLTB Annex II MF0343 = Nuwara Eliya ↔ current Damro copy = Nuwara Eliya District but Dimbula growing region conflict 보존
  - Pedro: MF0457 + current factory operation evidence
  - Somerset: Dimbula Annex II MF0779 + current Dilmah single-garden Dimbula product
  - Annex II estate/factory registration은 regional Certification Mark Authorized User/License Number와 분리
  - Nuwara Eliya Annex V의 User Number·annual declaration 구조를 estate registration과 별도 holder layer로 연결
  - EP-0064
- v0.29:
  - `data/srilanka-dimbula-annex-ii-v0.29.json`: Dimbula Annex II 97개 source-scoped estate/factory registry
  - `data/srilanka-ruhuna-annex-ii-v0.29.json`: Ruhuna Annex II 242개 source-scoped estate/factory registry
  - `data/srilanka-sabaragamuwa-annex-ii-v0.29.json`: Sabaragamuwa Annex II 129개 source-scoped estate/factory registry
  - 이번 배치 신규 registry 총 468행
  - MF/BF prefix·source spelling은 그대로 보존
  - Annex II 등록은 2026 현재 운영·Authorized User·regional License Number를 자동 증명하지 않음
  - 기존 B092 Somerset은 Dimbula MF0779와 full registry로 연결
  - EP-0065
- v0.30:
  - `data/srilanka-representative-current-evidence-v0.30.json`
  - B093 Norwood Estate — Dimbula MF0348
  - B094 Loinorn Estate — Dimbula MF0206
  - B095 Handunugoda Tea Estate — Ruhuna MF1382; Annex spelling `HADUNUGODA` 보존
  - B096 Lumbini Tea Factory — Ruhuna MF1337
  - B097 New Vithanakande Tea Factory — Sabaragamuwa MF1172; Annex spelling `NEW VITHANAKANDA` 보존
  - current product examples:
    - Handunugoda Rainforest Tea → black tea
    - Lumbini Golden Curls → FBOPF EX SP
    - New Vithanakande BOP1 → Broken Orange Pekoe Grade 1
  - Lumbini는 producer + Sri Lanka EDB + Tea Factory Owners Association + product로 current evidence 강화
  - New Vithanakande는 producer + Tea Factory Owners Association + product로 current evidence 강화
  - 현재 운영/제품이 있어도 regional Certification Mark License Number/Authorized User는 primary evidence 없으면 null
  - EP-0066
- v0.31:
  - `data/srilanka-uva-annex-ii-v0.31.json`: Uva 75개
  - `data/srilanka-kandy-annex-ii-v0.31.json`: Kandy 98개
  - `data/srilanka-uda-pussellawa-annex-ii-v0.31.json`: Uda Pussellawa 10개
  - `data/srilanka-seven-region-registry-audit-v0.31.json`
  - 7개 지역 Annex II 전체 coverage 완료: 총 669행, 정규화한 고유 SLTB Reg.No 667개
  - official source conflicts:
    - MF0041 → Uva DEBEDDE / URY 중복
    - MF0620 → Ruhuna GALATARA / Sabaragamuwa GALATURA 중복
  - `data/srilanka-regional-holder-search-v0.31.json`
  - targeted public-web check에서 현재 searchable SLTB Authorized User roster 또는 직접 귀속 가능한 regional holder + License Number pair는 확보하지 못함
  - holder/license fields는 primary evidence 전까지 null 유지
  - EP-0067
- v0.32:
  - `data/srilanka-uva-kandy-uda-current-evidence-v0.32.json`
  - B098 Dambatenne Estate — Uva MF0269
    - current Lankem operation
    - Rotorvane + Orthodox black tea
    - garden mark `Bandara Eliya`
  - B099 Loolecondera Estate — Kandy MF0604 / Annex `LOOLECONDERA GROUP`
    - current JEDB state-owned operation
    - current Loolecondera retail tea
  - B100 Maha Uva Tea Factory — Uda Pussellawa MF0398
    - current Bio Foods operation
    - black + green tea
    - active ISO 22000:2018 certificate `CCFS 093`
  - garden mark·SLTB Reg.No·ISO certificate·regional Certification Mark License Number는 모두 별도 identifier layer
  - 현재 운영/제품이 확인돼도 regional Authorized User status는 primary evidence 없으면 null
  - EP-0068
- v0.33:
  - `data/srilanka-lion-logo-holder-evidence-v0.33.json`
  - Lion Logo named holder candidates:
    - Shine Tea Holdings / Favor → 회사 공식 페이지의 Sri Lanka Tea Board Lion Logo Certificate 표기 + Sri Lanka EDB current exporter 교차확인
    - Premium International Exports → 회사 공식 Lion Logo 인증 자기표시 + EDB current exporter 교차확인
    - Basilur Tea Export / Basilur → 현재 자사 포장 Lion Logo 사용 설명 + EDB current exporter 교차확인
  - SLTB Tea Tasting Division current rule: export brand certificate 3년, local-sales certificate 1년
  - named-company self-publication은 SLTB issuer-register direct match보다 낮은 근거층
  - certificate number·issue/expiry가 source에 없으면 null 유지
  - `data/srilanka-regno-conflict-recheck-v0.33.json`
  - MF0041:
    - official Uva Annex → DEBEDDE / URY 중복
    - 2018 SLTB active-factory output mirror → MF0041 DEBEDDE, address Ury Estate
    - 2026 auction transaction → MF0041 | URY
    - 상태: `partially_explained_not_officially_resolved`
  - MF0620:
    - Ruhuna GALATARA ↔ Sabaragamuwa GALATURA
    - 2018 active-factory output mirror → GALATHURA, Ayagama, Ratnapura
    - current SLTFOA는 Kalutara Galatara를 MF1435로 별도 표기
    - 상태: `directional_evidence_not_officially_resolved`
  - 운영/거래 근거로 conflict 방향을 좁혀도 newer SLTB primary correction 전에는 official Annex snapshot을 수정하지 않음
  - EP-0069, EP-0070
- v0.34:
  - `data/darjeeling-retailer-ctm-invoice-evidence-v0.34.json`
  - VAHDAM의 서로 다른 Darjeeling estate 상품에 동일 CTM `DJ/590/27092016/TE` 반복 확인:
    - Barnesbeg
    - Castleton
    - Badamtam
    - Giddapahar
    - Okayti
    - Arya
    - Margaret's Hope
  - 동일 seller에서 여러 unrelated estate에 같은 CTM이 반복되므로 estate-specific license로 배정하지 않고 seller/Authorized User holder-context로 저장
  - Tea Board official holder match는 아직 pending
  - 2026 retailer invoice/lot traces:
    - Badamtam → `EX 22/26`
    - Okayti First Flush → `EX 35/2026`
    - Okayti Second Flush → `EX 84/2026`
    - Arya → `EX 40/26`
    - Margaret's Hope → `DJ 350/2026`
  - retailer EX/DJ label은 product trace metadata이며 Tea Board CoO 또는 primary Garden Invoice로 자동 승격 금지
  - EP-0071
- v0.35:
  - `data/darjeeling-coo-application-relations-v0.35.json`
  - Tea Board Form C에서 다음 identifier layer를 분리:
    - Darjeeling CTM/GI User Business licence Number
    - Exporter Business Licence Number
    - Reseller/Exporter Invoice No
  - Form C purchase detail은 Garden·Auction/Private·Consignment·Invoice·Grade·Packing·Net Weight·Port of Destination를 별도 필드로 연결
  - Tea Board 2024-25 Annual Report로 Tea (Distribution & Export) Control Order 2005가 현재 licensing framework에 계속 사용됨을 교차확인
  - FY 2024-25 Exporter License 618건은 national exporter-license activity이며 Darjeeling CTM Authorized User 수가 아님
  - 반복 CTM `DJ/590/27092016/TE`는 Form C의 CTM/User Business licence semantic layer 후보로 볼 수 있으나 Tea Board official holder match는 아직 pending
  - retailer EX/DJ labels는 primary Garden Invoice·Reseller/Exporter Invoice·CoO로 자동 승격 금지
  - EP-0072
- v0.36:
  - `data/darjeeling-auction-invoice-semantics-v0.36.json`
  - Tea Board e-auction system/manual에서 Mark·Invoice No.·Grade·Sale No.·package·weight를 별도 field로 확인
  - Tea Board bulk packaging specification에서도 garden mark·grade·invoice no.·gross/net weight를 물리적 trace field로 함께 표시
  - older official manuals는 field semantics 용도로만 사용하고 2024-25 Annual Report로 current e-auction framework를 별도 교차확인
  - 2026 retailer labels(DJ 52/26, EX 22/26, EX 40/26, DJ 350/2026 등)은 product/trade invoice layer trace로 유지
  - 검토한 official sources는 `DJ`·`EX` prefix 의미를 정의하지 않음 → raw prefix 그대로 보존, 임의 확장 금지
  - exact primary 2026 auction/Garden Invoice match는 아직 pending
  - EP-0073
- v0.37:
  - Kangra·Dooars–Terai·Tripura·Nepal Orthodox·Kenya·Bangladesh로 홍차 산지 지도를 확장
  - Kangra region/GI, Nepal Orthodox/CTC, Kenya CTC+specialty, Bangladesh 생산·경매·연구 인프라를 별도 축으로 저장
  - 산지 규모·생산량을 품질 순위로 사용 금지
  - EP-0074~EP-0078
- v0.38:
  - 凤庆滇红茶 GI와 broad Dianhong 용어 분리
  - Yingde black tea의 GI/product/certification-trademark authorization 구조 추가
  - 坦洋工夫의 중국 GI·EU PGI 연결과 current national standard 교차확인
  - EP-0079~EP-0081
- v0.39:
  - 金骏眉 current industry standard GH/T 1118-2015
  - 祁门工夫红茶 GH/T 1178-2019
  - 政和工夫 certification-mark 생산지역
  - product standard·GI·certification mark·상품명을 한 층으로 병합 금지
  - EP-0082
- v0.40:
  - Yiwu Town·Lao Banzhang villager group·Xigui natural village·Bingdao village의 실제 행정단위를 분리
  - 명산명채 이름을 모두 같은 `mountain` 또는 `village` 타입으로 평탄화하지 않음
  - EP-0083
- v0.41:
  - 2026 Yunnan official GI catalog로 Menghai Banzhang Tea·Laomane Tea·Zhanglang Tea·Yiwu Zhengshan Tea 등 protected tea names 교차확인
  - protected tea name과 실제 place entity를 분리
  - EP-0084
- v0.42:
  - Laomane villager group·Zhanglang village 행정계층 보강
  - protected-name ↔ place relation만 연결하고 entity 자체는 병합하지 않음
- v0.43:
  - 7542 = Menghai Tea Factory raw puer cake, 7572 = ripe puer cake의 product identity 보강
  - 7542 2301·7572 2201처럼 recipe/product name과 batch를 별도 필드로 유지
  - 유명 산지 원료를 별도 근거 없이 제품에 추정 배정 금지
  - EP-0085
- v0.44:
  - Bingdao Village 안의 Bingdao Laozhai·Dijie·Nanpo·Bawai·Nuowu 고차원 5개를 separate suborigin으로 구조화
  - Bingdao Laozhai Tea GI와 place entity 분리
  - Mahai·Guafengzhai·Luoshuidong의 Yiwu 세부 행정계층 보강
  - EP-0086, EP-0087
- v0.45:
  - Bulangshan Blang Ethnic Township → Banzhang Village → Lao Banzhang / Xin Banzhang / Laomane 계층 보강
  - 산 이름·행정향·행정촌·촌민소조를 분리
  - EP-0088
- v0.46:
  - Xiaguan Tuocha brand/factory history: MOFCOM official source로 1902 origin, predecessor Kangzang Tea Factory 1941 확인
  - 8653는 Yunnan Agriculture product-list + JD official flagship retail로 puer raw tea product identity를 보강
  - first development year·코드 숫자별 의미는 authoritative evidence 부족으로 null/미확정 유지
  - EP-0089
- v0.47:
  - `data/darjeeling-primary-auction-holder-gap-v0.47.json`
  - Contemporary Brokers current 2026 pre/post-sale catalogue가 Mark·Grade·Invoice No·Lot No·Packages·Net Kg, post-sale Deal Price를 분리해 제공하는 primary broker path임을 확인
  - 추적 중인 Badamtam·Okayti·Arya·Margaret's Hope·Barnesbeg retailer invoice와 exact primary row는 아직 공개 검색에서 회수하지 못함
  - current VAHDAM website operator = `Vahdam Teas Private Limited`
  - Tea Board Top 100 Exporters 2022-23에도 같은 법인명 확인
  - 따라서 `DJ/590/27092016/TE` holder legal-entity candidate를 Vahdam Teas Private Limited까지 좁혔지만 Tea Board issuer-side Authorized User match는 아직 false/pending
  - Tea Board 2026-01-12 circular: 2026-01-01부터 2kg 초과 Darjeeling Non-Preferential CoO = Rs.2000 + GST, current DarjeelingTea portal 발급
  - primary path 존재와 exact row 확보는 별도 상태; not-found ≠ nonexistent
  - EP-0090
- v0.48:
  - `data/darjeeling-retailer-trace-conflict-audit-v0.48.json`
  - Okayti `EX 84/2026` source-internal date conflict:
    - VAHDAM India harvest field → 2025-06-09
    - same-page FAQ → 2026-06-09
    - global product surface → 2026-06-09
  - Margaret's Hope `DJ 350/2026` source-internal conflicts:
    - product/estate identity = Margaret's Hope
    - one global Origin field = Giddapahar
    - invoice field = 2026
    - one FAQ sentence = 2025 season
  - Barnesbeg `DJ 29/26`는 2026-04-17·FTGFOP1·First Flush의 clean retailer trace control로 보존
  - tracked 2026 invoice 6건의 Contemporary Brokers exact primary row는 이번 pass에서도 공개 검색으로 회수하지 못함
  - not-found를 private sale/non-auction 결론으로 바꾸지 않음
  - retailer trace 내부 충돌은 primary garden/auction row 확보 전 자동 교정 금지
  - EP-0091

- v0.49:
  - `data/darjeeling-broker-market-activity-v0.49.json`
  - J. Thomas current Darjeeling batting order에서 2026 broker-side mark activity 확인:
    - Barnesbeg Organic → 4,433 kg, 평균 ₹1,099.65/kg
    - Margaret's Hope → 22,313 kg, 평균 ₹954.96/kg
    - Badamtam → 9,016 kg, 평균 ₹834.44/kg
  - 이는 다원/mark의 2026 거래 활동 근거이며, VAHDAM retailer invoice `DJ 29/26`·`DJ 350/2026`·`EX 22/26`의 exact auction row match는 아님
  - aggregate broker statistics와 invoice-level traceability를 분리 유지
  - exact invoice row는 계속 pending
  - EP-0092

- v0.50:
  - `data/darjeeling-ctm-holder-narrowing-v0.50.json`
  - Tea Board current DarjeelingTea portal에서 authorized stakeholder + CoO → stakeholder invoice 추적 구조 재확인
  - Form C에서 Darjeeling CTM/GI User Business licence · Exporter Business Licence · Reseller/Exporter Invoice를 별도 identifier로 재확인
  - IP India GI Registry에서 Darjeeling Tea (Word) 권리자 = Tea Board, 현재 등록 유효기간 2033-10-26까지 확인
  - 동일 CTM `DJ/590/27092016/TE`가 Barnesbeg·Okayti·Badamtam·Castleton·Jungpana·Arya·Giddapahar·Margaret's Hope 등 unrelated estates에 반복 → seller/trader-side holder context 강화
  - 현재 VAHDAM 운영 법인 = Vahdam Teas Private Limited이므로 법인 후보는 강해졌지만 Tea Board issuer-side direct assignment는 여전히 미확보
  - Barnesbeg `DJ 29/26`, Okayti `EX 84/2026` exact primary row도 계속 pending
  - EP-0093

- v0.51:
  - `data/darjeeling-public-coo-example-v0.51.json`
  - 현재 공개 retailer 페이지에서 실제 CoO 번호 `COO/DJ/C/03099` 확보
  - Chamong·FTGFOP1·2025 맥락과 함께 First Flush / Second Flush 두 페이지에 동일 번호 반복 확인
  - 따라서 retailer surface의 CoO를 product/flush/lot 1:1 식별자로 사용하지 않음
  - Tea Board current 설명대로 CoO = export consignment trace key → authorized stakeholder invoice 연결 계층으로 유지
  - historical export records에서 `COO/DJ/C/37084`, `36408`, `34418` 등 실제 형식 교차확인
  - `COO/DJ/C/03099`의 Tea Board trace-result 페이지와 stakeholder invoice는 public indexing에서 아직 미회수
  - EP-0094

- v0.52:
  - `data/darjeeling-coo-sourcing-rule-v0.52.json`
  - Tea Board current notices page에서 2026-08-24 `Discontinuation of Generation of COOs without sourcing data` 공식 공지 존재 확인
  - 2차 법률요약은 circular reference `LEGAL-MISCOCOMM/14/2026-Legal Cell`, 적용일 2026-09-17, sourcing data 없는 factory-invoice-only CoO 생성 중단으로 설명
  - 87 recognised Darjeeling GI gardens + 5 Mini Tea Factories 대상이라는 세부값도 2차 근거로만 보존
  - official title/date와 secondary detailed fields를 분리 저장
  - post-change CoO 연구에는 sourcing-data provenance layer를 별도 필드로 추가
  - Tea Board PDF 본문 직접 회수 전 시행일·reference·대상숫자를 primary-verified로 승격하지 않음
  - EP-0095

- v0.53:
  - `data/srilanka-lion-logo-issuer-path-v0.53.json`
  - Sri Lanka Tea Board Tea Tasting Division이 Lion Logo 승인 주체임을 current official page로 재확인
  - current validity: 수출 브랜드 3년 / 내수 1년
  - Shine Tea Holdings는 Favor Lion Logo Certificate를 SLTB 발급 인증으로 자사 페이지에 공개
  - 하지만 SLTB issuer-side 공개 register에서 company + brand + certificate number 직접 match는 아직 미확보
  - named-company self-disclosure와 issuer-register match를 분리 유지
  - EP-0096

- v0.54:
  - `data/srilanka-regional-license-number-gap-v0.54.json`
  - 7개 지역 GI Certification Mark 규정에서 licensee별 License Number 발급 및 소매 포장 인쇄 의무 재확인
  - SLTB 본사에서 Authorized Users Register를 유지하고 annual declaration에 User Number를 기록하는 구조 확인
  - 공개 웹에서는 아직 named company/brand + actual regional License Number 직접 사례 미확보
  - MF 공장번호·exporter/packer/broker licence·Lion Logo certificate·상표등록번호를 regional GI user number로 대체 금지
  - EP-0097

- v0.55:
  - `data/assam-orthodox-public-license-v0.55.json`
  - Tea Board current Assam Orthodox 규정의 Authorized User + User License Number 정의 재확인
  - Kapemai current public disclosure에서 실제 번호 확보:
    - Assam Orthodox CTM → `AS/30/24022025/T`
    - Assam Logo CTM → `AL/39/17022025/PKT`
  - exact identifier가 공개됐지만 Tea Board issuer-side register direct match는 아직 pending
  - Nilgiri Orthodox current public disclosure도 확보: Teabox → `NG/002/27042015/E`
  - Assam·Nilgiri 모두 actual public CTM number는 확보했지만 Tea Board issuer-side register direct match는 아직 pending
  - 코드 내부 숫자/문자 의미는 공식 근거 전까지 해석 금지
  - EP-0098

- v0.56:
  - `data/sikkim-bermiok-current-evidence-v0.56.json`
  - B101 Bermiok Tea Estate entity seed 추가
  - Tea Board India current Sikkim overview에서 Bermiok = Sikkim Tea의 boutique garden, 2002 설립 맥락 재확인
  - 최근 dated product: 2025 Sikkim Spring Oolong, Bermiok Estate, March 2025 harvest, T78
  - current market products: Bermiok black tea + green tea
  - 공식 산지 맥락과 vendor 제품 근거를 분리하고, organic 인증·현재 소유/관리·2026 생산량은 추정 금지
  - EP-0099

- v0.57:
  - `data/qimen-zhengshan-terminology-v0.57.json`
  - Qimen:
    - DB34/T 1086—2026 = current Qimen Black Tea GI quality requirement, effective 2026-07-03
    - GH/T 1178-2019 = current Qimen Gongfu product standard
    - DB34/T 2570-2015 = current Qihong Xiangluo processing technical standard
    - Huangshan/Qimen official source treats Qihong Xiangluo·Jinzhen·Maofeng as modern product family names, not an official linear quality ladder
  - Zhengshan/Souchong:
    - GB/T 13738.3-2012 = current generic Souchong black tea product category
    - DB35/T 1228-2015 = current Wuyi black tea GI standard
    - China-EU GI protects 正山小种 / Zhengshan Xiao Zhong while separately allowing conditional continued use of Lapsang Souchong as a tea name in EU
  - therefore commercial Lapsang Souchong ≠ automatic GI proof for Zhengshan Xiao Zhong
  - EP-0046·EP-0047 refreshed, EP-0100 added

- v0.58:
  - `data/xiaguan-product-family-v0.58.json`
  - P093 7653 / P094 8663 / P095 T8653 entity seed 추가
  - current/recent product identity:
    - 7653 → 생차 병차; 2026 150g current listing + 과거 357g 사례
    - 8663 → 숙차 병차; 357g 사례
    - T8653 → 생차 철병; 2014·2016·2019 357g 사례
  - Yunnan Agriculture product-list index는 7653·8663·T-series를 Xiaguan product rows로 포함하는 context 제공
  - 최초 개발연도·숫자 네 자리 의미·T 접두어 의미는 authoritative factory/archival evidence 전까지 null
  - 8653와 T8653를 동일 record로 자동 병합하지 않음
  - EP-0089 연계 보강, EP-0101 추가

- v0.59:
  - `data/zhongcha-product-family-v0.59.json`
  - `data/puer-product-chronicle-seeds-v0.14.json`
  - P096 7581 / P097 7541 / P098 7571 / P099 7741 / P100 2015 중차 대홍인 추가
  - current Zhongcha brand-store product identity:
    - 7581 → 숙차 전차, 250g; 2006 제품 사례 별도 확보
    - 7541 → 2021 생차 병차 357g
    - 7571 → 2019 숙차 병차 357g
    - 7741 → 2024 생차 병차 357g
  - COFCO official 2015 release: 中茶普洱大红印은 1950년대 초 红印圆茶의 원료·공정·탕색·향기·맛을 '복원'한 후대 제품 → 원판과 별도 record
  - COFCO 2007 자료로 中茶 상표 소유자와 특정 시기 云茶公司 사용권 관계를 확인 → brand owner / licensed user / producer를 분리
  - 숫자 코드 의미·최초 개발연도는 authoritative evidence 전까지 null
  - EP-0045 보강, EP-0102·EP-0103 추가

PR #55, #56, #58, #59, #61, #63, #64, #65, #67, #68, #69, #70, #72, #73, #74, #76, #77, #79, #80, #82, #83, #85, #86, #88, #89, #91, #93은 모두 CI 전체 통과 후 main에 병합됐다. v0.37~v0.46의 main data batches도 현재 main에 반영돼 있다.

핵심 원칙:
- 다원·산지/GI·플러시·잎등급을 품질순위로 합치지 않는다.
- FTGFOP1 같은 거래등급을 First Flush와 혼동하지 않는다.
- 정산소종·소종홍차·연소종을 자동 동의어 처리하지 않는다.
- 공식 출처끼리 다원명이 다르면 conflict를 보존하고 자동 교정하지 않는다.
- Tea Board Schedule에 이름이 있다고 현재 영업상태를 자동 active 처리하지 않는다.
- producer official page는 운영·제품 사실의 근거로 쓸 수 있지만 GI license·CoO나 품질 우위를 자동 증명하지 않는다.
- 연도가 표시되지 않은 제품은 production_year=null로 둔다.

# 13. 차 사이트 개발/배포 상태

Repository:
**bigcarl7171-oss/techa-tea-platform**

Framework:
Next.js

Canonical:
**https://techa.co.kr** (non-www)

현재 공개 핵심 라우트:
- /
- /start
- /encyclopedia
- /green-tea
- /white-tea
- /black-tea
- /puer
- /stories
- /community
- /about

2026-09-30 실제 Preview smoke QA:
- 핵심 12경로 200 OK
- title/description/canonical 정상
- sitemap/robots 정상
- 내부 admin/초안 noindex
- 런타임 오류 0건 확인

단, **실제 도메인 techa.co.kr cutover는 아직 하지 않는다.**

---

# 14. Cafe24 / 구 꽃몰 전환 원칙

매우 중요.

기존 techa.co.kr에는 꽃 쇼핑몰/Cafe24 역사가 있다.

정책:
- 구 꽃 상품 URL → 새 차 사이트나 techa.kr에 억지 매핑하지 않는다.
- 구 상품/카테고리/게시판은 정책상 410 Gone.
- 구 회사소개:
  `/shopinfo/company.html`
  → `https://www.techa.kr/about/` 영구 리디렉션
- 구 주문/장바구니/주문내역/회원 경로는 SEO 대상이 아니라 **기존 고객지원 문제**다.

실제 도메인 전환 전 반드시 해결:
- Cafe24 기본/무료 유지 주소 확인
- 회원/비회원 주문조회
- 현재 주문상태
- 반품/환불
- 기존 이메일/SMS 링크
- 신규 주문 중단 방식
- 고객 안내
- m.techa.co.kr 처리
- 검색엔진 색인/리디렉션 최종 확인

**이 고객보호 게이트가 닫히기 전 DNS/대표도메인을 바꾸지 않는다.**

---

# 15. 꽃 저장소 개발 원칙

Repository:
**bigcarl7171-oss/techa-drawer**

중요 자산:
- 23개 전후의 도구
- 선물 추천
- 매거진
- 꽃 상품 데이터
- 스마트스토어 구매 연결
- 브랜드/About
- 공간 스타일링
- B2B/기업단체주문
- 향후 구독/관리

기존 상품 데이터:
- `assets/data/techa-products.json`
- 147 SKU를 약 25개 제품라인으로 관리
- recipient / occasion / giftType / priceBand 축 사용
- JSON은 생성산출물이므로 직접 수정하지 않고 원본 xlsx + build script를 따른다.

중요:
꽃 사이트는 단순 SEO 도구사이트가 아니라 **TECHA 꽃 브랜드 허브**다.

---

# 16. 꽃에서 앞으로 우선할 것

차 데이터가 중요해졌다고 꽃 개선을 멈추지 않는다.

우선순위:
1. 스마트스토어 판매 전환 개선
2. 상세페이지 품질
3. 시즌별 실제 검색 수요 대응
4. 기업/단체주문
5. 공간 스타일링
6. 구독형 유지관리
7. 선물 메시지 콘텐츠
8. 공방/About 신뢰 강화
9. 매거진
10. 도구/선물 추천을 브랜드 유입 자산으로 유지

특히 비수기에는 **B2B·공간·구독·클래스**를 매출 보완축으로 본다.

---

# 17. 꽃과 차가 만나는 영역

둘을 억지로 하나의 상품으로 합치지 않는다.

자연스러운 교차영역:
- 차와 꽃이 있는 테이블
- 공간 스타일링
- 시음회 꽃 연출
- 클래스
- 생활문화 콘텐츠
- 계절/선물/환대 이야기
- 장기적으로 산지·여행·문화 콘텐츠

꽃 고객에게 차를 억지 판매하지 않고,
차 독자에게 꽃 상품을 과도하게 노출하지 않는다.

공통점은 **사람과 사람, 공간, 오래 머무는 경험**이다.

---

# 18. 수익화 원칙

## 꽃
이미 판매사업이므로 매출 개선이 핵심이다.

- 스마트스토어 전환
- 객단가
- B2B
- 맞춤
- 공간 스타일링
- 구독/관리
- 클래스

## 차
초기에는 수익이 필수가 아니다.

초기:
- 데이터
- 콘텐츠
- 검색
- 재방문
- 시음기록

이후 수요가 보이면:
- 제휴 구매 연결
- 소규모 시음
- 클래스
- 큐레이션
- 선택적 차 판매
- 멤버십
- 산지여행

대형 차 쇼핑몰부터 만들지 않는다.

---

# 19. AI 작업 방식

사용자는 “계속 진행하겠다”는 말보다 **실제 도구 실행과 결과**를 선호한다.

따라서:
- 가능한 작업은 직접 repository/tool로 실행한다.
- 2~3개 단계마다 짧게 진행상황을 알려준다.
- 승인 없이 DNS/도메인/결제/고객 주문 경로 같은 위험 변경은 하지 않는다.
- 근거 없는 사실을 만들지 않는다.
- 사용자가 “다음으로”라고 하면 이미 정한 다음 작업을 실제로 진행한다.
- 작업이 길어지면 PR/CI/병합 상태를 구체적으로 말한다.

언어:
- 한국어
- 짧고 명확하게
- 불필요한 컨설팅 말투보다 실제 실행 중심

---

# 20. 다음 작업 우선순위

## 차 — 바로 이어갈 작업

- Data Baseline 1.0은 2026-10-02 완료했다. 상태 문서: `docs/TECHA_DATA_BASELINE_1.0_STATUS.md`, freeze commit: `ea4b610ba2c54358edaf0397290ca97db4c9d39a`. 다음은 사이트 실행 명세 v1.1의 W02 공개 정책·검사 정리부터 진행한다.
- TECHA 차 자료는 학술·법적·공식 DB를 대체하는 절대적 정답이 아니라 출처 기반 참고정보이며, `docs/EDITORIAL_REFERENCE_POLICY.md`를 공개 원칙으로 사용한다.
1. 현재 data 작업은 v1.05까지 진행: Darjeeling v0.66·invoice trace v0.76·retailer conflict v0.79·CTM attribution v0.80·seller pattern v0.83, Sri Lanka v0.68·license verification v0.81·Lion Logo legal split v0.84, Assam/Nilgiri v0.67·license verification v0.81·holder recovery v0.84, Sikkim/Bermiok v0.56, 중국 홍차 v0.57, 하관 v0.69·code evidence v0.82·historical chronology v0.85, 중차 v0.70·7581 code evidence v0.82, 중국 녹차 GI v0.61·표지/추적 v0.64·named users v0.72·Huangshan/Taiping v0.74·Xihu authorization v0.77·beginner navigation v0.86, 한국 녹차 v0.62·GI 등록 v0.65·품종보급 v0.73·live registry path v0.75·direct-row recovery v0.78·beginner navigation v0.87, 일본 녹차 분류 v0.60·품종 v0.63·beginner navigation v0.88, 녹차 preview coverage audit v0.89·comparison normalization v0.90·promotion queue v0.91·sparse core closure v0.92·Korean closure v0.93·Japan cultivar closure v0.94·Japan region/mapping closure v0.95·Green Priority-1 full audit v0.96·Black/Puer Priority-1 audit v0.97·Black core closure v0.98·Supabase sync audit v0.99·sync provenance v1.00·source identity audit v1.01·source provenance v1.02·canary sync v1.03
2. 녹차: v0.92~v0.96에서 sparse core·한국 closure·일본 품종·시즈오카/가고시마/G048 mapping·remaining Priority-1 audit까지 완료. Priority-1 31개는 evidence layer 기준 모두 review 가능 상태이며 unresolved evidence gap은 0으로 정리했다. 단 이는 DB VERIFIED 완료나 공개 완료가 아니며 candidate를 generated preview에 직접 복사하지 않고 VERIFIED review 후 재생성
3. 중국 녹차: G027 벽라춘은 v0.92에서 보호산지 재배구조와 전통 제조공정까지 보강 완료; dense missing preview인 서호용정·동정산벽라춘·황산모봉·태평후괴·안길백차·용정차와 함께 review 승격 우선후보
4. 한국 녹차: 제주 G019·증제 G025·곡우 G056는 v0.93에서 baseline closure 완료; 보성 G018과 제주 G019의 current registrant·target-area direct row는 여전히 null 유지
5. 일본 녹차: 가마이리 G053·품종 G057~G062·시즈오카 G012·가고시마 G013·G048 mapping까지 closure 완료. v0.96에서 녹차 Priority-1 31개 전체 evidence audit도 닫았고, 다음 녹차 작업은 신규 사실 확장이 아니라 DB review/promotion readiness와 verified-preview 재생성 게이트다
6. Darjeeling: Barnesbeg DJ 29/26·Okayti EX 84/2026의 exact Tea Board CoO/auction/Garden Invoice row와, v0.83에서 seller-level 구조를 강화한 DJ/590/27092016/TE의 Tea Board issuer-side holder direct row를 계속 추적
7. Sri Lanka / Assam / Nilgiri: v0.84에서 Lion Logo 상표 자체의 2029 유효기간과 exporter/brand franchise certificate를 분리; Kapemai·Teabox·Shine Tea의 named issued-license/register direct match는 계속 추적
8. 보이차: v0.85에서 하관 8653·8663의 1988 20t+20t 생산계획 실명 구술사와 전 하관차창장들의 철병 제조형 기록을 추가; 최초 개발연도·T prefix의 역사적 공식 의미는 여전히 공장 장부/생산자 1차 자료 추적
9. Sprint B v0.97~v0.98: 홍차 73개·보이차 58개 Priority-1 seed 전수 audit 완료. v0.97에서 true core research gap을 홍차 6개(B001 홍차·B003 금준미·B005 전홍·B027 CTC·B028 Orthodox·B037 Earl Grey)로 압축했고, v0.98에서 ISO·중국 국가표준정보·푸젠/윈난 정부·Tea Board India·UK Tea and Infusions Association 근거로 6개를 evidence layer 기준 모두 닫았다. 보이차 신규 core research gap은 0이며 P050 차마고도는 콘텐츠 선택형 backlog. 다음은 Sprint C VERIFIED promotion readiness다.
10. Sprint C v0.99: GitHub research 1020 facts와 Supabase candidate 314건 fact-code 의미를 전수 대조. 284건 완전일치, F0053~F0056 4건은 research seed 공란만 있는 호환 보완, F0289~F0314 26건은 실제 의미 충돌, GitHub-only 706건. 따라서 fact_code 직접 bulk upsert 금지. 다음은 research_fact_id provenance + 26개 explicit remap을 만든 뒤 canary sync.
11. Sprint C v1.00: research_fact_id/research_source_file provenance와 fact_code_remaps 구조를 migration으로 추가하고, F0289~F0314를 F900001~F900026 canonical range로 명시적 remap. 기존 F0001~F0288은 research identity backfill 대상. 다음은 migration 적용 후 F1004~F1023 20건 canary sync이며 이 단계에서도 status=review 유지.
12. Sprint C v1.01: source-registry 439행을 URL 기준 감사해 중복 URL 33그룹·71행 확인. 현재 Supabase sources.url UNIQUE와 1:1 source-code import는 호환되지 않는다. URL uniqueness는 유지하고 DB canonical source 1행 + research_source_code alias/provenance로 정규화하기로 결정. canary는 이 provenance가 생긴 뒤 진행.
13. Sprint C v1.02: research_source_code를 candidate/claim provenance로 추가하고 source_code_aliases로 여러 research SRC 코드를 canonical DB source 1행에 연결하는 migration 작성. sources.url UNIQUE는 유지. 다음은 migration 적용 후 F1004~F1023 20건 canary sync.
14. Sprint C v1.03: v1.00·v1.02 migration을 Supabase에 적용 후 F1004~F1023 20건 canary sync 성공. source 81→92, raw 86→99, candidate 314→334, source alias 92. canary 20건은 provenance 100% 채운 review 상태이며 VERIFIED claim은 261로 변동 없음.
15. Sprint C v1.04: bounded review-only bulk sync 함수와 계획 검사를 추가. research identity·source URL alias·canonical fact-code 충돌을 검사하며 자동 VERIFIED 승격은 하지 않음.
16. Sprint C v1.05: GitHub research fact corpus 1020건의 Supabase provenance 연결을 완료. numeric range는 F0001~F1023이며 F0768~F0770은 원본 corpus에서 사용하지 않는 번호다. 최종 DB는 research_fact_id 1020건, extraction candidate 1046건, verified claim 261건이며 F0289~F1023 732건은 모두 review 상태이고 해당 구간 verified claim은 0건이다.
17. Sprint D: `docs/DATA_BACKLOG.md`와 `docs/TECHA_DATA_BASELINE_1.0_STATUS.md`를 작성하고 Data Baseline 1.0을 freeze commit `ea4b610ba2c54358edaf0397290ca97db4c9d39a`로 고정. 이후 대규모 데이터 확장 대신 공개 콘텐츠가 필요한 데이터만 보강한다.
18. 생산량·순위·시장통계는 연도와 모집단을 붙여 시점 한정으로 기록
19. not-found를 nonexistence로 바꾸지 않고 산지·차종·공정·등급·GI·license를 품질서열로 단순화하지 않음

## 꽃 — 다음 병행 작업
차 WIP 한 배치를 끝낸 뒤 꽃 쪽도 반드시 한 배치를 진행한다.

추천:
1. techa.kr 현재 홈/메뉴/모바일 UX 재점검
2. 공간 스타일링·구독·기업단체주문 섹션 실제 전환 동선 점검
3. 스마트스토어 CTA 과다/부족 점검
4. 선물 메시지 콘텐츠 확대
5. 현재 시즌 상품의 상세페이지/검색 키워드 개선
6. 비수기 B2B 매출용 랜딩 구조 정리

---

# 21. 하지 말아야 할 것 요약

- 차를 꽃보다 우선하는 “새 메인사업”으로 임의 승격하지 말 것.
- 꽃을 단순 레거시 사업으로 취급하지 말 것.
- techa.co.kr 실제 DNS cutover를 성급히 하지 말 것.
- Cafe24 주문 고객을 404로 버리지 말 것.
- 구 꽃상품 URL을 techa.kr 꽃상품으로 임의 301 매핑하지 말 것.
- `/bouquet/` 같은 임시 이전 랜딩을 다시 만들지 말 것.
- 차 연구 데이터를 검증 없이 공개문구로 올리지 말 것.
- 보이차 시장 통설을 공식 규칙처럼 쓰지 말 것.
- 차 판매를 먼저 시작하지 말 것.
- 꽃 상품 사진에서 실제 형태·개수·색을 바꾸지 말 것.
- 고객 후기 답변에 이모지를 쓰지 말 것.
- 리뷰 수·성과·배송·재고를 임의로 만들지 말 것.

---

# 22. 최종 판단 기준

새 아이디어가 나왔을 때 아래 세 가지를 본다.

### 1. 꽃에 도움이 되는가?
현재 매출, 고객 신뢰, 브랜드, 비수기 수익에 도움이 되는가?

### 2. 차에 도움이 되는가?
장기 데이터, 검색, 콘텐츠, 커뮤니티, 경험 자산을 쌓는가?

### 3. TECHA 전체를 강하게 만드는가?
한쪽의 작은 이익 때문에 다른 한쪽의 신뢰나 운영을 손상시키지 않는가?

세 질문에 모두 문제가 없다면 진행한다.

---

## 마지막 메모

TECHA의 꽃과 차는 서로 다른 사업처럼 보이지만 장기적으로는 같은 방향을 가진다.

**꽃은 사람의 순간과 공간을 오래 남기고,  
차는 사람의 시간과 기억을 오래 쌓는다.**

지금은:
- 꽃은 더 잘 팔리고 더 넓게 서비스하도록 개선하고,
- 차는 더 정확하고 더 깊은 데이터 자산을 만든다.

둘 다 TECHA의 본업이다.
