'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui';

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
