import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function titleCase(s: string): string {
  return s
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Friendly message for a backend error code. */
export function friendlyError(code?: string): string {
  switch (code) {
    case 'FEATURE_LOCKED':
      return 'This feature is not included in your plan. Upgrade to unlock it.';
    case 'CODE_ALREADY_USED':
      return 'That pairing code has already been used. Ask for a fresh one.';
    case 'INVALID_CODE':
      return 'That pairing code is invalid or has expired.';
    case 'SELF_PAIR':
      return 'You cannot pair with yourself.';
    case 'ACCOUNT_DEACTIVATED':
      return 'This account has been deactivated.';
    case 'FORBIDDEN':
      return 'You do not have permission to do that.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in again.';
    case 'PAYLOAD_TOO_LARGE':
      return 'That file is too large (max 2 MB).';
    case 'RATE_LIMITED':
      return 'Too many requests. Please slow down and try again.';
    case 'INVALID_SCHEDULED_FOR':
      return 'Scheduled time must be in the future.';
    case 'PLAN_NOT_FOUND':
      return 'That plan does not exist.';
    default:
      return code ? `Something went wrong (${code}).` : 'Something went wrong.';
  }
}

export function extractError(body: unknown): { code?: string; message: string } {
  const err = (body as { error?: { code?: string; message?: string } })?.error;
  if (err?.message) {
    return { code: err.code, message: friendlyError(err.code) || err.message };
  }
  return { message: 'Unexpected error' };
}
