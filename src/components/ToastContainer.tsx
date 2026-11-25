import React from 'react';
import { usePharma } from '../context/PharmaContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = usePharma();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-slate-700';
        let bgColor = 'bg-slate-900';
        let Icon = Info;
        let iconColor = 'text-cyan-400';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-600';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-600';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-600';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl border ${borderColor} ${bgColor} text-slate-100 shadow-xl flex items-start gap-2.5 text-xs animate-slide-in transition`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1">
              <div className="font-semibold text-white">{toast.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
