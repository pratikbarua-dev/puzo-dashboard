import { cn, titleCase } from '@/lib/utils';
import type { Device } from '@/lib/types';

type Variant = 'light' | 'dark';

interface BadgeTokens {
  bg: string;
  dot: string;
  text: string;
}

const NEUTRAL_LIGHT: BadgeTokens = {
  bg: 'bg-slate-100 border-slate-200',
  dot: 'bg-slate-400',
  text: 'text-slate-600 font-bold',
};

const LIGHT_STYLES: Record<string, BadgeTokens> = {
  online: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500 animate-pulse',
    text: 'text-emerald-700 font-extrabold',
  },
  active: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500 animate-pulse',
    text: 'text-emerald-700 font-extrabold',
  },
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  installed: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  ready: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  stable: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  delivered: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  acknowledged: {
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 font-extrabold',
  },
  updating: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
    text: 'text-amber-700 font-extrabold',
  },
  downloading: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700 font-extrabold',
  },
  installing: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700 font-extrabold',
  },
  verifying: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700 font-extrabold',
  },
  beta: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700 font-extrabold',
  },
  system: {
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700 font-extrabold',
  },
  published: {
    bg: 'bg-violet-50 border-violet-200',
    dot: 'bg-violet-500',
    text: 'text-violet-700 font-extrabold',
  },
  development: {
    bg: 'bg-slate-100 border-slate-200',
    dot: 'bg-slate-400',
    text: 'text-slate-600 font-bold',
  },
  failed: {
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700 font-extrabold',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700 font-extrabold',
  },
  cancelled: {
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700 font-extrabold',
  },
  critical_safety: {
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700 font-extrabold',
  },
  pending: {
    bg: 'bg-sky-50 border-sky-200',
    dot: 'bg-sky-500',
    text: 'text-sky-700 font-extrabold',
  },
  scheduled: {
    bg: 'bg-sky-50 border-sky-200',
    dot: 'bg-sky-500',
    text: 'text-sky-700 font-extrabold',
  },
  queued: {
    bg: 'bg-sky-50 border-sky-200',
    dot: 'bg-sky-500',
    text: 'text-sky-700 font-extrabold',
  },
  sent: {
    bg: 'bg-sky-50 border-sky-200',
    dot: 'bg-sky-500',
    text: 'text-sky-700 font-extrabold',
  },
  draft: NEUTRAL_LIGHT,
  offline: NEUTRAL_LIGHT,
  unpublished: NEUTRAL_LIGHT,
  user: NEUTRAL_LIGHT,
  idle_personality: NEUTRAL_LIGHT,
  unknown: NEUTRAL_LIGHT,
  admin: {
    bg: 'bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700 font-extrabold',
  },
  local_user: {
    bg: 'bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700 font-extrabold',
  },
  super_admin: {
    bg: 'bg-fuchsia-50 border-fuchsia-200',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-700 font-extrabold',
  },
  partner: {
    bg: 'bg-pink-50 border-pink-200',
    dot: 'bg-pink-500',
    text: 'text-pink-700 font-extrabold',
  },
};

const DARK_STYLES: Record<string, BadgeTokens> = {
  online: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]',
    text: 'text-emerald-300 font-extrabold',
  },
  active: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]',
    text: 'text-emerald-300 font-extrabold',
  },
  completed: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300 font-extrabold',
  },
  offline: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
  },
  draft: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
  },
  unknown: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
  },
  updating: {
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-400 animate-ping',
    text: 'text-amber-300 font-extrabold',
  },
  published: {
    bg: 'bg-purple-500/15 border-purple-500/30',
    dot: 'bg-purple-400',
    text: 'text-purple-300 font-extrabold',
  },
  failed: {
    bg: 'bg-red-500/15 border-red-500/30',
    dot: 'bg-red-400',
    text: 'text-red-300 font-extrabold',
  },
};

const PALETTES: Record<Variant, Record<string, BadgeTokens>> = {
  light: LIGHT_STYLES,
  dark: DARK_STYLES,
};

export function StatusBadge({
  status,
  className,
  variant = 'light',
}: {
  status: string | null | undefined;
  className?: string;
  variant?: Variant;
}) {
  const key = (status || 'unknown').toLowerCase();
  const palette = PALETTES[variant] ?? PALETTES.light;
  const style = palette[key] ?? palette.unknown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-all duration-200',
        variant === 'dark' && 'backdrop-blur-md',
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {titleCase(key)}
    </span>
  );
}

export function DeviceStatusBadge({ device }: { device: Pick<Device, 'status'> }) {
  return <StatusBadge status={device.status} />;
}
