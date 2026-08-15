'use client';

import Image from 'next/image';

interface AppSplashProps {
  label?: string;
  error?: string;
  onRetry?: () => void;
}

export function AppSplash({ label = 'Loading PUZO…', error, onRetry }: AppSplashProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-base p-4 text-center">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Pulsing glow background */}
        <div className="absolute h-20 w-20 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high shadow-puzo border border-border/50">
          <Image
            src="/icons/apple-touch-icon.png"
            alt="PUZO Icon"
            width={40}
            height={40}
            className="rounded-xl object-contain"
            priority
          />
        </div>
      </div>

      <h1 className="mb-2 font-display text-xl font-bold tracking-tight text-on-surface">PUZO</h1>
      <p className="text-body-base text-on-surface-variant max-w-xs">{error || label}</p>

      {error && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-primary px-5 py-2 font-display text-sm font-semibold text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}
