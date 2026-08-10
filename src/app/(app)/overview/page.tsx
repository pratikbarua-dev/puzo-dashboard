'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Cpu, Link2, CreditCard, Plus } from 'lucide-react';
import { myDevices } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardHeader, Button, Loading, EmptyState } from '@/components/ui';
import { timeAgo } from '@/lib/utils';

export default function OverviewPage() {
  const { profile, subscription, entitlements } = useAuth();
  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: myDevices });

  const online = devices?.filter((d) => d.status === 'online').length ?? 0;
  const updating = devices?.filter((d) => d.status === 'updating').length ?? 0;
  const offline = (devices?.length ?? 0) - online - updating;

  return (
    <div>
      <PageHeader
        title={`Hey, ${profile?.display_name || profile?.username || 'friend'}`}
        subtitle={`${entitlements ? 'Free plan' : ''}${subscription ? ' · ' + (subscription.plan?.name || subscription.status) : ''}`}
        action={
          <Link href="/devices">
            <Button>
              <Plus size={16} /> Add device
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Devices" value={devices?.length ?? '—'} icon={Cpu} accent="purple" />
        <StatCard label="Online" value={online} accent="white" />
        <StatCard label="Updating" value={updating} accent="yellow" />
        <StatCard label="Offline" value={offline} accent="white" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your devices"
            subtitle="Realtime status from your fleet"
            action={
              <Link href="/pairing" className="text-label-caps text-primary-container">
                PAIR →
              </Link>
            }
          />
          {isLoading ? (
            <Loading />
          ) : !devices?.length ? (
            <EmptyState
              icon={<Cpu size={28} />}
              title="No devices yet"
              message="Register your first PUZO to start sending it commands."
              action={
                <Link href="/devices">
                  <Button variant="outline">Register a device</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {devices.slice(0, 6).map((d) => (
                <Link
                  key={d.device_id}
                  href={`/devices/${d.device_id}`}
                  className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-3 transition-fast hover:bg-surface-container-high"
                >
                  <div className="flex items-center gap-3">
                    <Cpu size={18} className="text-primary-container" />
                    <div>
                      <p className="font-extrabold">{d.name}</p>
                      <p className="text-micro-label text-on-surface-variant">{d.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-micro-label text-on-surface-variant sm:inline">
                      {timeAgo(d.last_seen as string)}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Quick actions" />
            <div className="flex flex-col gap-2">
              <Link href="/pairing">
                <Button variant="outline" className="w-full">
                  <Link2 size={16} /> Pair with a partner
                </Button>
              </Link>
              <Link href="/subscription">
                <Button variant="outline" className="w-full">
                  <CreditCard size={16} /> Manage subscription
                </Button>
              </Link>
            </div>
          </Card>
          <Card>
            <CardHeader title="Your plan" />
            <p className="text-headline-md">
              {subscription?.plan?.name ? `Plus` : subscription ? subscription.status : 'Free'}
            </p>
            <p className="mt-1 text-on-surface-variant">
              {entitlements?.scheduled_emotions
                ? 'Scheduled interactions & animation packs unlocked.'
                : 'Upgrade to unlock scheduled interactions and animation packs.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
