'use client';

import { useAuth, isAdmin } from '@/lib/auth-store';
import { EmptyState, Loading } from '@/components/ui';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loaded } = useAuth();

  if (!loaded) return <Loading />;
  if (!isAdmin(profile?.role)) {
    return (
      <EmptyState
        icon={<ShieldAlert size={32} />}
        title="Admins only"
        message="Your account does not have admin access. Ask a super admin to promote your role."
      />
    );
  }
  return <>{children}</>;
}
