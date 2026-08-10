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
    { key: 'action', header: 'Action', render: (l) => <span className="font-extrabold">{l.action}</span> },
    {
      key: 'entity',
      header: 'Entity',
      render: (l) => (
        <div>
          <p className="text-micro-label">{l.entity_type || '—'}</p>
          <p className="font-mono text-xs text-on-surface-variant">{l.entity_id || ''}</p>
        </div>
      ),
    },
    { key: 'actor_id', header: 'Actor', render: (l) => <span className="font-mono text-xs">{l.actor_id.slice(0, 8)}</span> },
    { key: 'created_at', header: 'Time', render: (l) => formatDate(l.created_at) },
  ];

  return (
    <div>
      <PageHeader title="Admin · Audit log" subtitle="A trail of sensitive actions" />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
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
