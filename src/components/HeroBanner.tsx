import { ArrowRight, Clock, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import { GENERATED_IMAGES, StoreSettings, VoucherRate } from '../types';
import { SafeImage } from './SafeImage';

interface HeroBannerProps {
  rates: VoucherRate[];
  settings: StoreSettings;
  lastUpdatedText: string;
  onJumpSection: (id: string) => void;
  onOpenChannelModal: (channel: 'kakao' | 'naver') => void;
}

export function HeroBanner({
  rates,
  settings,
  lastUpdatedText,
  onJumpSection,
  onOpenChannelModal,
}: HeroBannerProps) {
  const lotteRate = rates.find((r) => r.brand.includes('롯데') && r.voucherType === '지류') ?? rates[0];
  const shinsegaeRate = rates.find((r) => r.brand.includes('신세계') && r.voucherType === '지류') ?? rates[1];
  const mobileRate = rates.find((r) => r.category === 'mobile') ?? rates[4];
  const highestRate = rates.reduce((max, r) => (r.buyRate > max ? r.buyRate : max), 95.8);

  return (
    <section className="bg-white border-b border-slate-200/90">
      {/* Subtle Blog Notice Strip */}
      {settings.noticeBanner && (
        <div className="bg-[#F2F7F4] border-b border-emerald-900/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] text-slate-700">
            <p className="font-medium text-slate-800">
              <span className="font-semibold text-[#028A3F] mr-2">공지</span>
              {settings.noticeBanner}
            </p>
            <span className="text-slate-500 font-mono-num shrink-0">
              시세 기준 · {lastUpdatedText}
            </span>
          </div>
        </div>
      )}

      {/* Main Naver Homepage-Style Blog Cover */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-8 sm:pt-12 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Editorial Statement */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mb-3">
                {settings.blogTitle} · 대표 이명군 · 정식 등록 사업자
              </p>

              <h1
                className="font-bold tracking-tight text-slate-900 leading-[1.22] mb-4"
                style={{ fontSize: 'clamp(1.85rem, 3.3vw, 2.85rem)' }}
              >
                오늘의 상품권 시세 그대로,
                <br />
                5분 안에 안전하게 정산합니다
              </h1>

              <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-xl mb-7">
                롯데·신세계·현대 백화점 상품권부터 모바일 기프티콘, 컬쳐랜드 문화상품권까지.
                청상품권 실시간 시세를 바로 확인하고 카카오톡·네이버 톡톡 또는 간편 신청으로 수수료 투명하게 거래하세요.
              </p>

              {/* Primary CTA + Secondary Direct Channels */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => onJumpSection('live-rates')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  실시간 시세 조회하기
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenChannelModal('kakao')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#191919] bg-[#FEE500] hover:bg-[#F5DC00] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  카카오톡 채널 상담
                </button>

                <button
                  type="button"
                  onClick={() => onOpenChannelModal('naver')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:border-[#03C75A] hover:text-[#029E47] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  네이버 톡톡 문의
                </button>
              </div>
            </div>

            {/* Quiet Operating Metadata */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {settings.operatingHours}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono-num">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                대표상담 {settings.phoneNumber}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#03C75A]" />
                본인 명의 계좌 즉시 입금
              </span>
            </div>
          </div>

          {/* Right 16:9 Editorial Visual with Measured Scrim & Live Benchmark Strip */}
          <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 min-h-[260px] sm:min-h-[320px] lg:h-full">
            <SafeImage
              src={GENERATED_IMAGES.hero}
              alt="청상품권 백화점 지류 상품권 봉투와 상담 데스크"
              className="w-full h-full object-cover"
              fallbackLabel="청상품권 공식 블로그 대표 이미지"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
              <p className="text-xs text-slate-200/90 mb-2">
                주요 품목 실시간 매입 기준 · 10만원권 환산가
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-white/15">
                {[lotteRate, shinsegaeRate, mobileRate].filter(Boolean).map((item) => (
                  <div key={item.id} className="min-w-0">
                    <div className="text-xs text-slate-200 truncate">{item.brand}</div>
                    <div className="text-lg sm:text-xl font-bold font-mono-num text-white mt-0.5">
                      {item.buyRate.toFixed(1)}%
                    </div>
                    <div className="text-[11px] sm:text-xs font-mono-num text-emerald-300">
                      {Math.round(item.buyRate * 1000).toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip below Hero Split */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-1">오늘 최고 매입 시세</div>
            <div className="text-2xl font-bold font-mono-num text-slate-900">
              {highestRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">백화점 지류 신권 기준</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">평균 정산 입금 소요</div>
            <div className="text-2xl font-bold font-mono-num text-slate-900">3~5분</div>
            <div className="text-xs text-slate-500 mt-0.5">핀번호·모바일 검수 직후</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">실시간 취급 상품권</div>
            <div className="text-2xl font-bold font-mono-num text-slate-900">{rates.length}종</div>
            <div className="text-xs text-slate-500 mt-0.5">백화점·기프티콘·문화·주유</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">거래 안전 보증</div>
            <div className="text-2xl font-bold text-slate-900">정식 등록</div>
            <div className="text-xs text-slate-500 mt-0.5">청상품권 · 사업자 484-37-01431</div>
          </div>
        </div>
      </div>
    </section>
  );
}
