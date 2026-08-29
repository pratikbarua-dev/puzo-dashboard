'use client';

import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 select-none">
      <div>
        {isAdmin && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#FFEBEF] px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#C82D35] uppercase tracking-wider">
            <Shield size={11} /> Admin Console
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E232B]">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-[#64748B] font-medium">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

