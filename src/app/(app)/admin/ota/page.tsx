'use client';

import { useQuery } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react';
import { otaJobs, otaStats } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { Card, Loading } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { OtaJob } from '@/lib/types';

export default function AdminOtaPage() {
  const { data: jobs, isLoading } = useQuery({ queryKey: ['admin', 'ota'], queryFn: otaJobs });
  const { data: stats } = useQuery({ queryKey: ['admin', 'ota', 'stats'], queryFn: otaStats });

  const columns: Column<OtaJob>[] = [
    { key: 'device_id', header: 'Device', render: (j) => <span className="font-mono text-xs">{j.device_id}</span> },
    { key: 'release_id', header: 'Release', render: (j) => <span className="font-mono text-xs">{j.release_id.slice(0, 8)}</span> },
    { key: 'state', header: 'State', render: (j) => <StatusBadge status={j.state} /> },
    { key: 'created_at', header: 'Created', render: (j) => formatDate(j.created_at) },
    { key: 'updated_at', header: 'Updated', render: (j) => formatDate(j.updated_at) },
  ];

  const successRate =
    stats && typeof stats.success_rate === 'number' ? `${(stats.success_rate * 100).toFixed(0)}%` : '—';

  return (
    <div>
      <PageHeader title="Admin · OTA" subtitle="Firmware update jobs across the fleet" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total jobs" value={jobs?.length ?? '—'} icon={UploadCloud} accent="purple" />
        <StatCard label="Success rate" value={successRate} accent="white" />
        <StatCard label="Active" value={jobs?.filter((j) => ['downloading', 'verifying', 'installing', 'ready'].includes(j.state)).length ?? '—'} accent="yellow" />
        <StatCard label="Failed" value={jobs?.filter((j) => j.state === 'failed').length ?? '—'} accent="white" />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={jobs ?? []}
            empty={{ title: 'No OTA jobs', message: 'Jobs appear when devices check for firmware updates.' }}
          />
        </Card>
      )}
    </div>
  );
}
