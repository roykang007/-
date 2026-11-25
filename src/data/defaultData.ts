import type { BlogPost, StoreSettings, VoucherRate } from '../types.ts';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  blogTitle: '청상품권 공식 블로그',
  noticeBanner: '평일·주말 09:00~22:00 실시간 시세 반영 · 백화점 지류/모바일 10만원 이상 당일 5분 이내 즉시 입금',
  kakaoChannelUrl: 'https://pf.kakao.com/',
  kakaoChannelId: '@청상품권',
  naverTalkUrl: 'https://talk.naver.com/',
  phoneNumber: '010-9389-9888',
  operatingHours: '매일 09:00 ~ 22:00 (연중무휴 실시간 정산)',
  businessRegistration: '청상품권 · 대표 이명군 · 사업자번호 484-37-01431 · 경기도 부천시 원미구 부일로685번길 40-8, E동502호(역곡동)',
  updatedAt: new Date(),
};

export const DEFAULT_VOUCHER_RATES: VoucherRate[] = [
  {
    id: 'lotte-dept-paper',
    brand: '롯데백화점',
    name: '롯데백화점 지류 상품권',
    category: 'department',
    voucherType: '지류',
    denominations: '1만원 / 5만원 / 10만원 / 30만원 / 50만원',
    buyRate: 95.8,
    sellRate: 97.2,
    changeDelta: 0.2,
    status: '우대매입',
    note: '신권·구권 동일 시세 적용 · 등기/방문 즉시 현금 정산',
    sortOrder: 1,
  },
  {
    id: 'shinsegae-dept-paper',
    brand: '신세계백화점',
    name: '신세계백화점 지류 상품권',
    category: 'department',
    voucherType: '지류',
    denominations: '5천원 / 1만원 / 5만원 / 10만원 / 50만원',
    buyRate: 95.7,
    sellRate: 97.1,
    changeDelta: 0.1,
    status: '우대매입',
    note: '홀로그램 훼손 없는 정품 기준 · 100만원 이상 추가 우대',
    sortOrder: 2,
  },
  {
    id: 'hyundai-dept-paper',
    brand: '현대백화점',
    name: '현대백화점 지류 상품권',
    category: 'department',
    voucherType: '지류',
    denominations: '1만원 / 5만원 / 10만원 / 30만원 / 50만원',
    buyRate: 95.4,
    sellRate: 96.9,
    changeDelta: 0,
    status: '매입가능',
    note: '지류 전 권종 상시 매입 · 법인 대량 건 방문 수거 가능',
    sortOrder: 3,
  },
  {
    id: 'galleria-dept-paper',
    brand: '갤러리아백화점',
    name: '갤러리아 지류 상품권',
    category: 'department',
    voucherType: '지류',
    denominations: '1만원 / 5만원 / 10만원 / 50만원',
    buyRate: 94.6,
    sellRate: 96.2,
    changeDelta: -0.1,
    status: '매입가능',
    note: '매장 방문 및 우편 등기 매입 모두 지원',
    sortOrder: 4,
  },
  {
    id: 'shinsegae-mobile',
    brand: '신세계백화점',
    name: '신세계 모바일 상품권 (이마트 교환권)',
    category: 'mobile',
    voucherType: '모바일',
    denominations: '1만원 / 3만원 / 5만원 / 10만원',
    buyRate: 94.8,
    sellRate: 96.4,
    changeDelta: 0.3,
    status: '우대매입',
    note: '바코드 이미지 전송 후 3분 이내 본인 명의 계좌 입금',
    sortOrder: 5,
  },
  {
    id: 'lotte-mobile',
    brand: '롯데백화점',
    name: '롯데 모바일 상품권 (기프티콘)',
    category: 'mobile',
    voucherType: '모바일',
    denominations: '1만원 / 5만원 / 10만원',
    buyRate: 94.5,
    sellRate: 96.1,
    changeDelta: 0.1,
    status: '매입가능',
    note: '유효기간 30일 이상 잔여 권종 기준 즉시 정산',
    sortOrder: 6,
  },
  {
    id: 'hyundai-mobile',
    brand: '현대백화점',
    name: '현대백화점 모바일 교환권',
    category: 'mobile',
    voucherType: '모바일',
    denominations: '5만원 / 10만원',
    buyRate: 94.2,
    sellRate: 95.8,
    changeDelta: 0,
    status: '매입가능',
    note: '카카오톡 선물하기 / MMS 바코드 모두 매입 가능',
    sortOrder: 7,
  },
  {
    id: 'starbucks-ecard',
    brand: '스타벅스',
    name: '스타벅스 e카드 / 금액권 기프티콘',
    category: 'mobile',
    voucherType: '모바일',
    denominations: '1만원 / 3만원 / 5만원 / 10만원',
    buyRate: 91.5,
    sellRate: 94.0,
    changeDelta: 0.2,
    status: '매입가능',
    note: '미등록 잔액권 및 카카오톡 선물하기 금액권 기준',
    sortOrder: 8,
  },
  {
    id: 'oliveyoung-gift',
    brand: '올리브영',
    name: '올리브영 기프트카드 모바일권',
    category: 'mobile',
    voucherType: '기프트카드',
    denominations: '1만원 / 3만원 / 5만원',
    buyRate: 90.8,
    sellRate: 93.5,
    changeDelta: 0,
    status: '매입가능',
    note: 'PIN 번호 미등록 상태 확인 후 즉시 정산',
    sortOrder: 9,
  },
  {
    id: 'baemin-gift',
    brand: '배달의민족',
    name: '배달의민족 모바일 상품권',
    category: 'mobile',
    voucherType: '모바일',
    denominations: '1만원 / 2만원 / 3만원 / 5만원',
    buyRate: 91.2,
    sellRate: 93.8,
    changeDelta: -0.2,
    status: '매입가능',
    note: '선물하기 코드 미등록분 · 1일 한도 제한 없음',
    sortOrder: 10,
  },
  {
    id: 'cultureland-pin',
    brand: '컬쳐랜드',
    name: '컬쳐랜드 모바일 문화상품권 (16자리)',
    category: 'culture',
    voucherType: '핀번호',
    denominations: '1만원 / 3만원 / 5만원 / 10만원',
    buyRate: 89.5,
    sellRate: 92.0,
    changeDelta: 0.5,
    status: '우대매입',
    note: '16자리 핀번호 확인 즉시 입금 · 5만원권 이상 수수료 우대',
    sortOrder: 11,
  },
  {
    id: 'booknlife-pin',
    brand: '도서문화상품권',
    name: '북앤라이프 도서문화상품권 (지류/핀)',
    category: 'culture',
    voucherType: '핀번호',
    denominations: '5천원 / 1만원 / 5만원',
    buyRate: 88.8,
    sellRate: 91.5,
    changeDelta: 0,
    status: '매입가능',
    note: '지류 스크래치 미개봉 및 온라인 16자리+인증번호 기준',
    sortOrder: 12,
  },
  {
    id: 'google-play-card',
    brand: '구글플레이',
    name: '구글 플레이 기프트코드 (KR)',
    category: 'culture',
    voucherType: '기프트카드',
    denominations: '1만원 / 3만원 / 5만원 / 10만원',
    buyRate: 87.5,
    sellRate: 90.5,
    changeDelta: -0.3,
    status: '매입가능',
    note: '국내 정식 발행 코드 전용 · 영수증 확인 시 우선 처리',
    sortOrder: 13,
  },
  {
    id: 'emart-homeplus-oil',
    brand: 'SK·GS 주유/마트',
    name: 'SK·GS칼텍스 주유권 / 홈플러스 상품권',
    category: 'mart',
    voucherType: '지류',
    denominations: '5만원 / 10만원',
    buyRate: 94.0,
    sellRate: 95.9,
    changeDelta: 0.1,
    status: '매입가능',
    note: '주유권·대형마트 지류권 모두 전국 도매 시세 적용',
    sortOrder: 14,
  },
];

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'guide-department-rate-diff',
    title: '롯데·신세계·현대 백화점 상품권 지류 vs 모바일 매입 시세 차이와 최고가 받는 법',
    category: '매입 가이드',
    summary:
      '백화점 상품권 지류와 모바일 교환권의 시세가 1% 내외로 차이나는 이유와, 10만원권·50만원권 등 고액권 매입 시 우대 시세를 적용받는 실전 기준을 정리했습니다.',
    content: `백화점 상품권은 국내에서 환금성이 가장 높은 품목이지만, 지류 상품권과 모바일 교환권의 매입 시세에는 보통 0.8%에서 1.2% 정도의 차이가 발생합니다.

1. 지류 상품권 시세가 더 높은 이유
지류 상품권(롯데·신세계·현대·갤러리아)은 유통 과정에서 별도의 교환 절차가 필요 없어 명동 도매 시장에서 즉시 현금과 동일하게 유통됩니다. 특히 10만원권과 50만원권은 거래 수요가 꾸준해 연중 95.4%~95.8% 수준의 안정적인 매입 시세를 유지합니다.

2. 모바일 교환권(기프티콘) 매입 체크포인트
신세계 이마트 교환권이나 롯데 모바일 상품권은 고객님이 바코드 이미지를 전송해 주시면 키오스크 교환 및 사용 가능 여부 검수 과정을 거칩니다. 유효기간이 최소 30일 이상 남아 있어야 정상 시세가 적용되며, 연장 불가 상품권의 경우 만료 임박 시 소폭 차감될 수 있습니다.

3. 우대 시세 적용 기준
- 단일 거래 합계 100만원 이상: 기본 시세 대비 +0.1% ~ +0.2% 우대
- 구겨짐·오염·홀로그램 훼손이 없는 신권 지류: 추가 감가 없이 최고가 정산
- 등기 우편 접수 시: 도착 당일 오전 시세 기준으로 검수 후 10분 이내 계좌 이체

간편 신청 폼이나 카카오톡 채널로 보유하신 권종과 수량을 먼저 남겨 주시면, 실시간 확정 매입가를 바로 안내해 드립니다.`,
    imageKey: 'department',
    readMinutes: 4,
    publishedDate: '2026.11.24',
    isPinned: true,
  },
  {
    id: 'guide-mobile-gifticon-checklist',
    title: '모바일 기프티콘(스타벅스·올리브영·배민) 현금화 전 반드시 확인할 4가지',
    category: '매입 가이드',
    summary:
      '카카오톡 선물하기로 받은 스타벅스 금액권, 올리브영 기프트카드, 배달의민족 상품권을 안전하고 빠르게 매입 신청하기 전 꼭 점검해야 할 사항을 안내합니다.',
    content: `모바일 기프티콘은 휴대폰으로 간편하게 접수하고 5분 이내에 계좌 입금을 받을 수 있어 가장 문의가 많은 카테고리입니다. 다만 접수 전 아래 4가지를 먼저 확인하시면 지연 없이 바로 정산받으실 수 있습니다.

1. 앱 등록 여부 확인
스타벅스 e카드나 올리브영·배달의민족 금액권은 본인 계정에 한 번이라도 등록한 경우 재판매가 불가능합니다. 반드시 '미등록 상태'의 원본 바코드 또는 PIN 번호로 접수해 주세요.

2. 캡처 이미지 해상도
바코드 하단의 12~16자리 숫자가 선명하게 보이도록 원본 화면을 그대로 캡처해 주셔야 자동 검수가 빠르게 완료됩니다.

3. 유효기간 및 발행처
카카오톡 선물하기, 기프티쇼, 기프티콘 등 정식 발행사의 금액권은 상시 매입 대상입니다. 기업 프로모션(B2B 경품)으로 지급된 단기 교환권은 유효기간 연장이 불가하므로 최소 14일 이상 여유가 있을 때 신청하시는 것이 유리합니다.

4. 본인 명의 계좌 입금 원칙
보이스피싱 및 제3자 사기 예방을 위해 신청자 본인의 휴대폰 번호와 예금주 성함이 일치하는 계좌로만 안전하게 입금해 드립니다.`,
    imageKey: 'mobile',
    readMinutes: 3,
    publishedDate: '2026.11.22',
    isPinned: true,
  },
  {
    id: 'guide-cultureland-safety',
    title: '컬쳐랜드·도서문화상품권 핀번호(16자리) 안전 거래 및 사기 예방 가이드',
    category: '안전거래 안내',
    summary:
      '온라인 핀번호 거래 시 정식 사업자 확인 방법과 컬쳐랜드 16자리·북앤라이프 인증번호 접수 시 주의사항을 상세히 알려드립니다.',
    content: `문화상품권과 도서문화상품권은 핀번호만 입력하면 즉시 사용이 가능한 특성상, 반드시 정식 사업자 등록과 오프라인 영업장이 확인되는 전문 업체를 통해 거래하셔야 합니다.

1. 정식 매입 업체 확인 기준
- 국세청 사업자등록번호 및 통신판매/상품권 매매업 여부 공개
- 상시 통화 가능한 유선 대표번호 및 공식 카카오톡 채널·네이버 톡톡 운영
- 터무니없이 높은 시세(예: 시중가 대비 3~5% 이상 높은 98% 매입 등)를 미끼로 선전송을 유도하는 비공식 개인 계정 주의

2. 컬쳐랜드 / 도서문화상품권 접수 형식
- 컬쳐랜드 모바일 문화상품권: 16자리 핀번호 (4-4-4-4)
- 북앤라이프 도서문화상품권: 16자리 핀번호 + 4자리 인증번호
- 지류 문화상품권: 금액란 스크래치 미훼손 상태 우편/방문 접수

3. 실시간 정산 소요 시간
핀번호 접수 후 시스템 조회까지 평균 1~2분이 소요되며, 정상 미사용 권종으로 확인되는 즉시 수수료 차감 후 전액 계좌 입금됩니다.`,
    imageKey: 'culture',
    readMinutes: 4,
    publishedDate: '2026.11.19',
    isPinned: false,
  },
  {
    id: 'report-november-market',
    title: '11월 4주차 청상품권 주요 시세 리포트 및 법인 대량 매입·구매 안내',
    category: '시세 리포트',
    summary:
      '연말 백화점 정기 세일과 기업 임직원 복지 수요 증가로 롯데·신세계 지류 및 모바일 상품권 매입 시세가 전주 대비 0.1~0.3%p 상승했습니다.',
    content: `연말 시즌을 앞두고 백화점 및 모바일 교환권 거래량이 빠르게 증가하고 있습니다. 이번 주 청상품권 주요 상품권 시세 동향을 요약해 드립니다.

1. 백화점 지류 상품권 강세 지속
롯데백화점(95.8%)과 신세계백화점(95.7%) 지류 상품권은 연말 선물 수요 유입으로 전주 대비 각각 +0.2%p, +0.1%p 상승 마감했습니다. 특히 10만원권과 50만원권 물량에 대한 도매 수요가 탄탄합니다.

2. 모바일 교환권 시세 회복
신세계 모바일 이마트 교환권은 94.8%(+0.3%p)로 최근 1개월 내 최고 매입가를 기록 중입니다.

3. 법인·기업 대량 거래 지원
기업 경품, 임직원 명절·연말 상여, 거래처 선물용으로 백화점 상품권 대량 구매 또는 잔여 상품권 일괄 매입이 필요하신 경우 별도 전담 매니저가 배정됩니다. 거래명세서 및 법인 영수증 발행, 서울·수도권 당일 안전 배송/방문 수거 모두 지원합니다.`,
    imageKey: 'hero',
    readMinutes: 3,
    publishedDate: '2026.11.24',
    isPinned: false,
  },
];
