'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { toast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    try {
      const { error } =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (mode === 'signup') {
        toast.success('Account created — check your email to confirm.');
        setMode('login');
        return;
      }
      toast.success('Signed in');
      router.push('/overview');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-container text-headline-md font-extrabold text-white">
            P
          </span>
          <div>
            <h1 className="text-headline-lg">PUZO</h1>
            <p className="text-label-caps text-on-surface-variant">SMART DESK COMPANION</p>
          </div>
        </div>

        <div className="rounded-lg bg-surface-container p-5 shadow-puzo">
          <h2 className="mb-1 text-headline-md">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mb-4 text-on-surface-variant">
            Sign in to manage your PUZO and connect with partners.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </Button>
          </form>

          <button
            onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            className="mt-4 min-h-[44px] w-full text-label-caps text-primary-container"
          >
            {mode === 'login' ? "NEW HERE? CREATE AN ACCOUNT" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
          </button>
        </div>
      </div>
    </div>
  );
}
