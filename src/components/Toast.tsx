'use client';

import { create } from 'zustand';
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const existing = get().toasts;
    // Deduplicate identical message within active toasts
    if (existing.some((t) => t.kind === kind && t.message === message)) {
      return;
    }
    const id = nextId++;
    // Keep max 4 toasts visible
    const newToasts = [...existing.slice(-3), { id, kind, message }];
    set({ toasts: newToasts });

    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToast.getState().push('success', m),
  error: (m: string) => useToast.getState().push('error', m),
  info: (m: string) => useToast.getState().push('info', m),
  warning: (m: string) => useToast.getState().push('warning', m),
};

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex flex-col items-center gap-2.5 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3.5 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4',
            t.kind === 'success' && 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100 shadow-emerald-950/50',
            t.kind === 'error' && 'border-red-500/40 bg-red-950/85 text-red-100 shadow-red-950/60',
            t.kind === 'warning' && 'border-amber-500/30 bg-amber-950/80 text-amber-100 shadow-amber-950/50',
            t.kind === 'info' && 'border-purple-500/30 bg-purple-950/80 text-purple-100 shadow-purple-950/50',
          )}
        >
          {t.kind === 'success' && (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
          )}
          {t.kind === 'error' && (
            <XCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
          )}
          {t.kind === 'warning' && (
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
          )}
          {t.kind === 'info' && (
            <Info size={20} className="mt-0.5 shrink-0 text-purple-400" />
          )}
          <p className="flex-1 text-xs font-semibold leading-relaxed">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
