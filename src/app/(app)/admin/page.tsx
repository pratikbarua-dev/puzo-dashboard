'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  Users,
  UploadCloud,
  FolderCog,
  CreditCard,
  ScrollText,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  adminDevices,
  adminUsers,
  adminSubscriptions,
  firmwareReleases,
  otaJobs,
  otaStats,
} from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardHeader, Button, Loading } from '@/components/ui';
import { formatDate, timeAgo } from '@/lib/utils';

const CHART_COLORS = {
  success: '#5137ff',
  failed: '#ffb4ab',
  active: '#fcf431',
  pending: '#918ea3',
};

export default function AdminOverviewPage() {
  const { data: devices, isLoading: devLoading } = useQuery({
    queryKey: ['admin', 'devices'],
    queryFn: adminDevices,
  });
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminUsers,
  });
  const { data: subs } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: adminSubscriptions,
  });
  const { data: releases } = useQuery({
    queryKey: ['admin', 'firmware'],
    queryFn: firmwareReleases,
  });
  const { data: jobs } = useQuery({
    queryKey: ['admin', 'ota'],
    queryFn: otaJobs,
  });
  const { data: stats } = useQuery({
    queryKey: ['admin', 'ota', 'stats'],
    queryFn: otaStats,
  });

  const isLoading = devLoading || usersLoading;

  if (isLoading) return <Loading label="Loading admin overview…" />;

  const onlineDevices = devices?.filter((d) => d.status === 'online').length ?? 0;
  const updatingDevices = devices?.filter((d) => d.status === 'updating').length ?? 0;
  const activeSubs = subs?.filter((s) => s.status === 'active').length ?? 0;

  // OTA stats breakdown
  const successJobs = jobs?.filter((j) => j.state === 'completed' || j.state === 'installed').length ?? 0;
  const failedJobs = jobs?.filter((j) => j.state === 'failed').length ?? 0;
  const activeJobs = jobs?.filter((j) => ['downloading', 'verifying', 'installing', 'ready'].includes(j.state)).length ?? 0;
  const pendingJobs = jobs?.filter((j) => j.state === 'pending').length ?? 0;

  const otaPieData = [
    { name: 'Completed', value: successJobs || (stats?.ota?.success ?? 0), color: CHART_COLORS.success },
    { name: 'Failed', value: failedJobs || (stats?.ota?.failed ?? 0), color: CHART_COLORS.failed },
    { name: 'Active', value: activeJobs, color: CHART_COLORS.active },
    { name: 'Pending', value: pendingJobs, color: CHART_COLORS.pending },
  ].filter((d) => d.value > 0);

  // Hardware model breakdown
  const hardwareCounts: Record<string, number> = {};
  for (const d of devices ?? []) {
    const hw = d.hardware_model || 'ESP32-WROOM-32';
    hardwareCounts[hw] = (hardwareCounts[hw] || 0) + 1;
  }

  // Published releases per hardware
  const publishedReleases = releases?.filter((r) => r.status === 'published') ?? [];

  return (
    <div>
      <PageHeader
        title="Admin Console"
        subtitle="Fleet status, OTA operations, and system metrics"
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/firmware">
              <Button variant="outline" size="sm">
                <Plus size={14} /> Upload firmware
              </Button>
            </Link>
            <Link href="/admin/devices">
              <Button size="sm">
                <Plus size={14} /> Register device
              </Button>
            </Link>
          </div>
        }
      />

      {/* Fleet Stats Overview */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Total Devices" value={devices?.length ?? 0} icon={Cpu} accent="purple" />
        <StatCard label="Online Now" value={onlineDevices} accent="purple" />
        <StatCard label="Updating" value={updatingDevices} accent="yellow" />
        <StatCard label="Total Users" value={users?.length ?? 0} icon={Users} accent="white" />
        <StatCard label="Active Subs" value={activeSubs} icon={CreditCard} accent="purple" />
        <StatCard
          label="OTA Success"
          value={stats?.ota?.success_rate ? `${Math.round(stats.ota.success_rate * 100)}%` : '100%'}
          icon={CheckCircle2}
          accent="white"
        />
      </div>

      {/* Analytics & Distribution Grid */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* OTA Job Breakdown */}
        <Card>
          <CardHeader title="OTA Job Performance" subtitle="Fleet-wide update status" />
          {otaPieData.length > 0 ? (
            <div className="flex h-52 items-center justify-between">
              <div className="h-full w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={otaPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {otaPieData.map((entry) => (
                        <Cell key={entry?.name || 'entry'} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1b1c1c',
                        borderColor: '#474557',
                        borderRadius: '8px',
                        color: '#e4e2e1',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-1/2 flex-col gap-2 pl-4">
                {otaPieData.map((d) => (
                  <div key={d?.name || 'status'} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-[#64748B]">{d?.name}</span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-[#1E232B]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-[#94A3B8]">No OTA job history available yet.</p>
          )}
        </Card>

        {/* Fleet Hardware Distribution */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader title="Hardware &amp; Firmware Fleet" subtitle="Devices by model &amp; published builds" />
          <div className="flex flex-col gap-2.5">
            {Object.entries(hardwareCounts).length > 0 ? (
              Object.entries(hardwareCounts).map(([model, count]) => {
                const latestRel = publishedReleases.find((r) => r.hardware_model === model);
                return (
                  <div key={model} className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                    <div>
                      <span className="text-sm font-extrabold text-[#1E232B]">{model}</span>
                      <p className="font-mono text-[11px] text-[#64748B]">
                        Latest: {latestRel ? `v${latestRel.version} (b${latestRel.build_number})` : 'None'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#FFEBEF] px-3 py-1 font-mono text-[10px] font-bold text-[#FF5A5F]">
                        {count} {count === 1 ? 'device' : 'devices'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-xs text-[#94A3B8]">No devices registered in fleet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Fleet Activity & Quick Navigation */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Devices */}
        <Card className="lg:col-span-2 rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Recent Fleet Activity"
            subtitle="Latest registered devices"
            action={
              <Link href="/admin/devices" className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#FF5A5F] hover:underline uppercase tracking-wider">
                VIEW ALL <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {!devices?.length ? (
              <p className="py-6 text-center text-xs text-[#94A3B8]">No devices found.</p>
            ) : (
              devices.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/devices/${d.device_id}`}
                  className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#FF5A5F] border border-[#E2E8F0]">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-[#1E232B]">{d?.name || d?.device_id || 'Device'}</span>
                      <p className="font-mono text-[10px] text-[#94A3B8]">{d?.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#94A3B8]">{timeAgo(d.last_seen_at ?? d.created_at)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Admin Navigation Quick-Links */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader title="Admin Modules" subtitle="Quick access" />
          <div className="flex flex-col gap-2">
            {[
              { href: '/admin/devices', label: 'Fleet Devices', icon: Cpu, desc: 'Manage hardware & push updates' },
              { href: '/admin/firmware', label: 'Firmware Releases', icon: FolderCog, desc: 'Upload .bin & publish builds' },
              { href: '/admin/ota', label: 'OTA Jobs & Stats', icon: UploadCloud, desc: 'Monitor update rollout jobs' },
              { href: '/admin/users', label: 'User Roles', icon: Users, desc: 'Manage user access & roles' },
              { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, desc: 'View user subscription tiers' },
              { href: '/admin/audit', label: 'Audit Trail', icon: ScrollText, desc: 'Security log & system events' },
            ].map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 transition-colors hover:bg-white"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFEBEF] text-[#FF5A5F]">
                  <m.icon size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1E232B]">{m.label}</span>
                  <p className="text-[10px] text-[#64748B]">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
