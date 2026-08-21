'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react';
import { otaJobs, otaStats } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column, type TableFilter } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { Card, Button, Loading } from '@/components/ui';
import { formatDate, timeAgo } from '@/lib/utils';
import type { OtaJob } from '@/lib/types';

const FILTERS: TableFilter[] = [
  {
    key: 'state',
    label: 'State',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'downloading', label: 'Downloading' },
      { value: 'installing', label: 'Installing' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
];

export default function AdminOtaPage() {
  const router = useRouter();
  const { data: jobs, isLoading } = useQuery({ queryKey: ['admin', 'ota'], queryFn: otaJobs });
  const { data: stats } = useQuery({ queryKey: ['admin', 'ota', 'stats'], queryFn: otaStats });

  const columns: Column<OtaJob>[] = [
    { key: 'device_id', header: 'Device', render: (j) => <span className="font-mono text-xs font-extrabold">{j.device_id || '—'}</span> },
    { key: 'release_id', header: 'Release ID', render: (j) => <span className="font-mono text-xs">{j.release_id ? `${j.release_id.slice(0, 8)}…` : '—'}</span> },
    { key: 'state', header: 'State', render: (j) => <StatusBadge status={j.state || 'unknown'} /> },
    { key: 'created_at', header: 'Created', render: (j) => formatDate(j.created_at) },
    { key: 'updated_at', header: 'Last activity', render: (j) => timeAgo(j.updated_at) },
  ];

  const successRate =
    stats?.ota?.success_rate != null
      ? `${Math.round(stats.ota.success_rate * 100)}%`
      : stats?.success_rate != null
      ? `${Math.round(stats.success_rate * 100)}%`
      : '—';

  return (
    <div>
      <PageHeader title="Admin · OTA Jobs" subtitle="Fleet-wide update status & job tracking" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total jobs" value={jobs?.length ?? '—'} icon={UploadCloud} accent="purple" />
        <StatCard label="Success rate" value={successRate} accent="white" />
        <StatCard
          label="Active"
          value={jobs?.filter((j) => ['downloading', 'verifying', 'installing', 'ready'].includes(j.state)).length ?? '—'}
          accent="yellow"
        />
        <StatCard label="Failed" value={jobs?.filter((j) => j.state === 'failed').length ?? '—'} accent="white" />
      </div>

      {isLoading ? (
        <Loading label="Loading OTA jobs…" />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={jobs ?? []}
            filters={FILTERS}
            empty={{
              title: 'No OTA jobs',
              message: 'Jobs appear when devices check for firmware updates. Publish a release to push to the fleet.',
              action: (
                <Button size="sm" variant="link" asChild>
                  <Link href="/admin/firmware">Publish a release</Link>
                </Button>
              ),
            }}
          />
        </Card>
      )}
    </div>
  );
}
