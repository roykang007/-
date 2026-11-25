export type VoucherCategory = 'department' | 'mobile' | 'culture' | 'mart';
export type VoucherType = '지류' | '모바일' | '핀번호' | '기프트카드';
export type RateStatus = '매입가능' | '우대매입' | '일시중단';
export type InquiryType = '매입 신청' | '구매 문의' | '법인·대량 문의' | '기타 상담';
export type ChannelPreference = '카카오톡' | '네이버 톡톡' | '전화/문자';
export type InquiryStatus = '접수대기' | '상담중' | '입금완료' | '취소';
export type PostCategory = '시세 리포트' | '매입 가이드' | '안전거래 안내' | '공지사항';
export type PostImageKey = 'department' | 'mobile' | 'culture' | 'hero';

export const VOUCHER_CATEGORIES: { id: VoucherCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체 품목' },
  { id: 'department', label: '백화점 상품권' },
  { id: 'mobile', label: '모바일 기프티콘' },
  { id: 'culture', label: '문화·도서상품권' },
  { id: 'mart', label: '마트·주유·외식' },
];

export const VOUCHER_TYPES: VoucherType[] = ['지류', '모바일', '핀번호', '기프트카드'];
export const RATE_STATUSES: RateStatus[] = ['매입가능', '우대매입', '일시중단'];
export const INQUIRY_TYPES: InquiryType[] = ['매입 신청', '구매 문의', '법인·대량 문의', '기타 상담'];
export const CHANNEL_PREFERENCES: ChannelPreference[] = ['카카오톡', '네이버 톡톡', '전화/문자'];
export const INQUIRY_STATUSES: InquiryStatus[] = ['접수대기', '상담중', '입금완료', '취소'];
export const POST_CATEGORIES: PostCategory[] = ['시세 리포트', '매입 가이드', '안전거래 안내', '공지사항'];

export const SCHEMA_LIMITS = {
  rate: {
    brandMax: 60,
    nameMax: 100,
    denominationsMax: 80,
    noteMax: 160,
    minRate: 50,
    maxRate: 100,
  },
  inquiry: {
    customerNameMax: 50,
    contactMin: 4,
    contactMax: 60,
    voucherNameMax: 100,
    messageMax: 1000,
    adminMemoMax: 500,
    minFaceValue: 1000,
    maxFaceValue: 1000000000,
    minQuantity: 1,
    maxQuantity: 10000,
  },
  settings: {
    blogTitleMax: 80,
    noticeBannerMax: 200,
    urlMax: 250,
    kakaoIdMax: 60,
    phoneMax: 40,
    operatingHoursMax: 100,
    businessRegistrationMax: 80,
  },
  post: {
    titleMax: 140,
    summaryMax: 260,
    contentMax: 12000,
    publishedDateMax: 20,
  },
} as const;

export interface VoucherRate {
  id: string;
  brand: string;
  name: string;
  category: VoucherCategory;
  voucherType: VoucherType;
  denominations: string;
  buyRate: number;
  sellRate: number;
  changeDelta: number;
  status: RateStatus;
  note: string;
  sortOrder: number;
  updatedAt?: Date | null;
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  contact: string;
  inquiryType: InquiryType;
  voucherName: string;
  faceValue: number;
  quantity: number;
  estimatedPayout: number;
  channelPreference: ChannelPreference;
  message: string;
  status: InquiryStatus;
  adminMemo: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface StoreSettings {
  blogTitle: string;
  noticeBanner: string;
  kakaoChannelUrl: string;
  kakaoChannelId: string;
  naverTalkUrl: string;
  phoneNumber: string;
  operatingHours: string;
  businessRegistration: string;
  updatedAt?: Date | null;
}

export interface BlogPost {
  id: string;
  title: string;
  category: PostCategory;
  summary: string;
  content: string;
  imageKey: PostImageKey;
  readMinutes: number;
  publishedDate: string;
  isPinned: boolean;
  updatedAt?: Date | null;
}

export const GENERATED_IMAGES: Record<PostImageKey | 'profile', string> = {
  hero: '/src/assets/images/hero_voucher_desk_1795587160566.jpg',
  department: '/src/assets/images/guide_department_vouchers_1795587162607.jpg',
  mobile: '/src/assets/images/guide_mobile_gifticon_1795587162350.jpg',
  culture: '/src/assets/images/guide_culture_vouchers_1795587163744.jpg',
  profile: '/src/assets/images/blog_profile_emblem_1795587163823.jpg',
};
