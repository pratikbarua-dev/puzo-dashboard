import type { LucideIcon } from 'lucide-react';
import { Card } from './ui';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'purple',
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: 'purple' | 'yellow' | 'white' | 'cyan';
}) {
  return (
    <Card className="relative overflow-hidden glass-panel-interactive flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-micro-label font-extrabold uppercase tracking-widest text-on-surface-variant/80">{label}</p>
        <p className="mt-1 text-headline-lg font-extrabold text-on-surface tracking-tight">{value}</p>
      </div>
      {Icon && (
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            accent === 'yellow' && 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-amber-950/30',
            accent === 'purple' && 'bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-purple-950/30',
            accent === 'cyan' && 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-cyan-950/30',
            accent === 'white' && 'bg-white/10 text-white border border-white/15',
          )}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>
      )}
    </Card>
  );
}
