'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-extrabold transition-fast disabled:cursor-not-allowed disabled:opacity-40 min-h-[44px] px-4',
        size === 'sm' && 'min-h-[36px] px-3 text-[11px]',
        size === 'lg' && 'min-h-[52px] px-6',
        variant === 'primary' &&
          'bg-primary-container text-white hover:opacity-90 active:opacity-80',
        variant === 'secondary' &&
          'bg-secondary text-on-secondary hover:opacity-90 active:opacity-80',
        variant === 'outline' &&
          'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-high',
        variant === 'ghost' &&
          'bg-transparent text-on-surface-variant hover:bg-surface-container-high',
        variant === 'danger' &&
          'bg-error-container text-on-error-container hover:opacity-90',
        className,
      )}
      {...props}
    />
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
        'rounded-lg bg-surface-container p-md shadow-puzo',
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
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-headline-md">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-label-caps text-on-surface-variant">{subtitle}</p>
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
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-micro-label text-on-surface-variant">
          {label.toUpperCase()}
        </span>
      )}
      <input
        className={cn(
          'w-full min-h-[44px] rounded-md bg-surface-container-high px-3 text-body-base text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-container',
          className,
        )}
        {...props}
      />
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
        <span className="mb-1 block text-micro-label text-on-surface-variant">
          {label.toUpperCase()}
        </span>
      )}
      <select
        className={cn(
          'w-full min-h-[44px] rounded-md bg-surface-container-high px-3 text-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary-container',
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
        <span className="mb-1 block text-micro-label text-on-surface-variant">
          {label.toUpperCase()}
        </span>
      )}
      <textarea
        className={cn(
          'w-full min-h-[44px] rounded-md bg-surface-container-high px-3 py-2 text-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary-container',
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-xl bg-surface-container-low p-md shadow-puzo transition-fast sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-headline-md">{title}</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-md text-on-surface-variant hover:bg-surface-container-high"
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
      <p className="mb-4 text-on-surface-variant">{message}</p>
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
        'h-5 w-5 animate-spin rounded-full border-2 border-on-surface-variant border-t-primary',
        className,
      )}
    />
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-xl text-on-surface-variant">
      <Spinner className="h-7 w-7" />
      <p className="text-label-caps">{label.toUpperCase()}</p>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant px-6 py-xl text-center">
      {icon && <div className="text-primary-container">{icon}</div>}
      <h3 className="text-headline-md">{title}</h3>
      <p className="max-w-xs text-on-surface-variant">{message}</p>
      {action}
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
    <div className="flex flex-col items-center gap-3 rounded-lg bg-error-container/20 px-6 py-lg text-center">
      <p className="text-on-error-container">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------- Toggle ---------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] items-center gap-3"
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-fast',
          checked ? 'bg-primary-container' : 'bg-surface-container-highest',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-fast',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      {label && <span className="text-body-base">{label}</span>}
    </button>
  );
}
