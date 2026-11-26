import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Shakti ERP Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400">
              The application encountered an unexpected runtime error.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl text-left font-mono text-[11px] text-rose-300 border border-slate-800 overflow-x-auto max-h-40">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('shakti_erp_user');
                window.location.reload();
              }}
              className="px-4 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload ERP Console
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
