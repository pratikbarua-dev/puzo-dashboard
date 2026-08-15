'use client';

import { PuzoLogo } from '@/components/PuzoLogo';

interface AppSplashProps {
  error?: string;
  onRetry?: () => void;
}

export function AppSplash({ error, onRetry }: AppSplashProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-base p-4 text-center select-none">
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft radial glow aura */}
        <div className="absolute h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-pulse" />

        {/* PUZO Animated Robot Screen SVG */}
        <div className="relative flex items-center justify-center drop-shadow-[0_10px_25px_rgba(81,55,255,0.3)]">
          <PuzoLogo size={140} animated={true} />
        </div>
      </div>

      {/* Only display error & retry button if an error occurs */}
      {error && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-body-base text-error max-w-xs">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-full bg-primary px-5 py-2 font-display text-sm font-semibold text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
