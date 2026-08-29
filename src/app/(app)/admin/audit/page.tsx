'use client';

import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { adminAuditLogs } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, Loading } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { AuditLogEntry } from '@/lib/types';

export default function AdminAuditPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: adminAuditLogs,
  });

  const columns: Column<AuditLogEntry>[] = [
    { key: 'action', header: 'Action', render: (l) => <span className="font-extrabold text-[#1E232B]">{l.action || '—'}</span> },
    {
      key: 'entity',
      header: 'Entity',
      render: (l) => (
        <div>
          <p className="font-mono text-xs font-bold text-[#1E232B]">{l.entity_type || '—'}</p>
          <p className="font-mono text-[10px] text-[#64748B]">{l.entity_id || ''}</p>
        </div>
      ),
    },
    { key: 'actor_id', header: 'Actor', render: (l) => <span className="font-mono text-xs text-[#64748B]">{l.actor_id ? l.actor_id.slice(0, 8) : '—'}</span> },
    { key: 'created_at', header: 'Time', render: (l) => formatDate(l.created_at) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Admin · Audit log" subtitle="A trail of sensitive actions & security events" />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="rounded-[32px] p-4 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <DataTable
            columns={columns}
            rows={logs ?? []}
            empty={{ title: 'No audit entries', message: 'Sensitive actions will appear here.' }}
          />
        </Card>
      )}
    </div>
  );
}
