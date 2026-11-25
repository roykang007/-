import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  FileText,
  Inbox,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { createSafeDocId } from '../firebase';
import {
  AdminAuthStatus,
  deleteInquiryApi,
  deletePostApi,
  deleteRateApi,
  fetchAdminInquiriesApi,
  fetchAdminStatusApi,
  loginAdminApi,
  logoutAdminApi,
  savePostApi,
  saveRateApi,
  saveSettingsApi,
  setupAdminPasswordApi,
  updateInquiryApi,
} from '../services/adminApi';
import {
  BlogPost,
  CustomerInquiry,
  INQUIRY_STATUSES,
  InquiryStatus,
  POST_CATEGORIES,
  PostCategory,
  PostImageKey,
  RATE_STATUSES,
  RateStatus,
  SCHEMA_LIMITS,
  StoreSettings,
  VOUCHER_CATEGORIES,
  VOUCHER_TYPES,
  VoucherCategory,
  VoucherRate,
  VoucherType,
} from '../types';

type AdminTab = 'rates' | 'inquiries' | 'settings' | 'posts';

interface AdminDashboardProps {
  adminToken: string | null;
  onSetAdminToken: (token: string | null) => void;
  rates: VoucherRate[];
  posts: BlogPost[];
  settings: StoreSettings;
  onRefreshPublicState: () => Promise<void>;
  onExitAdmin: () => void;
}

