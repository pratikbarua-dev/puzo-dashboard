import type { LucideIcon } from 'lucide-react';
import { Card } from './ui';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: 'purple' | 'yellow' | 'white';
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="text-label-caps text-on-surface-variant">{label.toUpperCase()}</p>
        <p className="mt-1 text-headline-lg">{value}</p>
      </div>
      {Icon && (
        <div
          className={
            accent === 'yellow'
              ? 'text-secondary'
              : accent === 'purple'
                ? 'text-primary-container'
                : 'text-white'
          }
        >
          <Icon size={28} strokeWidth={2.5} />
        </div>
      )}
    </Card>
  );
}
