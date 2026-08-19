'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui';
import { PuzoLogo } from '@/components/PuzoLogo';
import { toast } from '@/components/Toast';

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      const message =
        errorParam === 'OAuthCallbackError' || errorParam === 'access_denied'
          ? 'Google sign-in was cancelled or failed. Please try again.'
          : errorParam;
      toast.error(message);
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
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background-base px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3.5">
          <PuzoLogo size={44} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              PUZO
              <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            </h1>
            <p className="text-[10px] font-extrabold tracking-widest text-purple-400 uppercase">SMART DESK COMPANION</p>
          </div>
        </div>

        <div className="rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10">
          <h2 className="mb-1 text-xl font-extrabold text-white">Welcome back</h2>
          <p className="mb-6 text-xs text-on-surface-variant leading-relaxed">
            Sign in to manage your PUZO companion, customize expressions, and connect with partners.
          </p>

          <Button
            onClick={signIn}
            isLoading={isLoading}
            className="w-full shadow-lg shadow-purple-950/50 py-3 text-sm"
            type="button"
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-[11px] text-on-surface-variant/60">
            Protected by PUZO secure session authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background-base" />}>
      <LoginForm />
    </Suspense>
  );
}
