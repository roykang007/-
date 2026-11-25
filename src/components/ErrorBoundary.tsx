import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '', isQuotaError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const raw = error?.message || '알 수 없는 오류가 발생했습니다.';
    const isQuotaError = raw.toLowerCase().includes('quota exceeded');
    return {
      hasError: true,
      errorMessage: raw,
      isQuotaError,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', isQuotaError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F6F8F9] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h1 className="text-lg font-bold text-slate-900">일시적인 연결 오류가 발생했습니다</h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {this.state.isQuotaError
              ? '데이터베이스 무료 일일 사용량 한도에 도달했습니다. 익일 자동으로 초기화됩니다.'
              : '실시간 시세 또는 데이터베이스 요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
          </p>
          <div className="text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 break-all mb-6">
            {this.state.errorMessage.slice(0, 240)}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            화면 다시 불러오기
          </button>
        </div>
      </div>
    );
  }
}
