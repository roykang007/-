import { useMemo, useState } from 'react';
import { ArrowUpDown, Calculator, Search, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { VOUCHER_CATEGORIES, VoucherCategory, VoucherRate } from '../types';

interface LiveRatesSectionProps {
  rates: VoucherRate[];
  loading: boolean;
  lastUpdatedText: string;
  onSelectForApplication: (payload: {
    voucherName: string;
    buyRate: number;
    faceValue: number;
    quantity: number;
    estimatedPayout: number;
  }) => void;
}

const DENOMINATION_PRESETS = [10000, 30000, 50000, 100000, 500000];

export function LiveRatesSection({
  rates,
  loading,
  lastUpdatedText,
  onSelectForApplication,
}: LiveRatesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<VoucherCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'rateDesc'>('order');

  // Calculator state
  const [calcRateId, setCalcRateId] = useState<string>(rates[0]?.id ?? '');
  const [unitFaceValue, setUnitFaceValue] = useState<number>(100000);
  const [quantity, setQuantity] = useState<number>(1);

  const activeCalcRate = useMemo(() => {
    return rates.find((r) => r.id === calcRateId) ?? rates[0];
  }, [rates, calcRateId]);

  const totalFaceValue = unitFaceValue * quantity;
  const estimatedPayout = activeCalcRate
    ? Math.floor((totalFaceValue * activeCalcRate.buyRate) / 100)
    : 0;
  const feeAmount = totalFaceValue - estimatedPayout;

  const filteredRates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rates.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.brand.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.voucherType.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q)
      );
    });
    if (sortBy === 'rateDesc') {
      return [...list].sort((a, b) => b.buyRate - a.buyRate);
    }
    return list;
  }, [rates, selectedCategory, searchQuery, sortBy]);

  const handleRowApply = (rate: VoucherRate) => {
    setCalcRateId(rate.id);
    const defaultFace = 100000;
    const payout = Math.floor((defaultFace * rate.buyRate) / 100);
    onSelectForApplication({
      voucherName: rate.name,
      buyRate: rate.buyRate,
      faceValue: defaultFace,
      quantity: 1,
      estimatedPayout: payout,
    });
  };

  const handleCalculatorApply = () => {
    if (!activeCalcRate) return;
    onSelectForApplication({
      voucherName: activeCalcRate.name,
      buyRate: activeCalcRate.buyRate,
      faceValue: totalFaceValue,
      quantity,
      estimatedPayout,
    });
  };

  return (
    <section id="live-rates" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[#028A3F] mb-1.5">
            01. 실시간 상품권 시세표
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            한국 주요 상품권 실시간 매입·판매 시세
          </h2>
        </div>
        <div className="text-xs sm:text-[13px] text-slate-500 font-mono-num">
          최종 시세 업데이트 · {lastUpdatedText}
        </div>
      </div>

      {/* Integrated Live Payout Calculator */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
            <Calculator className="w-4 h-4 text-[#03C75A]" />
            실시간 매입 실수령액 자동 계산기
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            관리자 시세 변경 시 즉시 반영됩니다
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          {/* Voucher selector */}
          <div className="lg:col-span-4">
            <label htmlFor="calc-voucher" className="block text-xs font-medium text-slate-600 mb-1.5">
              상품권 품목 선택
            </label>
            <select
              id="calc-voucher"
              value={activeCalcRate?.id ?? ''}
              onChange={(e) => setCalcRateId(e.target.value)}
              className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A] focus:ring-2 focus:ring-[#03C75A]/15"
            >
              {rates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.buyRate.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Face value preset + input */}
          <div className="lg:col-span-4">
            <label htmlFor="calc-face" className="block text-xs font-medium text-slate-600 mb-1.5">
              1매 액면가 (원)
            </label>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {DENOMINATION_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setUnitFaceValue(val)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    unitFaceValue === val
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {val >= 10000 ? `${val / 10000}만원` : `${val.toLocaleString()}원`}
                </button>
              ))}
            </div>
            <input
              id="calc-face"
              type="number"
              min={1000}
              max={50000000}
              step={1000}
              value={unitFaceValue}
              onChange={(e) => setUnitFaceValue(Math.max(1000, Number(e.target.value) || 0))}
              className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#03C75A]"
            />
          </div>

          {/* Quantity */}
          <div className="lg:col-span-2">
            <label htmlFor="calc-qty" className="block text-xs font-medium text-slate-600 mb-1.5">
              수량 (매)
            </label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-10 bg-white">
              <button
                type="button"
                aria-label="수량 감소"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                -
              </button>
              <input
                id="calc-qty"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                className="w-full h-full text-center text-sm font-mono-num text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                aria-label="수량 증가"
                onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                className="w-10 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Apply CTA */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={handleCalculatorApply}
              disabled={!activeCalcRate || activeCalcRate.status === '일시중단'}
              className="w-full h-10 px-4 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              이 조건으로 신청
            </button>
          </div>
        </div>

        {/* Calculation Output Summary Bar */}
        {activeCalcRate && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                총 액면가{' '}
                <strong className="font-mono-num text-slate-900">
                  {totalFaceValue.toLocaleString()}원
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>
                적용 매입률{' '}
                <strong className="font-mono-num text-[#028A3F]">
                  {activeCalcRate.buyRate.toFixed(1)}%
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>
                수수료 차감{' '}
                <strong className="font-mono-num text-slate-700">
                  -{feeAmount.toLocaleString()}원
                </strong>
              </span>
            </div>

            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-500">예상 계좌 입금액</span>
              <span className="text-xl sm:text-2xl font-bold font-mono-num text-[#028A3F]">
                {estimatedPayout.toLocaleString()}원
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs + Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div
          role="tablist"
          aria-label="상품권 카테고리"
          className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto"
        >
          {VOUCHER_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="롯데, 신세계, 스타벅스 검색..."
              aria-label="상품권 검색"
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#03C75A]"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'order' ? 'rateDesc' : 'order'))}
            className="h-10 px-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            {sortBy === 'order' ? '기본순' : '매입률순'}
          </button>
        </div>
      </div>

      {/* Live Rate Table (Desktop) + Clean Card List (Mobile) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-11 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              검색 조건에 맞는 상품권 시세가 없습니다.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              다른 브랜드명이나 카테고리를 선택해 보세요.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              전체 시세 보기
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 pl-5 pr-3">상품권명 / 취급 권종</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">유형</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">매입 시세</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">10만원 매입가</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">전일 대비</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">판매 시세</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">상태</th>
                    <th className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">신청</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRates.map((rate) => {
                    const payout100k = Math.round(rate.buyRate * 1000);
                    const isPaused = rate.status === '일시중단';
                    return (
                      <tr
                        key={rate.id}
                        className="hover:bg-emerald-50/35 transition-colors"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="font-semibold text-slate-900">{rate.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {rate.denominations}
                            {rate.note ? ` · ${rate.note}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {rate.voucherType}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono-num font-bold text-base text-[#028A3F] whitespace-nowrap">
                          {rate.buyRate.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                          {payout100k.toLocaleString()}원
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono-num text-xs whitespace-nowrap">
                          {rate.changeDelta > 0 ? (
                            <span className="inline-flex items-center justify-end gap-0.5 font-medium text-red-600">
                              <TrendingUp className="w-3.5 h-3.5" />
                              +{rate.changeDelta.toFixed(1)}%p
                            </span>
                          ) : rate.changeDelta < 0 ? (
                            <span className="inline-flex items-center justify-end gap-0.5 font-medium text-blue-600">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {rate.changeDelta.toFixed(1)}%p
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-end gap-0.5 text-slate-400">
                              <Minus className="w-3 h-3" />
                              보합
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono-num text-slate-600 whitespace-nowrap">
                          {rate.sellRate.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-3 text-xs font-medium whitespace-nowrap">
                          <span
                            className={
                              rate.status === '우대매입'
                                ? 'text-[#028A3F] font-semibold'
                                : rate.status === '일시중단'
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                            }
                          >
                            {rate.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isPaused}
                            onClick={() => handleRowApply(rate)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-[#03C75A] hover:text-white disabled:opacity-40 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {isPaused ? '일시중단' : '바로 신청'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Optimized List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredRates.map((rate) => {
                const payout100k = Math.round(rate.buyRate * 1000);
                const isPaused = rate.status === '일시중단';
                return (
                  <div key={rate.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">
                          {rate.brand} · {rate.voucherType} ·{' '}
                          <span
                            className={
                              rate.status === '우대매입'
                                ? 'text-[#028A3F] font-semibold'
                                : rate.status === '일시중단'
                                  ? 'text-red-600 font-semibold'
                                  : 'text-slate-600'
                            }
                          >
                            {rate.status}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-900 mt-0.5">
                          {rate.name}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono-num text-[#028A3F]">
                          {rate.buyRate.toFixed(1)}%
                        </div>
                        <div className="text-xs font-mono-num text-slate-600">
                          10만당 {payout100k.toLocaleString()}원
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">
                      {rate.denominations}
                      {rate.note ? ` · ${rate.note}` : ''}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-xs font-mono-num text-slate-500 flex items-center gap-3">
                        <span>판매 {rate.sellRate.toFixed(1)}%</span>
                        <span
                          className={
                            rate.changeDelta > 0
                              ? 'text-red-600 font-medium'
                              : rate.changeDelta < 0
                                ? 'text-blue-600 font-medium'
                                : 'text-slate-400'
                          }
                        >
                          {rate.changeDelta > 0
                            ? `▲ +${rate.changeDelta.toFixed(1)}%p`
                            : rate.changeDelta < 0
                              ? `▼ ${rate.changeDelta.toFixed(1)}%p`
                              : '보합'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isPaused}
                        onClick={() => handleRowApply(rate)}
                        className="px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {isPaused ? '일시중단' : '바로 신청'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
