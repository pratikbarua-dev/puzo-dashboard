'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Sparkles } from 'lucide-react';
import { plans, subscribe, cancelSubscription } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Loading, EmptyState, ConfirmDialog } from '@/components/ui';
import { toast } from '@/components/Toast';
import { useState } from 'react';
import { extractError } from '@/lib/utils';
import type { Plan } from '@/lib/types';

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { subscription, entitlements } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['plans'], queryFn: plans });
  const [cancelOpen, setCancelOpen] = useState(false);

  const subMut = useMutation({
    mutationFn: (planId: string) => subscribe(planId),
    onSuccess: () => {
      toast.success('Subscribed!');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      toast.success('Subscription cancelled');
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const activePlanName = subscription?.plan?.name ?? (subscription ? subscription.status : 'free');

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <PageHeader
        title="Subscription"
        subtitle={`Current plan: ${activePlanName.toUpperCase()}`}
        action={
          subscription?.status === 'active' || subscription?.status === 'trialing' ? (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              Cancel plan
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Loading />
      ) : !data?.plans?.length ? (
        <EmptyState title="No plans" message="Plans are not available right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data.plans as Plan[]).map((p) => {
            if (!p) return null;
            const current = p.name === activePlanName;
            const isFree = p.name === 'free';
            return (
              <Card
                key={p.id}
                className={
                  current
                    ? 'rounded-[32px] p-6 border-2 border-[#FF5A5F] bg-white shadow-md'
                    : p.name === 'plus'
                      ? 'rounded-[32px] p-6 border border-[#2EC4B6] bg-white shadow-sm'
                      : 'rounded-[32px] p-6 border border-[#EBF0F5] bg-white shadow-sm'
                }
              >
                <CardHeader
                  title={p.name === 'free' ? 'Free Companion' : p.name === 'plus' ? 'Plus Companion' : 'Family Companion'}
                  subtitle={current ? 'Your active plan' : p.description || undefined}
                />
                <p className="mb-3 text-3xl font-extrabold text-[#1E232B]">
                  ${Number(p.price || 0).toFixed(2)}
                  <span className="font-mono text-xs font-bold text-[#94A3B8]">/mo</span>
                </p>
                <ul className="mb-5 flex flex-col gap-2">
                  {Object.entries((p.features as Record<string, boolean>) || {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <li key={k} className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                        <Check size={15} className="text-[#2EC4B6]" />
                        <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                </ul>
                {current ? (
                  <div className="rounded-2xl bg-[#FFEBEF] py-2.5 text-center font-mono text-xs font-bold text-[#FF5A5F]">
                    {isFree && entitlements?.scheduled_emotions ? 'UPGRADING…' : 'ACTIVE PLAN'}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={p.name === 'plus' ? 'secondary' : 'primary'}
                    onClick={() => subMut.mutate(p.id)}
                    disabled={subMut.isPending}
                  >
                    {p.name === 'plus' ? (
                      <Sparkles size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    {subMut.isPending ? 'Processing…' : `Choose ${p.name === 'free' ? 'Free' : p.name === 'plus' ? 'Plus' : 'Family'}`}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel subscription"
        message="You'll lose scheduled interactions and animation packs at the end of the period."
        confirmLabel="Cancel subscription"
        onConfirm={() => cancelMut.mutate()}
        busy={cancelMut.isPending}
      />
    </div>
  );
}
