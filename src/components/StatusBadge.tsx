import { cn, titleCase } from '@/lib/utils';
import type { Device } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  online: 'bg-primary-container text-white',
  offline: 'bg-muted-gray text-on-surface',
  unknown: 'bg-muted-gray text-on-surface',
  updating: 'bg-secondary text-on-secondary',
  active: 'bg-primary-container text-white',
  draft: 'bg-muted-gray text-on-surface',
  published: 'bg-secondary text-on-secondary',
  failed: 'bg-error-container text-on-error-container',
  completed: 'bg-primary-container text-white',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const key = (status || 'unknown').toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro-label',
        STATUS_STYLES[key] || STATUS_STYLES.unknown,
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          key === 'online' || key === 'active' || key === 'published' || key === 'completed'
            ? 'bg-white'
            : key === 'updating'
              ? 'bg-on-secondary'
              : 'bg-on-surface/50',
        )}
      />
      {titleCase(key)}
    </span>
  );
}

export function DeviceStatusBadge({ device }: { device: Pick<Device, 'status'> }) {
  return <StatusBadge status={device.status} />;
}
