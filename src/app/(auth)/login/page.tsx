'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui';
import { PuzoLogo } from '@/components/PuzoLogo';

export default function LoginPage() {
  const signIn = () => {
    authClient.signIn.social({
      provider: 'google',
      callbackURL: '/overview',
    });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <PuzoLogo size={48} />
          <div>
            <h1 className="text-headline-lg">PUZO</h1>
            <p className="text-label-caps text-on-surface-variant">SMART DESK COMPANION</p>
          </div>
        </div>

        <div className="rounded-lg bg-surface-container p-5 shadow-puzo">
          <h2 className="mb-1 text-headline-md">Welcome back</h2>
          <p className="mb-4 text-on-surface-variant">
            Sign in to manage your PUZO and connect with partners.
          </p>

          <Button onClick={signIn} className="w-full" type="button">
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
