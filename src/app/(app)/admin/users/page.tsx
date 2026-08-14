'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsers, adminSetRole } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column, type TableFilter } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Select, Loading } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, timeAgo, extractError } from '@/lib/utils';
import type { AdminUser } from '@/lib/types';

const FILTERS: TableFilter[] = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'super_admin', label: 'Super Admin' },
    ],
  },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { profile: me } = useAuth();
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminUsers });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminSetRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const RoleCell = ({ user }: { user: AdminUser }) => {
    const [role, setRole] = useState<string>(user.role);
    const isSelf = user.id === me?.id;
    const canEdit = me?.role === 'super_admin' && !isSelf;
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <StatusBadge status={role} />
        {canEdit && (
          <Select
            className="min-h-[36px] max-w-[120px] text-xs"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              roleMut.mutate({ id: user.id, role: e.target.value });
            }}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </Select>
        )}
        {isSelf && <span className="text-micro-label text-on-surface-variant">(you)</span>}
      </div>
    );
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'display_name',
      header: 'User',
      render: (u) => (
        <div>
          <p className="font-extrabold">{u.display_name || u.username || '—'}</p>
          <p className="text-micro-label text-on-surface-variant">
            @{u.username || '—'} {u.email ? `· ${u.email}` : ''}
          </p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <RoleCell user={u} /> },
    { key: 'timezone', header: 'Timezone', render: (u) => u.timezone || 'UTC' },
    { key: 'created_at', header: 'Joined', render: (u) => formatDate(u.created_at) },
    { key: 'last_active_at', header: 'Last active', render: (u) => timeAgo(u.last_active_at as string) },
  ];

  return (
    <div>
      <PageHeader title="Admin · Users" subtitle="User accounts and role access management" />

      {isLoading ? (
        <Loading label="Loading users…" />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={users ?? []}
            filters={FILTERS}
            empty={{
              title: 'No users',
              message: 'Users appear when they first sign in.',
            }}
          />
        </Card>
      )}
    </div>
  );
}
