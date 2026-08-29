'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Ban, Unlock, Pause, Play, Trash2 } from 'lucide-react';
import { myRelationships, relationshipAction, unpair } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Loading, EmptyState, ConfirmDialog } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';
import type { Relationship } from '@/lib/types';

export default function RelationshipsPage() {
  const queryClient = useQueryClient();
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: myRelationships,
  });
  const [unpairTarget, setUnpairTarget] = useState<Relationship | null>(null);

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => relationshipAction(id, action as never),
    onSuccess: () => {
      toast.success('Updated');
      void queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const unpairMut = useMutation({
    mutationFn: (id: string) => unpair(id, 'via dashboard'),
    onSuccess: () => {
      toast.success('Relationship ended');
      setUnpairTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const active = relationships?.filter((r) => r.status === 'active') ?? [];
  const others = relationships?.filter((r) => r.status !== 'active') ?? [];

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <PageHeader title="Relationships" subtitle="People whose PUZO companion is linked to yours" />

      {isLoading ? (
        <Loading />
      ) : !relationships?.length ? (
        <EmptyState
          icon={<HeartHandshake size={28} />}
          title="No relationships yet"
          message="Use the Pairing screen to create a code and link with a partner."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {active.length > 0 && (
            <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">ACTIVE CONNECTIONS</p>
              <div className="flex flex-col gap-2.5">
                {active.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#1E232B] capitalize">{r.relationship_type}</p>
                      <p className="font-mono text-[11px] text-[#64748B]">
                        since {formatDate(r.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                    <div className="flex flex-wrap gap-2">
                      {r.status === 'paused' ? (
                        <Button variant="outline" size="sm" onClick={() => act.mutate({ id: r.id, action: 'resume' })}>
                          <Play size={14} /> Resume
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => act.mutate({ id: r.id, action: 'pause' })}>
                          <Pause size={14} /> Pause
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => act.mutate({ id: r.id, action: 'block' })}>
                        <Ban size={14} /> Block
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setUnpairTarget(r)} className="text-[#B92B34] hover:bg-[#FFEBEF]">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {others.length > 0 && (
            <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">PAUSED &amp; BLOCKED</p>
              <div className="flex flex-col gap-2.5">
                {others.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
                    <span className="text-sm font-bold text-[#1E232B] capitalize">{r.relationship_type}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => act.mutate({ id: r.id, action: 'block' })}
                      >
                        <Ban size={14} /> Block
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => act.mutate({ id: r.id, action: 'unblock' })}
                      >
                        <Unlock size={14} /> Unblock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!unpairTarget}
        onClose={() => setUnpairTarget(null)}
        title="End relationship"
        message={`End this ${unpairTarget?.relationship_type ?? ''} relationship? Interactions between you will stop.`}
        confirmLabel="End relationship"
        onConfirm={() => unpairTarget && unpairMut.mutate(unpairTarget.id)}
        busy={unpairMut.isPending}
      />
    </div>
  );
}
