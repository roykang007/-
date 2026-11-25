import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type ActivePage = 'blog' | 'admin';

interface TopBarProps {
  activePage: ActivePage;
  onNavigatePage: (page: ActivePage) => void;
  onJumpSection: (sectionId: string) => void;
}

export function TopBar({ activePage, onNavigatePage, onJumpSection }: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    if (activePage !== 'blog') {
      onNavigatePage('blog');
      setTimeout(() => onJumpSection(sectionId), 60);
    } else {
      onJumpSection(sectionId);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Clean single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onNavigatePage('blog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-[#03C75A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03C75A]"
        >
          청상품권
        </button>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav aria-label="주 메뉴" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleLinkClick('live-rates')}
            className="hover:text-slate-900 hover:underline underline-offset-8 decoration-[#03C75A] decoration-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            실시간 시세
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('trade-process')}
            className="hover:text-slate-900 hover:underline underline-offset-8 decoration-[#03C75A] decoration-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            거래 절차
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('quick-apply')}
            className="hover:text-slate-900 hover:underline underline-offset-8 decoration-[#03C75A] decoration-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            간편 신청
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('blog-guides')}
            className="hover:text-slate-900 hover:underline underline-offset-8 decoration-[#03C75A] decoration-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            매입 가이드
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigatePage(activePage === 'admin' ? 'blog' : 'admin');
            }}
            className={`hover:underline underline-offset-8 decoration-[#03C75A] decoration-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePage === 'admin' ? 'text-[#029E47] font-semibold' : 'hover:text-slate-900'
            }`}
          >
            관리자
          </button>
        </nav>

        {/* Zone 3: Single primary CTA action + mobile menu trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {activePage === 'admin' ? (
            <button
              type="button"
              onClick={() => onNavigatePage('blog')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              블로그 보기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleLinkClick('quick-apply')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              바로 매입 신청
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => handleLinkClick('live-rates')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            실시간 시세표 및 자동 계산기
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('trade-process')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            한눈에 보는 거래 절차
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('quick-apply')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            카톡·톡톡 상담 및 간편 신청
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('blog-guides')}
            className="w-full text-left px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            상세 매입 가이드 블로그
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigatePage(activePage === 'admin' ? 'blog' : 'admin');
            }}
            className="w-full text-left px-3 py-3 text-sm font-semibold text-[#029E47] hover:bg-emerald-50/60 rounded-lg"
          >
            {activePage === 'admin' ? '공개 블로그로 돌아가기' : '관리자 페이지 (시세·문의 관리)'}
          </button>
        </div>
      )}
    </header>
  );
}
