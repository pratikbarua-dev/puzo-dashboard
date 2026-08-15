'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { me, ApiError } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { AppShell } from '@/components/AppShell';
import { RealtimeWatcher } from '@/components/RealtimeWatcher';
import { AppSplash } from '@/components/AppSplash';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setIdentity } = useAuth();

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
        router.replace('/login');
      }
    }
  }, [isError, error, router]);

  if (isLoading) {
    return <AppSplash label="Connecting to PUZO companion…" />;
  }

  if (isError) {
    const e = error as ApiError;
    if (e.status === 401 || e.status === 403) {
      return <AppSplash label="Redirecting to login…" />;
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
      <AppShell>{children}</AppShell>
      <RealtimeWatcher />
    </>
  );
}
