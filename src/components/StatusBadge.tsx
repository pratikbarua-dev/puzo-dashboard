import { cn, titleCase } from '@/lib/utils';
import type { Device } from '@/lib/types';

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string; ring: string }> = {
  online: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]',
    text: 'text-emerald-300 font-extrabold',
    ring: 'border-emerald-500/20',
  },
  active: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]',
    text: 'text-emerald-300 font-extrabold',
    ring: 'border-emerald-500/20',
  },
  completed: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300 font-extrabold',
    ring: 'border-emerald-500/20',
  },
  offline: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
    ring: 'border-white/10',
  },
  draft: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
    ring: 'border-white/10',
  },
  unknown: {
    bg: 'bg-white/5 border-white/10',
    dot: 'bg-gray-400',
    text: 'text-gray-300 font-bold',
    ring: 'border-white/10',
  },
  updating: {
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-400 animate-ping',
    text: 'text-amber-300 font-extrabold',
    ring: 'border-amber-500/20',
  },
  published: {
    bg: 'bg-purple-500/15 border-purple-500/30',
    dot: 'bg-purple-400',
    text: 'text-purple-300 font-extrabold',
    ring: 'border-purple-500/20',
  },
  failed: {
    bg: 'bg-red-500/15 border-red-500/30',
    dot: 'bg-red-400',
    text: 'text-red-300 font-extrabold',
    ring: 'border-red-500/20',
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const key = (status || 'unknown').toLowerCase();
  const style = STATUS_STYLES[key] || STATUS_STYLES.unknown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] backdrop-blur-md transition-all duration-200',
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
