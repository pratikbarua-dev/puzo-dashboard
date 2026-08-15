'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { PuzoLogo } from '@/components/PuzoLogo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-base p-6 text-center">
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <PuzoLogo size={90} />
      </div>

      <h1 className="mb-2 font-display text-3xl font-extrabold tracking-tight text-on-surface">404</h1>
      <h2 className="mb-2 font-display text-xl font-bold text-on-surface">Moment not found</h2>
      <p className="mb-6 max-w-sm text-body-base text-on-surface-variant">
        This companion page doesn&apos;t exist or might have been moved. Let&apos;s get you back home.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/overview">
          <Button variant="primary">
            <Home size={16} /> Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
