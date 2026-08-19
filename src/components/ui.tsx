'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------- Button ---------- */

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tealOutline'
  | 'coralOutline'
  | 'softPink'
  | 'outline'
  | 'ghost'
  | 'danger';

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-40 min-h-[46px] px-5 text-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A5F]/30',
        size === 'sm' && 'min-h-[38px] px-3.5 text-xs rounded-xl',
        size === 'lg' && 'min-h-[54px] px-7 text-base rounded-[22px]',
        variant === 'primary' &&
          'bg-[#FF5A5F] text-white shadow-md shadow-[#FF5A5F]/25 hover:bg-[#F5494F] active:bg-[#E0383E]',
        variant === 'secondary' &&
          'bg-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/25 hover:bg-[#26A69A] active:bg-[#1E8278]',
        variant === 'tealOutline' &&
          'border-[1.5px] border-[#1F7A8C] bg-white text-[#1F7A8C] hover:bg-[#EBF7F8] active:bg-[#D5EFEF]',
        variant === 'coralOutline' &&
          'border-[1.5px] border-[#FF5A5F]/40 bg-white text-[#C82D35] hover:bg-[#FFF0F2] hover:border-[#FF5A5F]/60',
        variant === 'softPink' &&
          'bg-[#FFEBEF] text-[#C82D35] hover:bg-[#FFDFE5] active:bg-[#FFD1DA]',
        variant === 'outline' &&
          'border border-[#E2E8F0] bg-white text-[#1E232B] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9]',
        variant === 'ghost' &&
          'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E232B] active:bg-[#E2E8F0]',
        variant === 'danger' &&
          'bg-[#B92B34] text-white shadow-md shadow-[#B92B34]/20 hover:bg-[#A3222B] active:bg-[#8F1A22]',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="h-4 w-4 border-current/30 border-t-current" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ---------- Card ---------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 transition-all duration-200',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#1E232B]">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- Inputs ---------- */

export function Input({
  className,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
      )}
      <input
        className={cn(
          'w-full min-h-[46px] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 text-sm text-[#1E232B] outline-none placeholder:text-[#94A3B8] transition-all focus:bg-white focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/15',
          className,
        )}
        {...props}
      />
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-[#94A3B8]">{hint}</span>}
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
      )}
      <select
        className={cn(
          'w-full min-h-[46px] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 text-sm text-[#1E232B] outline-none transition-all focus:bg-white focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/15 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  className,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          'w-full min-h-[46px] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 text-sm text-[#1E232B] outline-none transition-all focus:bg-white focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/15',
          className,
        )}
        {...props}
      />
    </label>
  );
}

/* ---------- Sheet / Modal ---------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-[#EBF0F5] bg-white p-6 shadow-2xl transition-transform duration-300 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <h2 className="text-lg font-extrabold text-[#1E232B]">{title}</h2>
          <button
            onClick={onClose}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E232B] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-sm text-[#64748B] leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

/* ---------- States ---------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF5A5F]',
        className,
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-slate-200/70', className)}
    />
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[28px] bg-white p-6 border border-[#EBF0F5] shadow-sm flex flex-col gap-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      <Skeleton className="h-9 w-full rounded-2xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-[#64748B]">
      <Spinner className="h-8 w-8 border-3 border-slate-200 border-t-[#FF5A5F]" />
      <p className="text-xs font-bold uppercase tracking-widest text-[#FF5A5F]">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-[#CBD5E1] bg-white/60 px-6 py-10 text-center">
      {icon && <div className="p-3.5 rounded-2xl bg-[#FFEBEF] text-[#FF5A5F]">{icon}</div>}
      <h3 className="text-base font-bold text-[#1E232B]">{title}</h3>
      <p className="max-w-xs text-xs text-[#64748B] leading-relaxed">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border border-[#FEE2E2] bg-[#FFF5F5] px-6 py-6 text-center">
      <p className="text-sm font-semibold text-[#B92B34]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------- Toggle Switch ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[40px] items-center gap-3 cursor-pointer select-none"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
    >
      <span
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out',
          checked ? 'bg-[#B92B34]' : 'bg-[#CBD5E1]',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
      {label && <span className="text-sm font-medium text-[#1E232B]">{label}</span>}
    </button>
  );
}
