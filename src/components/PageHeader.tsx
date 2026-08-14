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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {isAdmin && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary-container/20 px-2.5 py-0.5 text-micro-label font-extrabold text-primary uppercase tracking-wider">
            <Shield size={11} /> Admin Console
          </span>
        )}
        <h1 className="text-headline-lg">{title}</h1>
        {subtitle && <p className="mt-1 text-label-caps text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
