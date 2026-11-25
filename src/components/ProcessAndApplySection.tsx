import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  MessageSquareText,
  Phone,
  Send,
} from 'lucide-react';
import { submitInquiryApi } from '../services/adminApi';
import { submitCustomerInquiry } from '../services/firestoreService';
import {
  CHANNEL_PREFERENCES,
  ChannelPreference,
  INQUIRY_TYPES,
  InquiryType,
  SCHEMA_LIMITS,
  StoreSettings,
  VoucherRate,
} from '../types';

export interface PrefilledApplication {
  voucherName: string;
  buyRate: number;
  faceValue: number;
  quantity: number;
  estimatedPayout: number;
  timestamp: number;
}

interface ProcessAndApplySectionProps {
  rates: VoucherRate[];
  settings: StoreSettings;
  prefill: PrefilledApplication | null;
  onOpenChannelModal: (channel: 'kakao' | 'naver') => void;
}

const PROCESS_STEPS = [
  {
    num: '01',
    title: '실시간 시세 확인 및 접수',
    desc: '상단 시세표와 계산기에서 예상 입금액을 확인한 뒤 카카오톡, 네이버 톡톡 또는 아래 간편 폼으로 접수합니다.',
  },
  {
    num: '02',
    title: '바코드·핀번호 / 지류 확인',
    desc: '모바일 기프티콘·문화상품권은 이미지나 16자리 핀번호를 전달하고, 지류는 방문 또는 우편 등기로 접수합니다.',
  },
  {
    num: '03',
    title: '최종 매입가 확정 안내',
    desc: '정상 미사용 여부와 유효기간 검수 후 실시간 시세 기준 최종 정산 금액을 안내해 드립니다.',
  },
  {
    num: '04',
    title: '본인 계좌 5분 이내 입금',
    desc: '확정 안내 직후 신청자 본인 명의 계좌로 수수료 외 추가 비용 없이 전액 즉시 입금 완료합니다.',
  },
];

