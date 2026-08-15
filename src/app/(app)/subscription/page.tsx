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
    <div>
      <PageHeader
        title="Subscription"
        subtitle={`Current plan: ${activePlanName}`}
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
                    ? 'ring-2 ring-primary-container'
                    : p.name === 'plus'
                      ? 'ring-1 ring-secondary'
                      : ''
                }
              >
                <CardHeader
                  title={p.name === 'free' ? 'Free' : p.name === 'plus' ? 'Plus' : 'Family'}
                  subtitle={current ? 'Your current plan' : p.description || undefined}
                />
                <p className="mb-3 text-headline-lg">
                  ${Number(p.price || 0).toFixed(2)}
                  <span className="text-label-caps text-on-surface-variant">/mo</span>
                </p>
                <ul className="mb-4 flex flex-col gap-2">
                  {Object.entries((p.features as Record<string, boolean>) || {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <li key={k} className="flex items-center gap-2 text-body-base">
                        <Check size={14} className="text-secondary" />
                        {k.replace(/_/g, ' ')}
                      </li>
                    ))}
                </ul>
                {current ? (
                  <p className="text-center text-label-caps text-on-surface-variant">
                    {isFree && entitlements?.scheduled_emotions ? 'UPGRADING…' : 'ACTIVE'}
                  </p>
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