export function AdminDashboard({
  adminToken,
  onSetAdminToken,
  rates,
  posts,
  settings,
  onRefreshPublicState,
  onExitAdmin,
}: AdminDashboardProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Login / First-run setup form state
  const [loginId, setLoginId] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('rates');
  const [toast, setToast] = useState<string | null>(null);

  // Rates editing local drafts
  const [rateDrafts, setRateDrafts] = useState<Record<string, VoucherRate>>({});
  const [savingRateId, setSavingRateId] = useState<string | null>(null);
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState<{
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
  }>({
    brand: '',
    name: '',
    category: 'department',
    voucherType: '지류',
    denominations: '1만원 / 5만원 / 10만원',
    buyRate: 95.0,
    sellRate: 96.8,
    changeDelta: 0,
    status: '매입가능',
    note: '',
  });

  // Inquiries state
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<InquiryStatus | 'all'>('all');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<InquiryStatus>('접수대기');
  const [savingInquiry, setSavingInquiry] = useState(false);

  // Store settings draft
  const [settingsDraft, setSettingsDraft] = useState<StoreSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Blog post editor draft
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postDraft, setPostDraft] = useState<{
    title: string;
    category: PostCategory;
    summary: string;
    content: string;
    imageKey: PostImageKey;
    readMinutes: number;
    publishedDate: string;
    isPinned: boolean;
  }>({
    title: '',
    category: '매입 가이드',
    summary: '',
    content: '',
    imageKey: 'department',
    readMinutes: 3,
    publishedDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    isPinned: false,
  });
  const [savingPost, setSavingPost] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load server admin auth status
  useEffect(() => {
    let active = true;
    fetchAdminStatusApi()
      .then((res) => {
        if (!active) return;
        setAuthStatus(res);
        setLoginId(res.adminId || 'admin');
      })
      .catch((err) => {
        console.error(err);
        if (active) setAuthError('관리자 인증 서버 상태를 확인하지 못했습니다.');
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync rate drafts when rates update
  useEffect(() => {
    const map: Record<string, VoucherRate> = {};
    for (const r of rates) {
      map[r.id] = { ...r };
    }
    setRateDrafts(map);
  }, [rates]);

  // Sync settings draft
  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  const loadInquiries = useCallback(async () => {
    if (!adminToken) return;
    setInquiriesLoading(true);
    try {
      const list = await fetchAdminInquiriesApi(adminToken);
      setInquiries(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('만료') || msg.includes('인증')) {
        onSetAdminToken(null);
      } else {
        showToast('문의 목록을 불러오지 못했습니다.');
      }
    } finally {
      setInquiriesLoading(false);
    }
  }, [adminToken, onSetAdminToken]);

  useEffect(() => {
    if (adminToken) {
      void loadInquiries();
    } else {
      setInquiries([]);
    }
  }, [adminToken, loadInquiries]);

  const selectedInquiry = useMemo(
    () => inquiries.find((i) => i.id === selectedInquiryId) ?? null,
    [inquiries, selectedInquiryId]
  );

  useEffect(() => {
    if (!selectedInquiry) return;
    setStatusDraft(selectedInquiry.status);
    setMemoDraft(selectedInquiry.adminMemo);
  }, [selectedInquiry]);

  const filteredInquiries = useMemo(() => {
    if (inquiryFilter === 'all') return inquiries;
    return inquiries.filter((i) => i.status === inquiryFilter);
  }, [inquiries, inquiryFilter]);

  const pendingCount = useMemo(
    () => inquiries.filter((i) => i.status === '접수대기').length,
    [inquiries]
  );

  const handleFirstRunSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (loginPassword.length < 4) {
      setAuthError('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (loginPassword !== confirmPassword) {
      setAuthError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await setupAdminPasswordApi(loginId.trim(), loginPassword);
      onSetAdminToken(res.token);
      setAuthStatus({ configured: true, mode: 'claimed', adminId: res.adminId });
      setLoginPassword('');
      setConfirmPassword('');
      showToast('관리자 비밀번호가 안전하게 등록되었습니다.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '초기 설정에 실패했습니다.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginId.trim() || !loginPassword) {
      setAuthError('관리자 ID와 비밀번호를 입력해 주세요.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await loginAdminApi(loginId.trim(), loginPassword);
      onSetAdminToken(res.token);
      setLoginPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      await logoutAdminApi(adminToken);
    }
    onSetAdminToken(null);
    setLoginPassword('');
  };

  const handleUpdateRateDraft = (id: string, patch: Partial<VoucherRate>) => {
    setRateDrafts((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return { ...prev, [id]: { ...target, ...patch } };
    });
  };

  const handleSaveRateRow = async (id: string) => {
    if (!adminToken) return;
    const draft = rateDrafts[id];
    if (!draft) return;
    setSavingRateId(id);
    try {
      await saveRateApi(adminToken, draft);
      await onRefreshPublicState();
      showToast(`"${draft.name}" 시세가 실시간 반영되었습니다.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '시세 저장에 실패했습니다.');
    } finally {
      setSavingRateId(null);
    }
  };

  const handleDeleteRateRow = async (id: string, name: string) => {
    if (!adminToken) return;
    setSavingRateId(id);
    try {
      await deleteRateApi(adminToken, id);
      await onRefreshPublicState();
      showToast(`"${name}" 품목이 삭제되었습니다.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setSavingRateId(null);
    }
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !newRate.brand.trim() || !newRate.name.trim()) return;
    setSavingRateId('new');
    try {
      await saveRateApi(adminToken, {
        id: createSafeDocId('rate'),
        ...newRate,
        sortOrder: rates.length + 1,
      });
      await onRefreshPublicState();
      setShowAddRate(false);
      setNewRate({
        brand: '',
        name: '',
        category: 'department',
        voucherType: '지류',
        denominations: '1만원 / 5만원 / 10만원',
        buyRate: 95.0,
        sellRate: 96.8,
        changeDelta: 0,
        status: '매입가능',
        note: '',
      });
      showToast('새 상품권 시세가 추가되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '품목 추가에 실패했습니다.');
    } finally {
      setSavingRateId(null);
    }
  };

  const handleSaveInquiryUpdate = async () => {
    if (!adminToken || !selectedInquiry) return;
    setSavingInquiry(true);
    try {
      await updateInquiryApi(adminToken, selectedInquiry.id, statusDraft, memoDraft);
      await loadInquiries();
      showToast('문의 상태와 관리자 메모가 저장되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '문의 상태 업데이트에 실패했습니다.');
    } finally {
      setSavingInquiry(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!adminToken) return;
    try {
      await deleteInquiryApi(adminToken, id);
      if (selectedInquiryId === id) setSelectedInquiryId(null);
      await loadInquiries();
      showToast('문의 내역이 삭제되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '문의 삭제에 실패했습니다.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSavingSettings(true);
    try {
      await saveSettingsApi(adminToken, settingsDraft);
      await onRefreshPublicState();
      showToast('상담 채널 및 공지 설정이 실시간 저장되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '설정 저장에 실패했습니다.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !postDraft.title.trim() || !postDraft.content.trim()) return;
    setSavingPost(true);
    try {
      await savePostApi(adminToken, {
        id: editingPostId ?? createSafeDocId('post'),
        ...postDraft,
      });
      await onRefreshPublicState();
      setEditingPostId(null);
      setPostDraft({
        title: '',
        category: '매입 가이드',
        summary: '',
        content: '',
        imageKey: 'department',
        readMinutes: 3,
        publishedDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        isPinned: false,
      });
      showToast('블로그 가이드 글이 저장되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '글 저장에 실패했습니다.');
    } finally {
      setSavingPost(false);
    }
  };

  const handleEditPostClick = (post: BlogPost) => {
    setEditingPostId(post.id);
    setPostDraft({
      title: post.title,
      category: post.category,
      summary: post.summary,
      content: post.content,
      imageKey: post.imageKey,
      readMinutes: post.readMinutes,
      publishedDate: post.publishedDate,
      isPinned: post.isPinned,
    });
  };

  const handleDeletePost = async (id: string) => {
    if (!adminToken) return;
    try {
      await deletePostApi(adminToken, id);
      await onRefreshPublicState();
      showToast('블로그 글이 삭제되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '글 삭제에 실패했습니다.');
    }
  };

  // Loading auth status
  if (statusLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center text-sm text-slate-500">
        관리자 인증 상태를 확인하는 중입니다...
      </div>
    );
  }

  // Unauthenticated Gate: Either First-Run Setup (when ADMIN_PASSWORD env is unset & unclaimed) or ID/Password Login
  if (!adminToken) {
    const needsSetup = authStatus && !authStatus.configured;

    return (
      <div className="max-w-md mx-auto px-4 py-14 sm:py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-2">
            {needsSetup ? (
              <KeyRound className="w-5 h-5 text-[#03C75A]" />
            ) : (
              <Lock className="w-5 h-5 text-slate-800" />
            )}
            <h1 className="text-xl font-bold text-slate-900">
              {needsSetup ? '최초 관리자 비밀번호 설정' : '청상품권 관리자 로그인'}
            </h1>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {needsSetup
              ? '관리자 ID는 admin(대소문자 구분 없음)으로 고정되어 있습니다. 최초 1회 사용하실 관리자 비밀번호를 등록하면 서버에 안전하게 암호화되어 저장됩니다.'
              : '고정 관리자 ID(admin · 대소문자 구분 없음)와 설정하신 비밀번호로 로그인하세요.'}
          </p>

          <form onSubmit={needsSetup ? handleFirstRunSetup : handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-id" className="block text-xs font-medium text-slate-700 mb-1.5">
                관리자 ID (대소문자 구분 없음)
              </label>
              <input
                id="admin-id"
                type="text"
                autoComplete="username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="admin"
                className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                {needsSetup ? '등록할 관리자 비밀번호' : '비밀번호'}
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
              />
            </div>

            {needsSetup && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  비밀번호 확인
                </label>
                <input
                  id="admin-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
                />
              </div>
            )}

            {authError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {authSubmitting
                ? '확인 중...'
                : needsSetup
                  ? '비밀번호 등록 및 관리자 입장'
                  : '관리자 로그인'}
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full h-10 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              공개 블로그로 돌아가기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Admin Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">
            청상품권 운영 콘솔 · 관리자 계정 ({authStatus?.adminId || 'admin'})
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            시세·고객 문의 통합 관리자
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void onRefreshPublicState();
              void loadInquiries();
              showToast('최신 데이터를 다시 불러왔습니다.');
            }}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="mb-5 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#03C75A] shrink-0" />
          {toast}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">등록 상품권 품목</div>
          <div className="text-2xl font-bold font-mono-num text-slate-900">{rates.length}종</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">신규 접수 대기 문의</div>
          <div className="text-2xl font-bold font-mono-num text-[#028A3F]">{pendingCount}건</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">전체 누적 문의</div>
          <div className="text-2xl font-bold font-mono-num text-slate-900">{inquiries.length}건</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">게시된 매입 가이드</div>
          <div className="text-2xl font-bold font-mono-num text-slate-900">{posts.length}편</div>
        </div>
      </div>

      {/* Admin Workspace Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'rates'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          실시간 시세 관리
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'inquiries'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          고객 문의 내역 ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          채널·공지 설정
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          블로그 가이드 관리
        </button>
      </div>

      {/* TAB 1: LIVE RATES MANAGER */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-600">
              매입률·판매률·상태를 수정하고 <strong>저장</strong>을 누르면 공개 블로그 시세표와 계산기에 즉시 반영됩니다.
            </p>
            <button
              type="button"
              onClick={() => setShowAddRate((v) => !v)}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              새 상품권 품목 추가
            </button>
          </div>

          {showAddRate && (
            <form
              onSubmit={handleCreateRate}
              className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">브랜드 *</label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.rate.brandMax}
                  value={newRate.brand}
                  onChange={(e) => setNewRate({ ...newRate, brand: e.target.value })}
                  placeholder="예: 신세계백화점"
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">상품권 품목명 *</label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.rate.nameMax}
                  value={newRate.name}
                  onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                  placeholder="예: 신세계 지류 상품권 (50만원권)"
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">카테고리</label>
                <select
                  value={newRate.category}
                  onChange={(e) =>
                    setNewRate({ ...newRate, category: e.target.value as VoucherCategory })
                  }
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {VOUCHER_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">유형</label>
                <select
                  value={newRate.voucherType}
                  onChange={(e) =>
                    setNewRate({ ...newRate, voucherType: e.target.value as VoucherType })
                  }
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {VOUCHER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">매입 시세 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={50}
                  max={100}
                  value={newRate.buyRate}
                  onChange={(e) => setNewRate({ ...newRate, buyRate: Number(e.target.value) })}
                  className="w-full h-9 px-3 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">판매 시세 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={50}
                  max={100}
                  value={newRate.sellRate}
                  onChange={(e) => setNewRate({ ...newRate, sellRate: Number(e.target.value) })}
                  className="w-full h-9 px-3 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">취급 권종 / 참고 메모</label>
                <input
                  type="text"
                  maxLength={SCHEMA_LIMITS.rate.noteMax}
                  value={newRate.note}
                  onChange={(e) => setNewRate({ ...newRate, note: e.target.value })}
                  placeholder="예: 신권/구권 동일 매입"
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRate(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={savingRateId === 'new'}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg cursor-pointer"
                >
                  품목 등록하기
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 pl-4 pr-2">상품권명</th>
                  <th className="py-3 px-2 w-36">매입률 (%)</th>
                  <th className="py-3 px-2 w-28">판매률 (%)</th>
                  <th className="py-3 px-2 w-24">변동 (%p)</th>
                  <th className="py-3 px-2 w-28">거래 상태</th>
                  <th className="py-3 px-2">안내 메모</th>
                  <th className="py-3 pl-2 pr-4 text-right w-32">저장 / 삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rates.map((r) => {
                  const d = rateDrafts[r.id] ?? r;
                  const busy = savingRateId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pl-4 pr-2">
                        <div className="font-semibold text-slate-900">{d.name}</div>
                        <div className="text-xs text-slate-500">
                          {d.brand} · {d.voucherType}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="0.1% 감소"
                            onClick={() =>
                              handleUpdateRateDraft(r.id, {
                                buyRate: Number(Math.max(50, d.buyRate - 0.1).toFixed(1)),
                                changeDelta: Number((d.changeDelta - 0.1).toFixed(1)),
                              })
                            }
                            className="w-7 h-8 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            min={50}
                            max={100}
                            value={d.buyRate}
                            onChange={(e) =>
                              handleUpdateRateDraft(r.id, { buyRate: Number(e.target.value) })
                            }
                            className="w-16 h-8 px-1.5 text-center font-mono-num font-bold text-[#028A3F] border border-slate-300 rounded"
                          />
                          <button
                            type="button"
                            aria-label="0.1% 증가"
                            onClick={() =>
                              handleUpdateRateDraft(r.id, {
                                buyRate: Number(Math.min(100, d.buyRate + 0.1).toFixed(1)),
                                changeDelta: Number((d.changeDelta + 0.1).toFixed(1)),
                              })
                            }
                            className="w-7 h-8 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="0.1"
                          min={50}
                          max={100}
                          value={d.sellRate}
                          onChange={(e) =>
                            handleUpdateRateDraft(r.id, { sellRate: Number(e.target.value) })
                          }
                          className="w-20 h-8 px-2 text-right font-mono-num border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="0.1"
                          min={-20}
                          max={20}
                          value={d.changeDelta}
                          onChange={(e) =>
                            handleUpdateRateDraft(r.id, { changeDelta: Number(e.target.value) })
                          }
                          className="w-16 h-8 px-1.5 text-right font-mono-num border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={d.status}
                          onChange={(e) =>
                            handleUpdateRateDraft(r.id, { status: e.target.value as RateStatus })
                          }
                          className="h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                        >
                          {RATE_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.rate.noteMax}
                          value={d.note}
                          onChange={(e) => handleUpdateRateDraft(r.id, { note: e.target.value })}
                          className="w-full h-8 px-2 text-xs border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleSaveRateRow(r.id)}
                            className="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-300 rounded cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            저장
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`${d.name} 삭제`}
                            onClick={() => handleDeleteRateRow(r.id, d.name)}
                            className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER INQUIRIES MANAGER */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', ...INQUIRY_STATUSES] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInquiryFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    inquiryFilter === st
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {st === 'all' ? '전체' : st}
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">문의 내역 불러오는 중...</div>
              ) : filteredInquiries.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  해당 상태의 고객 문의 내역이 아직 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredInquiries.map((inq) => {
                    const active = inq.id === selectedInquiryId;
                    return (
                      <button
                        key={inq.id}
                        type="button"
                        onClick={() => setSelectedInquiryId(inq.id)}
                        className={`w-full text-left p-4 transition-colors cursor-pointer ${
                          active ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs text-slate-500">
                            <span
                              className={
                                inq.status === '접수대기'
                                  ? 'text-[#028A3F] font-semibold'
                                  : inq.status === '상담중'
                                    ? 'text-amber-700 font-semibold'
                                    : inq.status === '입금완료'
                                      ? 'text-slate-700 font-semibold'
                                      : 'text-red-600'
                              }
                            >
                              {inq.status}
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>{inq.inquiryType}</span>
                            <span className="mx-1.5">·</span>
                            <span>{inq.channelPreference}</span>
                          </div>
                          <span className="text-[11px] font-mono-num text-slate-400">
                            {inq.createdAt
                              ? inq.createdAt.toLocaleString('ko-KR', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '방금 전'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-3">
                          <div className="font-semibold text-sm text-slate-900 truncate">
                            {inq.customerName} ({inq.contact}) — {inq.voucherName}
                          </div>
                          <div className="text-sm font-bold font-mono-num text-[#028A3F] shrink-0">
                            {inq.estimatedPayout.toLocaleString()}원
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Inquiry Inspector */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
            {!selectedInquiry ? (
              <div className="py-12 text-center text-sm text-slate-500">
                좌측 목록에서 고객 문의를 선택하면 상세 정보와 상태 변경 패널이 표시됩니다.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-mono-num text-slate-400">{selectedInquiry.id}</div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedInquiry.customerName} · {selectedInquiry.inquiryType}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    aria-label="문의 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <dt className="text-slate-500 text-xs">연락처</dt>
                    <dd className="font-mono-num font-semibold text-slate-900 mt-0.5">
                      {selectedInquiry.contact}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">희망 채널</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {selectedInquiry.channelPreference}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500 text-xs">상품권 / 수량</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {selectedInquiry.voucherName} ({selectedInquiry.quantity}매)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">액면가 총액</dt>
                    <dd className="font-mono-num font-semibold text-slate-900 mt-0.5">
                      {selectedInquiry.faceValue.toLocaleString()}원
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">예상 정산액</dt>
                    <dd className="font-mono-num font-bold text-[#028A3F] mt-0.5">
                      {selectedInquiry.estimatedPayout.toLocaleString()}원
                    </dd>
                  </div>
                </dl>

                {selectedInquiry.message && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      처리 상태 변경
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {INQUIRY_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusDraft(st)}
                          className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                            statusDraft === st
                              ? 'bg-[#03C75A] text-white border-[#03C75A]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-memo"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      관리자 내부 메모 (송금 완료 시간, 계좌 확인 등)
                    </label>
                    <textarea
                      id="admin-memo"
                      rows={3}
                      maxLength={SCHEMA_LIMITS.inquiry.adminMemoMax}
                      value={memoDraft}
                      onChange={(e) => setMemoDraft(e.target.value)}
                      placeholder="예: 14:22 신한은행 본인 계좌 287,400원 송금 완료"
                      className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#03C75A]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={savingInquiry}
                    onClick={handleSaveInquiryUpdate}
                    className="w-full h-10 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingInquiry ? '저장 중...' : '상태 및 메모 저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHANNEL & NOTICE SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            카카오톡·네이버 톡톡 링크 및 블로그 공지 설정
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">블로그 타이틀</label>
            <input
              type="text"
              required
              maxLength={SCHEMA_LIMITS.settings.blogTitleMax}
              value={settingsDraft.blogTitle}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, blogTitle: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">상단 실시간 공지 문구</label>
            <input
              type="text"
              maxLength={SCHEMA_LIMITS.settings.noticeBannerMax}
              value={settingsDraft.noticeBanner}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, noticeBanner: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">카카오톡 채널 ID</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.settings.kakaoIdMax}
                value={settingsDraft.kakaoChannelId}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, kakaoChannelId: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">대표 상담 전화번호</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.settings.phoneMax}
                value={settingsDraft.phoneNumber}
                onChange={(e) => setSettingsDraft({ ...settingsDraft, phoneNumber: e.target.value })}
                className="w-full h-10 px-3 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">카카오톡 채널 URL</label>
            <input
              type="url"
              maxLength={SCHEMA_LIMITS.settings.urlMax}
              value={settingsDraft.kakaoChannelUrl}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, kakaoChannelUrl: e.target.value })
              }
              className="w-full h-10 px-3 text-sm font-mono-num border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">네이버 톡톡 URL</label>
            <input
              type="url"
              maxLength={SCHEMA_LIMITS.settings.urlMax}
              value={settingsDraft.naverTalkUrl}
              onChange={(e) => setSettingsDraft({ ...settingsDraft, naverTalkUrl: e.target.value })}
              className="w-full h-10 px-3 text-sm font-mono-num border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">운영 시간 안내</label>
            <input
              type="text"
              required
              maxLength={SCHEMA_LIMITS.settings.operatingHoursMax}
              value={settingsDraft.operatingHours}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, operatingHours: e.target.value })
              }
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">사업자 등록 및 위치 표기</label>
            <input
              type="text"
              required
              maxLength={SCHEMA_LIMITS.settings.businessRegistrationMax}
              value={settingsDraft.businessRegistration}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, businessRegistration: e.target.value })
              }
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="h-10 px-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-400 rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? '저장 중...' : '설정 즉시 반영'}
          </button>
        </form>
      )}

      {/* TAB 4: BLOG GUIDES MANAGER */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">등록된 블로그 글 ({posts.length})</span>
              <button
                type="button"
                onClick={() => {
                  setEditingPostId(null);
                  setPostDraft({
                    title: '',
                    category: '매입 가이드',
                    summary: '',
                    content: '',
                    imageKey: 'department',
                    readMinutes: 3,
                    publishedDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
                    isPinned: false,
                  });
                }}
                className="text-xs font-semibold text-[#028A3F] hover:underline cursor-pointer"
              >
                + 새 글 쓰기
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {posts.map((post) => (
                <div key={post.id} className="p-4 flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditPostClick(post)}
                    className="text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="text-xs text-slate-500">
                      {post.category} · {post.publishedDate}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2 hover:text-[#028A3F]">
                      {post.title}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="글 삭제"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSavePost}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingPostId ? '매입 가이드 글 수정' : '새 매입 가이드 포스팅 작성'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">카테고리</label>
                <select
                  value={postDraft.category}
                  onChange={(e) =>
                    setPostDraft({ ...postDraft, category: e.target.value as PostCategory })
                  }
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  {POST_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">대표 이미지 테마</label>
                <select
                  value={postDraft.imageKey}
                  onChange={(e) =>
                    setPostDraft({ ...postDraft, imageKey: e.target.value as PostImageKey })
                  }
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="department">백화점 지류 상품권</option>
                  <option value="mobile">모바일 기프티콘</option>
                  <option value="culture">문화·도서상품권</option>
                  <option value="hero">청상품권 상담 데스크</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">제목 *</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.post.titleMax}
                value={postDraft.title}
                onChange={(e) => setPostDraft({ ...postDraft, title: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">요약 설명 *</label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.post.summaryMax}
                value={postDraft.summary}
                onChange={(e) => setPostDraft({ ...postDraft, summary: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">본문 내용 *</label>
              <textarea
                rows={7}
                required
                maxLength={SCHEMA_LIMITS.post.contentMax}
                value={postDraft.content}
                onChange={(e) => setPostDraft({ ...postDraft, content: e.target.value })}
                className="w-full p-3 text-sm border border-slate-300 rounded-lg leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={postDraft.isPinned}
                  onChange={(e) => setPostDraft({ ...postDraft, isPinned: e.target.checked })}
                  className="rounded border-slate-300"
                />
                블로그 상단 고정
              </label>
              <button
                type="submit"
                disabled={savingPost}
                className="h-10 px-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-400 rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingPost ? '저장 중...' : '포스팅 발행'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
