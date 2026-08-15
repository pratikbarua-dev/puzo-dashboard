'use client';

import Image from 'next/image';

interface AppSplashProps {
  error?: string;
  onRetry?: () => void;
}

export function AppSplash({ error, onRetry }: AppSplashProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-base p-4 text-center select-none">
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft radial glow aura */}
        <div className="absolute h-36 w-36 rounded-full bg-primary/20 blur-2xl animate-pulse" />

        {/* PUZO Icon Container with Winking Animation */}
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-surface-container-high p-3 shadow-puzo border border-white/10">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl flex items-center justify-center">
            <Image
              src="/icons/icon-512.png"
              alt="PUZO"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Animated OLED Eye Wink Badge */}
          <div className="absolute -bottom-3.5 flex items-center justify-center rounded-full bg-black/90 px-3 py-1 border border-primary/40 shadow-lg">
            <svg width="34" height="14" viewBox="0 0 34 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left Eye: Blinking OLED Eye */}
              <circle cx="7" cy="7" r="4.5" fill="#C5C0FF" className="animate-[pulse_1.5s_infinite]" />
              {/* Right Eye: Cute Winking Arc */}
              <path d="M22 9C22 9 24.5 4.5 27 4.5C29.5 4.5 32 9 32 9" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
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