export function ProcessAndApplySection({
  rates,
  settings,
  prefill,
  onOpenChannelModal,
}: ProcessAndApplySectionProps) {
  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('매입 신청');
  const [voucherName, setVoucherName] = useState(rates[0]?.name ?? '롯데백화점 지류 상품권');
  const [faceValue, setFaceValue] = useState<number>(100000);
  const [quantity, setQuantity] = useState<number>(1);
  const [channelPreference, setChannelPreference] = useState<ChannelPreference>('카카오톡');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    id: string;
    voucherName: string;
    estimatedPayout: number;
    channelPreference: ChannelPreference;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!prefill) return;
    setVoucherName(prefill.voucherName);
    setFaceValue(prefill.faceValue);
    setQuantity(prefill.quantity);
    setInquiryType('매입 신청');
    setSubmittedReceipt(null);
  }, [prefill]);

  const matchedRate = rates.find((r) => r.name === voucherName);
  const computedPayout = matchedRate
    ? Math.floor((faceValue * matchedRate.buyRate) / 100)
    : Math.floor(faceValue * 0.94);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = customerName.trim();
    const trimmedContact = contact.trim();

    if (trimmedName.length < 1) {
      setFormError('성함 또는 닉네임을 입력해 주세요.');
      return;
    }
    if (trimmedContact.length < SCHEMA_LIMITS.inquiry.contactMin) {
      setFormError('연락 가능한 휴대폰 번호 또는 카카오톡 ID를 정확히 입력해 주세요.');
      return;
    }
    if (faceValue < SCHEMA_LIMITS.inquiry.minFaceValue) {
      setFormError('액면가 총액은 최소 1,000원 이상 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: trimmedName,
        contact: trimmedContact,
        inquiryType,
        voucherName,
        faceValue,
        quantity,
        estimatedPayout: computedPayout,
        channelPreference,
        message,
      };

      const { id } = await submitInquiryApi(payload);
      // Mirror to Firestore asynchronously (non-blocking)
      void submitCustomerInquiry(payload).catch(() => {});

      setSubmittedReceipt({
        id,
        voucherName,
        estimatedPayout: computedPayout,
        channelPreference,
      });
      setCustomerName('');
      setContact('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setFormError('접수 중 일시적인 오류가 발생했습니다. 카카오톡 채널 또는 전화로 바로 문의해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="trade-process" className="bg-white border-y border-slate-200/90 py-14 sm:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Part A: 4-Step Editorial Process */}
        <div className="mb-12">
          <p className="text-xs font-medium text-[#028A3F] mb-1.5">
            02. 한눈에 보는 매입·구매 절차
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-8">
            복잡한 회원가입 없이 4단계로 바로 정산
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="p-5 bg-[#F8FAFB] border border-slate-200/90 rounded-xl"
              >
                <div className="text-sm font-bold font-mono-num text-[#028A3F] mb-2">
                  {step.num}.
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Part B: Direct Channels + Quick Application Form */}
        <div id="quick-apply" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Left: Fast Consultation Channels */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-[#028A3F] mb-1.5">
                03. 빠른 상담 채널 연결
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
                편하신 채널로 바로 시세 문의하세요
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                바코드 이미지 전송이나 대량 매입 상담은 카카오톡 채널·네이버 톡톡에서 가장 빠르게 응대해 드립니다.
              </p>
            </div>

            {/* KakaoTalk Channel Card */}
            <div className="p-5 bg-[#FFFDF0] border border-amber-300/60 rounded-xl">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MessageCircle className="w-5 h-5 text-[#3C1E1E]" />
                  카카오톡 채널 실시간 상담
                </div>
                <span className="text-xs font-mono-num text-slate-600">평균 1분 응답</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 mb-4">
                채널 ID <strong className="text-slate-900">{settings.kakaoChannelId}</strong> · 모바일 기프티콘 사진 전송 및 즉시 정산
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChannelModal('kakao')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#191919] bg-[#FEE500] hover:bg-[#F5DC00] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  카카오톡 상담 시작
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('kakao', settings.kakaoChannelId)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copiedKey === 'kakao' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#028A3F]" />
                      ID 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      채널 ID 복사
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Naver TalkTalk Channel Card */}
            <div className="p-5 bg-[#F4FBF7] border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MessageSquareText className="w-5 h-5 text-[#028A3F]" />
                  네이버 톡톡 실시간 문의
                </div>
                <span className="text-xs text-[#028A3F] font-medium">별도 앱 설치 불필요</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 mb-4">
                네이버 아이디로 로그인 상태라면 클릭 한 번으로 시세 확정 및 거래 예약이 가능합니다.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChannelModal('naver')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  네이버 톡톡 열기
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`tel:${settings.phoneNumber.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {settings.phoneNumber}
                </a>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>운영시간 · {settings.operatingHours}</p>
              <p>{settings.businessRegistration}</p>
            </div>
          </div>

          {/* Right: Quick Application Form */}
          <div className="lg:col-span-7 bg-[#F8FAFB] border border-slate-200 rounded-xl p-5 sm:p-7">
            <div className="mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                간편 매입·구매 신청 폼
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                아래 내용을 남겨 주시면 관리자 확인 즉시 선택하신 상담 채널로 확정 안내를 드립니다.
              </p>
            </div>

            {submittedReceipt ? (
              <div className="bg-white border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#03C75A] mx-auto mb-3" />
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  신청이 정상적으로 접수되었습니다
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  담당 매니저가 확인 후 <strong>{submittedReceipt.channelPreference}</strong> 채널로 5분 이내 연락드리겠습니다.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs sm:text-sm space-y-1.5 mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">접수번호</span>
                    <span className="font-mono-num font-semibold text-slate-900">
                      {submittedReceipt.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">신청 상품권</span>
                    <span className="font-medium text-slate-900">
                      {submittedReceipt.voucherName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">예상 정산 금액</span>
                    <span className="font-mono-num font-bold text-[#028A3F]">
                      {submittedReceipt.estimatedPayout.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenChannelModal('kakao')}
                    className="px-4 py-2.5 text-xs font-semibold text-[#191919] bg-[#FEE500] hover:bg-[#F5DC00] rounded-lg cursor-pointer"
                  >
                    카카오톡으로 바코드 바로 보내기
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmittedReceipt(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    추가 신청 작성
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inquiry Type Segmented Selector */}
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">
                    신청 구분
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {INQUIRY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInquiryType(type)}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                          inquiryType === type
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="apply-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      성함 (또는 예금주) *
                    </label>
                    <input
                      id="apply-name"
                      type="text"
                      required
                      maxLength={SCHEMA_LIMITS.inquiry.customerNameMax}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="예: 김민수"
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="apply-contact"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      연락처 (휴대폰 또는 카톡 ID) *
                    </label>
                    <input
                      id="apply-contact"
                      type="text"
                      required
                      maxLength={SCHEMA_LIMITS.inquiry.contactMax}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="010-0000-0000 또는 카톡 ID"
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label
                      htmlFor="apply-voucher"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      상품권 품목 *
                    </label>
                    <select
                      id="apply-voucher"
                      value={voucherName}
                      onChange={(e) => setVoucherName(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                    >
                      {rates.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.buyRate.toFixed(1)}%)
                        </option>
                      ))}
                      <option value="기타 상품권 / 복합 권종">기타 상품권 / 복합 권종</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="apply-face"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      총 액면가 (원) *
                    </label>
                    <input
                      id="apply-face"
                      type="number"
                      required
                      min={1000}
                      max={1000000000}
                      step={1000}
                      value={faceValue}
                      onChange={(e) => setFaceValue(Math.max(1000, Number(e.target.value) || 0))}
                      className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="apply-qty"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      매수
                    </label>
                    <input
                      id="apply-qty"
                      type="number"
                      min={1}
                      max={10000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                    />
                  </div>
                </div>

                {/* Preferred Channel */}
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">
                    희망 회신 채널
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_PREFERENCES.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannelPreference(ch)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                          channelPreference === ch
                            ? 'bg-[#03C75A]/10 text-[#027A37] border-[#03C75A] font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="apply-message"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    상세 메모 (권종 구성, 방문/등기 여부, 문의 사항 등)
                  </label>
                  <textarea
                    id="apply-message"
                    rows={3}
                    maxLength={SCHEMA_LIMITS.inquiry.messageMax}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="예: 신세계 10만원권 3장, 오늘 오후 3시경 방문 또는 모바일 즉시 접수 희망합니다."
                    className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#03C75A]"
                  />
                </div>

                {/* Live Estimated Payout Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-white border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600">
                    현재 실시간 시세 기준 예상 정산액
                    {matchedRate ? ` (${matchedRate.buyRate.toFixed(1)}% 적용)` : ''}
                  </span>
                  <span className="text-base font-bold font-mono-num text-[#028A3F]">
                    약 {computedPayout.toLocaleString()}원
                  </span>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? '신청서 접수 중...' : '간편 매입·상담 신청 접수하기'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
