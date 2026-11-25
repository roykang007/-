import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogGuidesSection } from './components/BlogGuidesSection';
import { ChannelModal } from './components/ChannelModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeroBanner } from './components/HeroBanner';
import { LiveRatesSection } from './components/LiveRatesSection';
import { PrefilledApplication, ProcessAndApplySection } from './components/ProcessAndApplySection';
import { ActivePage, TopBar } from './components/TopBar';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_VOUCHER_RATES,
} from './data/defaultData';
import { fetchPublicStateApi } from './services/adminApi';
import { BlogPost, StoreSettings, VoucherRate } from './types';

function MainApp() {
  const [activePage, setActivePage] = useState<ActivePage>('blog');
  // In-memory only admin Bearer session token (never stored in localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [rates, setRates] = useState<VoucherRate[]>(DEFAULT_VOUCHER_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [prefill, setPrefill] = useState<PrefilledApplication | null>(null);
  const [activeChannelModal, setActiveChannelModal] = useState<'kakao' | 'naver' | null>(null);

  const refreshPublicState = useCallback(async () => {
    try {
      const data = await fetchPublicStateApi();
      setRates(data.rates);
      setSettings(data.settings);
      setPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch public state:', err);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublicState();
  }, [refreshPublicState]);

  const lastUpdatedText = useMemo(() => {
    const latestDate = rates.reduce<Date | null>((latest, r) => {
      if (!r.updatedAt) return latest;
      if (!latest || r.updatedAt.getTime() > latest.getTime()) return r.updatedAt;
      return latest;
    }, null);

    const ref = latestDate ?? new Date();
    return ref.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [rates]);

  const jumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectForApplication = (payload: {
    voucherName: string;
    buyRate: number;
    faceValue: number;
    quantity: number;
    estimatedPayout: number;
  }) => {
    setPrefill({
      ...payload,
      timestamp: Date.now(),
    });
    jumpToSection('quick-apply');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F9] text-[#111827]">
      <TopBar
        activePage={activePage}
        onNavigatePage={setActivePage}
        onJumpSection={jumpToSection}
      />

      <main className="flex-1">
        {activePage === 'admin' ? (
          <AdminDashboard
            adminToken={adminToken}
            onSetAdminToken={setAdminToken}
            rates={rates}
            posts={posts}
            settings={settings}
            onRefreshPublicState={refreshPublicState}
            onExitAdmin={() => setActivePage('blog')}
          />
        ) : (
          <>
            <HeroBanner
              rates={rates}
              settings={settings}
              lastUpdatedText={lastUpdatedText}
              onJumpSection={jumpToSection}
              onOpenChannelModal={setActiveChannelModal}
            />

            <LiveRatesSection
              rates={rates}
              loading={ratesLoading}
              lastUpdatedText={lastUpdatedText}
              onSelectForApplication={handleSelectForApplication}
            />

            <ProcessAndApplySection
              rates={rates}
              settings={settings}
              prefill={prefill}
              onOpenChannelModal={setActiveChannelModal}
            />

            <BlogGuidesSection
              posts={posts}
              settings={settings}
              onJumpApply={() => jumpToSection('quick-apply')}
            />
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900">
              청상품권 <span className="font-normal text-slate-500 ml-1">({settings.blogTitle})</span>
            </div>
            <p className="text-xs text-slate-600">
              대표: 이명군 · 사업자등록번호: 484-37-01431 · 연락처: <span className="font-mono-num">{settings.phoneNumber}</span>
            </p>
            <p className="text-xs text-slate-500">
              주소: 경기도 부천시 원미구 부일로685번길 40-8, E동502호(역곡동)
            </p>
            <p className="text-xs text-slate-400">
              본 블로그의 매입 시세는 실시간 도매 시세 기준이며, 권종 상태 및 유효기간에 따라 최종 검수 시 일부 조정될 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivePage('blog');
                setTimeout(() => jumpToSection('live-rates'), 50);
              }}
              className="hover:text-slate-900 cursor-pointer"
            >
              실시간 시세
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('blog');
                setTimeout(() => jumpToSection('quick-apply'), 50);
              }}
              className="hover:text-slate-900 cursor-pointer"
            >
              간편 신청
            </button>
            <button
              type="button"
              onClick={() => setActivePage(activePage === 'admin' ? 'blog' : 'admin')}
              className="hover:text-[#028A3F] cursor-pointer"
            >
              {activePage === 'admin' ? '블로그 메인' : '관리자 로그인'}
            </button>
          </div>
        </div>
      </footer>

      <ChannelModal
        channel={activeChannelModal}
        settings={settings}
        onClose={() => setActiveChannelModal(null)}
        onJumpApplyForm={() => jumpToSection('quick-apply')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
