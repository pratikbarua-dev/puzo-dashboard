'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { me, ApiError } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { AppShell } from '@/components/AppShell';
import { ToastHost } from '@/components/Toast';
import { RealtimeWatcher } from '@/components/RealtimeWatcher';
import { Loading } from '@/components/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setIdentity } = useAuth();

  const { data, isError, error } = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: me,
    retry: false,
  });

  useEffect(() => {
    if (data) setIdentity(data);
  }, [data, setIdentity]);

  useEffect(() => {
    if (isError) {
      const e = error as ApiError;
      if (e.status === 401 || e.status === 403) {
        router.replace('/login');
      }
    }
  }, [isError, error, router]);

  if (isError) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background-base">
        <Loading label="Checking session…" />
      </div>
    );
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <RealtimeWatcher />
      <ToastHost />
    </>
  );
}
