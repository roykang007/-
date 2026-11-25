import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, MessageSquareText, X } from 'lucide-react';
import { StoreSettings } from '../types';

interface ChannelModalProps {
  channel: 'kakao' | 'naver' | null;
  settings: StoreSettings;
  onClose: () => void;
  onJumpApplyForm: () => void;
}

export function ChannelModal({
  channel,
  settings,
  onClose,
  onJumpApplyForm,
}: ChannelModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!channel) return null;

  const isKakao = channel === 'kakao';
  const targetUrl = isKakao ? settings.kakaoChannelUrl : settings.naverTalkUrl;
  const safeHref =
    targetUrl && (targetUrl.startsWith('https://') || targetUrl.startsWith('http://'))
      ? targetUrl
      : isKakao
        ? 'https://pf.kakao.com/'
        : 'https://talk.naver.com/';

  const quickTemplate = `[청상품권 매입 상담]\n- 상품권 종류: (예: 롯데/신세계 지류 또는 모바일)\n- 권종 및 수량: (예: 10만원권 2매)\n- 성함 / 연락처: `;

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="channel-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            {isKakao ? (
              <MessageCircle className="w-5 h-5 text-[#3C1E1E]" />
            ) : (
              <MessageSquareText className="w-5 h-5 text-[#03C75A]" />
            )}
            <span id="channel-modal-title">
              {isKakao ? '카카오톡 채널 실시간 상담' : '네이버 톡톡 실시간 문의'}
            </span>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {isKakao
              ? `카카오톡에서 채널 ID (${settings.kakaoChannelId})를 검색하거나 아래 버튼으로 공식 채널에 바로 연결하실 수 있습니다.`
              : '네이버 톡톡으로 연결하시면 별도 앱 설치 없이 상품권 시세 확정 및 매입 접수를 진행할 수 있습니다.'}
          </p>

          {/* Channel ID Copy Row */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">
                {isKakao ? '공식 카카오톡 채널 ID' : '대표 상담 전화번호'}
              </div>
              <div className="text-sm font-bold font-mono-num text-slate-900 truncate">
                {isKakao ? settings.kakaoChannelId : settings.phoneNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy('id', isKakao ? settings.kakaoChannelId : settings.phoneNumber)
              }
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedField === 'id' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#028A3F]" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  복사
                </>
              )}
            </button>
          </div>

          {/* Copyable Message Template */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">빠른 상담 양식 (복사 후 붙여넣기)</span>
              <button
                type="button"
                onClick={() => handleCopy('template', quickTemplate)}
                className="text-xs font-semibold text-[#028A3F] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'template' ? '양식 복사 완료' : '양식 복사하기'}
              </button>
            </div>
            <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">
              {quickTemplate}
            </pre>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition-colors ${
                isKakao
                  ? 'bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919]'
                  : 'bg-[#03C75A] hover:bg-[#02A94C] text-white'
              }`}
            >
              {isKakao ? '카카오톡 공식 채널 열기' : '네이버 톡톡 바로 열기'}
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onJumpApplyForm();
              }}
              className="w-full h-10 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              사이트 내 간편 신청 폼으로 접수하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
