'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { PuzoLogo } from '@/components/PuzoLogo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F3F6FA] p-6 text-center text-[#1E232B]">
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-[#FF5A5F]/20 blur-xl animate-pulse" />
        <PuzoLogo size={90} />
      </div>

      <h1 className="mb-1 text-4xl font-black tracking-tight text-[#1E232B]">404</h1>
      <h2 className="mb-2 text-xl font-extrabold text-[#1E232B]">Moment not found</h2>
      <p className="mb-6 max-w-sm text-xs leading-relaxed text-[#64748B]">
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
