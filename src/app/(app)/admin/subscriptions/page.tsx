'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { adminSubscriptions } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Loading } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Subscription } from '@/lib/types';

export default function AdminSubscriptionsPage() {
  const { data: subs, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: adminSubscriptions,
  });

  const columns: Column<Subscription>[] = [
    { key: 'user_id', header: 'User', render: (s) => <span className="font-mono text-xs">{s.user_id.slice(0, 8)}…</span> },
    { key: 'plan', header: 'Plan', render: (s) => s.plan?.name || s.plan_id.slice(0, 8) },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'current_period_end', header: 'Renews', render: (s) => formatDate(s.current_period_end) },
  ];

  return (
    <div>
      <PageHeader title="Admin · Subscriptions" subtitle="All subscriber plans" />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={subs ?? []}
            empty={{ title: 'No subscriptions', message: 'Nobody has subscribed yet.' }}
          />
        </Card>
      )}
    </div>
  );
}
