'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui';
import { PuzoLogo } from '@/components/PuzoLogo';
import { PuzoMascot } from '@/components/PuzoMascot';
import { toast } from '@/components/Toast';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0 inline-block">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [mascotError, setMascotError] = useState(false);

  const mascotMood = mascotError ? 'error' : isLoading ? 'loading' : 'idle';

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      const message =
        errorParam === 'OAuthCallbackError' || errorParam === 'access_denied'
          ? 'Google sign-in was cancelled or failed. Please try again.'
          : errorParam;
      toast.error(message);
      setMascotError(true);
      setTimeout(() => setMascotError(false), 2000);
    }
  }, [searchParams]);

  const signIn = async () => {
    try {
      setIsLoading(true);
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/overview',
        errorCallbackURL: '/login',
      });
      if (res?.error) {
        toast.error(res.error.message || 'Login failed. Please try again.');
        setIsLoading(false);
        setMascotError(true);
        setTimeout(() => setMascotError(false), 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      toast.error(message);
      setIsLoading(false);
      setMascotError(true);
      setTimeout(() => setMascotError(false), 2000);
    }
  };

  const formContent = (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-black text-[#1E232B] tracking-tight">Welcome back</h2>
      <p className="mt-1.5 mb-6 text-sm text-[#64748B] leading-relaxed">
        Sign in to manage your PUZO companion, customize expressions, and connect with partners.
      </p>

      <Button
        onClick={signIn}
        isLoading={isLoading}
        className="w-full"
        size="lg"
        type="button"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-[#E2E8F0]" />
        <span className="text-xs text-[#64748B]">or</span>
        <div className="flex-1 border-t border-[#E2E8F0]" />
      </div>
      <p className="text-xs text-[#94A3B8] text-center">
        More sign-in options coming soon
      </p>

      <p className="mt-8 text-center text-[11px] text-[#94A3B8]">
        Protected by PUZO secure session authentication
      </p>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <Link
        href="/"
        className="fixed left-5 top-5 z-50 flex h-10 items-center gap-1.5 rounded-full bg-white/85 px-4 text-sm font-bold text-[#64748B] shadow-sm ring-1 ring-[#E2E8F0] backdrop-blur transition-colors hover:text-[#1E232B]"
      >
        <ArrowLeft size={15} />
        Home
      </Link>

      {/* Desktop Left Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-between bg-[#191C21] px-10 py-16">
        {/* Top: PUZO Title & Subtitle */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <PuzoLogo size={44} />
            <h1 className="text-3xl font-black text-[#FF656A] tracking-wider">PUZO</h1>
          </div>
          <p className="mt-1 text-xs font-extrabold text-white/50 tracking-widest uppercase">
            Smart Desk Companion
          </p>
        </div>

        {/* Middle: Mascot in Bezel */}
        <div className="my-auto py-6">
          <div className="oled-bezel oled-scanlines p-8 shadow-2xl">
            <div className="grid place-items-center">
              <PuzoMascot
                size={230}
                mood={mascotMood}
                trackMouse
                className="neon-cyan-glow"
              />
            </div>
          </div>
        </div>

        {/* Bottom: Features list */}
        <div className="flex items-center justify-center gap-6">
          {[
            "Expressive OLED emotions",
            "Connects with partners",
            "Over-the-air updates",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF656A]" />
              <span className="text-xs text-white/60 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right / Mobile Form Panel */}
      <div className="flex w-full lg:w-1/2 flex-col bg-[#F3F6FA]">
        {/* Mobile Header + Mascot */}
        <div className="flex flex-col items-center justify-center text-center w-full px-6 pt-16 pb-4 lg:hidden">
          <div className="flex items-center justify-center gap-3 mb-1">
            <PuzoLogo size={36} />
            <h1 className="text-2xl font-black text-[#1E232B] tracking-wide">PUZO</h1>
          </div>
          <p className="text-[10px] font-extrabold text-[#64748B] tracking-widest uppercase mb-6">
            Smart Desk Companion
          </p>
          <div className="oled-bezel oled-scanlines p-4 shadow-xl mx-auto">
            <div className="grid place-items-center">
              <PuzoMascot size={130} mood={mascotMood} trackMouse className="neon-cyan-glow" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-6 sm:py-10">
          {formContent}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F3F6FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
