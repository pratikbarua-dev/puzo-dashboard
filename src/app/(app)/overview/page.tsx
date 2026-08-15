'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Link2, CreditCard, Plus, Heart, Zap, Sparkles } from 'lucide-react';
import { myDevices, myRelationships, myInteractions, sendInteraction } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardHeader, Button, CardSkeleton, TableSkeleton, EmptyState } from '@/components/ui';
import { WelcomeModal } from '@/components/WelcomeModal';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { toast } from '@/components/Toast';
import { timeAgo, extractError } from '@/lib/utils';

export default function OverviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, subscription, entitlements } = useAuth();
  const { data: devices, isLoading: loadingDevices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const { data: relationships, isLoading: loadingRelationships } = useQuery({ queryKey: ['relationships'], queryFn: myRelationships });
  const { data: interactions } = useQuery({ queryKey: ['interactions'], queryFn: myInteractions });

  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const activeRelationship = (relationships ?? []).find((r) => r.status === 'active');
  const partnerDevice = activeRelationship?.devices?.find((d) => !devices?.some((mine) => mine.device_id === d.device_id));
  const hasDevices = Boolean(devices?.length);
  const hasPartner = Boolean(activeRelationship);
  const hasInteractions = Boolean(interactions?.length);

  useEffect(() => {
    // Show welcome modal for new users with 0 devices who haven't dismissed it in session
    if (!loadingDevices && !loadingRelationships && !hasDevices && !hasPartner) {
      const dismissed = sessionStorage.getItem('puzo_welcome_dismissed');
      if (!dismissed) {
        setWelcomeOpen(true);
      }
    }
  }, [loadingDevices, loadingRelationships, hasDevices, hasPartner]);

  const handleCloseWelcome = () => {
    setWelcomeOpen(false);
    sessionStorage.setItem('puzo_welcome_dismissed', 'true');
  };

  const sendQuickReaction = useMutation({
    mutationFn: (emotion: string) => {
      if (!partnerDevice) throw new Error('No partner device available');
      return sendInteraction({
        type: 'emotion',
        payload: { emotion, message: emotion === 'thinking_of_you' ? 'Thinking of you' : 'Sent with love' },
        target_device_id: partnerDevice.device_id,
      });
    },
    onSuccess: () => {
      toast.success('Sent reaction to partner!');
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const online = devices?.filter((d) => d.status === 'online').length ?? 0;
  const updating = devices?.filter((d) => d.status === 'updating').length ?? 0;
  const offline = (devices?.length ?? 0) - online - updating;

  return (
    <div>
      <WelcomeModal
        open={welcomeOpen}
        onClose={handleCloseWelcome}
        onStartDeviceSetup={() => router.push('/devices')}
        onStartPairing={() => router.push('/pairing')}
      />

      <PageHeader
        title={`Hey, ${profile?.display_name || profile?.username || 'friend'}`}
        subtitle={`${entitlements ? 'Companion account' : 'Free plan'}${subscription ? ' · ' + (subscription.plan?.name || subscription.status) : ''}`}
        action={
          <Link href="/devices">
            <Button>
              <Plus size={16} /> Add device
            </Button>
          </Link>
        }
      />

      {/* Interactive 3-step Onboarding Checklist for new/partial setups */}
      <OnboardingChecklist
        hasDevices={hasDevices}
        hasPartner={hasPartner}
        hasInteractions={hasInteractions}
        onOpenDeviceSetup={() => router.push('/devices')}
        onOpenPairing={() => router.push('/pairing')}
        onOpenInteractions={() => router.push('/interactions')}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Devices" value={devices?.length ?? '—'} icon={Cpu} accent="purple" />
        <StatCard label="Online" value={online} accent="white" />
        <StatCard label="Updating" value={updating} accent="yellow" />
        <StatCard label="Partner Linked" value={partnerDevice ? 'Connected' : 'None'} accent="white" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Main companion devices view */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your PUZO devices"
            subtitle="Realtime hardware status"
            action={
              <Link href="/pairing" className="text-label-caps text-primary-container">
                PAIR PARTNER →
              </Link>
            }
          />
          {loadingDevices ? (
            <TableSkeleton rows={3} />
          ) : !devices?.length ? (
            <EmptyState
              icon={<Cpu size={28} />}
              title="No PUZO added yet"
              message="Register your physical PUZO hardware to start sharing emotions and haptics."
              action={
                <Link href="/devices">
                  <Button variant="outline">Register PUZO</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {devices.slice(0, 6).map((d) => (
                <Link
                  key={d.device_id}
                  href={`/devices/${d.device_id}`}
                  className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-3 transition-fast hover:bg-surface-container-high border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <Cpu size={18} className="text-primary-container" />
                    <div>
                      <p className="font-extrabold">{d?.name || d?.device_id || 'PUZO Device'}</p>
                      <p className="text-micro-label text-on-surface-variant">{d?.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-micro-label text-on-surface-variant sm:inline">
                      {timeAgo((d.last_seen || d.last_seen_at) as string)}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Partner companion status & quick actions */}
        <div className="flex flex-col gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader title="Partner Companion" subtitle={partnerDevice ? (partnerDevice.name || partnerDevice.device_id) : 'Not paired yet'} />
            {loadingRelationships ? (
              <CardSkeleton count={1} />
            ) : partnerDevice ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-container/60 p-3">
                  <div>
                    <p className="font-extrabold text-on-surface">{partnerDevice.name || partnerDevice.device_id || 'Partner PUZO'}</p>
                    <p className="text-micro-label text-on-surface-variant">{partnerDevice.device_id}</p>
                  </div>
                  <StatusBadge status={partnerDevice.status} />
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={sendQuickReaction.isPending}
                  onClick={() => sendQuickReaction.mutate('thinking_of_you')}
                >
                  <Heart size={16} className="fill-current text-white" /> Send ❤️ moment
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-body-base text-on-surface-variant">
                  Link with your partner&apos;s PUZO to share presence, OLED animations, and haptics.
                </p>
                <Link href="/pairing">
                  <Button variant="outline" className="w-full">
                    <Link2 size={16} /> Pair with Partner
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <div className="flex flex-col gap-2">
              <Link href="/interactions">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles size={16} /> Send custom emotion / animation
                </Button>
              </Link>
              <Link href="/subscription">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard size={16} /> Manage subscription
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
