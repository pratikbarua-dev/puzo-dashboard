'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { me, ApiError } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { authClient } from '@/lib/auth-client';
import { AppShell } from '@/components/AppShell';
import { AdminShell } from '@/components/AdminShell';
import { RealtimeWatcher } from '@/components/RealtimeWatcher';
import { AppSplash } from '@/components/AppSplash';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminArea = !!pathname && pathname.startsWith('/admin');
  const { setIdentity, clear } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery<MeResponse>({
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
        clear();
        void authClient.signOut().finally(() => {
          router.replace('/login');
        });
      }
    }
  }, [isError, error, router, clear]);

  if (isLoading) {
    return <AppSplash />;
  }

  if (isError) {
    const e = error as ApiError;
    if (e.status === 401 || e.status === 403) {
      return <AppSplash />;
    }
    return (
      <AppSplash
        error={e.message || 'Could not load companion session.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {isAdminArea ? <AdminShell>{children}</AdminShell> : <AppShell>{children}</AppShell>}
      <RealtimeWatcher />
    </>
  );
}
