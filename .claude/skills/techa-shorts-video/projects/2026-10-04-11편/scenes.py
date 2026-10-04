# 장면별 배경 사진 (2026-10-04) — 내레이션 내용에 맞춰 직접 고른다.
#
# 표기: "img-2.jpg"            그 편 원본사진
#       "03/img-2.jpg"         다른 편 원본사진 (편 번호/파일)
#       "img-2.jpg@0.8"        사진 안에서 보여 줄 가로 위치(0 왼쪽 ~ 1 오른쪽). 없으면 0.5
#       ["a.jpg", "b.jpg"]     분할 화면 장면 — 패널마다 한 장
# 움직임(밀어 들어가기·빠지기·좌우 이동)은 렌더러가 장면마다 바꿔 준다.
SHOTS = {
    "mother-in-law-70th-gift": [
        "cover.jpg@0.45",        # 칠순 생신 — 꽃다발을 받는 어르신
        "img-3.jpg",             # 만 69세 — 돈꽃다발
        "img-2.jpg@0.35",        # 고희 — 보라 꽃다발(한자가 얹힐 어두운 면)
        "cover.jpg@0.55",        # 가족들이 나눠 준비하는 것 — 건네는 손
        "img-4.jpg",             # 취향·함께·남는지 — 오래 두는 용돈케이크 무드등
        "img-2.jpg@0.85",        # 편지 — 꽃다발에 꽂힌 카드
        "img-1.jpg",             # 잔치 뒤 거실 — 거실 조명 옆 돈꽃다발
    ],
    "preserved-flower-volume-guide": [
        ["cover.jpg", "img-1.jpg"],  # 생화 vs 프리저브드
        "img-1.jpg",                 # 물이 빠진 만큼 — 프리저브드 클로즈업
        "cover.jpg@0.5",             # 결과 색은 그대로
        "03/img-2.jpg",              # 공방에서 채우고 균형을 맞춤 — 공방 작업대
        "img-2.jpg",                 # 계절이 다른 꽃을 한 다발에
        "cover.jpg@0.4",             # 사이즈 고르기
    ],
    "pollen-allergy-flower-gift": [
        "cover.jpg",                       # 1번 용의자, 꽃다발
        ["img-1.jpg", "img-2.jpg"],        # 바람 vs 벌
        "10/cover.jpg@0.15",               # 진짜 범인은 길가 잡초 — 창밖 가을 풍경
        "10/img-1.jpg",                    # 노란 골든로드 — 노란 꽃
        "10/img-2.jpg",                    # 국화과 생화 — 금잔화·메리골드
        "img-1.jpg@0.6",                   # 장미·수국·카네이션 — 장미를 든 손
        "img-3.jpg",                       # 테차는 생화를 안 써요 — 공방 진열장
    ],
    "parents-birthday-money-cake": [
        "img-1.jpg",             # 지갑 당기기 — 줄줄 나오는 지폐
        "cover.jpg",             # 봉투 대신 — 어르신의 웃음
        "img-2.jpg",             # 꽃 케이크 + 지갑 구조
        "img-1.jpg@0.4",         # 꽂기만 하면 — 지폐 줄
        "07/img-3.jpg",          # 메시지 카드 — 상자와 카드
        "img-2.jpg@0.5",         # 불이 들어오는 케이크
        "01/img-4.jpg",          # 라벤더·핑크·레드 — 세 가지 색
    ],
    "proposal-bouquet": [
        "cover.jpg@0.4",                   # 프로포즈 — 꽃다발·유리돔·반지
        ["img-4.jpg", "img-1.jpg"],        # 시드는 생화 vs 프리저브드 장미
        "img-5.jpg",                       # 꽃 색은 그 사람 취향
        "img-3.jpg",                       # 품에 안고 사진 찍기 좋은 크기 — 건네는 손
        "img-1.jpg",                       # 진짜 장미를 보존 처리 — 장미 클로즈업
        "img-2.jpg",                       # 며칠 전 받아 숨겨 둬도 — 장미 상자
        "img-6.jpg@0.45",                  # 유리돔 무드등과 반지
    ],
    "wedding-song-thank-you-gift": [
        "cover.jpg@0.5",                   # 축가 답례 — 용돈박스
        ["img-1.jpg", "img-2.jpg"],        # 무대 vs 연습
        ["cover.jpg@0.3", "img-3.jpg"],    # 결혼식 날 / 신혼여행 뒤
        "img-2.jpg",                       # 정해진 금액은 없어요
        "cover.jpg@0.7",                   # 축의금 — 지폐가 든 상자
        ["cover.jpg@0.35", "img-1.jpg"],   # 용돈박스 / 비누꽃 한두 송이
        "08/img-3.jpg@0.4",                # 카드 한 줄 — 카드를 읽는 모습
    ],
    "grandma-birthday-gift": [
        "cover.jpg",                               # 미수 — 할머니와 손녀
        "img-2.jpg",                               # 희수
        "img-3.jpg",                               # 환갑·진갑·고희
        "04/cover.jpg",                            # 잔치에 선물 — 한복 어르신
        ["img-1.jpg", "img-2.jpg", "cover.jpg"],   # 학생 / 직장인 / 사촌들
        "04/img-1.jpg",                            # 지폐가 줄줄 — 용돈케이크 지폐
        "img-1.jpg@0.55",                          # 손주가 건네고 카드를 읽어 드림
    ],
    "wedding-anniversary-gift": [
        "cover.jpg",             # 1주년 선물은?
        "img-3.jpg@0.45",        # 종이 — 카드를 든 남편
        "img-1.jpg",             # 25·30·50주년 — 함께 나이 든 얼굴
        "04/cover.jpg",          # 회혼례 잔치 — 한복 어르신
        "09/cover.jpg",          # 장미 색 — 빨간 장미와 흰 꽃
        "img-3.jpg@0.7",         # 꽃 + 손편지 — 편지와 무드등
        "img-2.jpg",             # 거실 장식장 위 무드등
    ],
    "flower-gift-avoid-flowers": [
        "cover.jpg",             # 금기 4가지 — 흰 꽃이 든 꽃다발
        "img-1.jpg",             # 고양이와 백합
        "img-2.jpg",             # 병동
        "10/img-1.jpg",          # 국화는 나라마다 — 국화
        "img-3.jpg",             # 일본 병문안 — 송이 수
        "cover.jpg@0.6",         # 네 가지만 확인
        "02/cover.jpg",          # 물도 흙도 없는 꽃 — 프리저브드 꽃다발
    ],
    "october-birth-flower": [
        "cover.jpg@0.55",                  # 10월 탄생화 퀴즈 — 가을 꽃
        "img-1.jpg",                       # 정답은 셋 다
        "cover.jpg@0.4",                   # 나라마다 정한 꽃이 달라요
        "img-1.jpg@0.45",                  # 국화
        "cover.jpg@0.75",                  # 코스모스
        ["img-2.jpg@0.36", "img-2.jpg@0.66"],  # 금잔화(왼쪽 꽃) vs 메리골드(오른쪽 꽃)
        "img-3.jpg@0.62",                  # 해바라기 꽃다발
    ],
    "promotion-congratulation-gift": [
        "cover.jpg@0.15",        # 새 자리 — 사무실 풍경
        "cover.jpg@0.45",        # 축하 꽃은 그날 가장 빛나지만
        "img-1.jpg@0.55",        # 해바라기 액자
        "img-3.jpg",             # 이오난사 무드등 — 불 켜진
        "02/img-1.jpg",          # 차분한 색 꽃다발
        "08/img-3.jpg@0.4",      # 카드 문구
    ],
}
