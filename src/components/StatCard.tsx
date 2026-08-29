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
    <Card className="relative overflow-hidden flex items-center justify-between gap-3 p-5 rounded-[28px] border border-[#EBF0F5] shadow-sm">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-[#1E232B] tracking-tight">{value}</p>
      </div>
      {Icon && (
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300',
            accent === 'yellow' && 'bg-[#FEF3C7] text-[#92400E]',
            accent === 'purple' && 'bg-[#FFEBEF] text-[#FF5A5F]',
            accent === 'cyan' && 'bg-[#C7F9CC] text-[#065A60]',
            accent === 'white' && 'bg-[#F1F5F9] text-[#1E232B]',
          )}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
      )}
    </Card>
  );
}
