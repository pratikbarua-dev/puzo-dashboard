'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { myInteractions, sendInteraction, deleteInteraction, myDevices, myRelationships } from '@/lib/api';
import { commandDef, INTERACTION_TYPES } from '@/lib/registry';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Input, Select, Sheet, Loading, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';
import type { Interaction } from '@/lib/types';

export default function InteractionsPage() {
  const queryClient = useQueryClient();
  const { data: interactions, isLoading } = useQuery({
    queryKey: ['interactions'],
    queryFn: myInteractions,
  });
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const { data: relationships } = useQuery({ queryKey: ['relationships'], queryFn: myRelationships });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState('emotion');
  const [target, setTarget] = useState('');
  const [source, setSource] = useState('');
  const [relationshipId, setRelationshipId] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>({ emotion: '' });

  const def = commandDef(type === 'message' ? 'display' : type);

  const sendMut = useMutation({
    mutationFn: () =>
      sendInteraction({
        type,
        payload,
        target_device_id: target,
        source_device_id: source || undefined,
        relationship_id: relationshipId || undefined,
      }),
    onSuccess: () => {
      toast.success('Interaction sent');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteInteraction(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['interactions'] }),
    onError: (e) => toast.error(extractError(e).message),
  });

  return (
    <div>
      <PageHeader
        title="Interactions"
        subtitle="Send a moment to your partner's PUZO"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Send
          </Button>
        }
      />

      {isLoading ? (
        <Loading />
      ) : !interactions?.length ? (
        <EmptyState
          icon={<Zap size={28} />}
          title="No interactions yet"
          message="Send your first emotion, message, or animation to a paired device."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Send one
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader title="History" subtitle="Tap a row to keep it tidy — long-press not needed, just delete" />
          <div className="flex flex-col gap-2">
            {interactions.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-container-low px-3 py-2"
              >
                <div>
                  <p className="text-label-caps">
                    {i.type}
                    {i.payload?.text ? ` · ${String(i.payload.text).slice(0, 40)}` : ''}
                  </p>
                  <p className="text-micro-label text-on-surface-variant">
                    {i.status} · {formatDate(i.created_at)} · to {i.target_device_id || '—'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => delMut.mutate(i.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Send an interaction">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendMut.mutate();
          }}
        >
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <Input
            label="Target device ID"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="A device owned by your partner"
            required
          />

          <Select label="Source device (yours, optional)" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">None</option>
            {(devices ?? []).map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.name} ({d.device_id})
              </option>
            ))}
          </Select>

          <Select
            label="Relationship (optional)"
            value={relationshipId}
            onChange={(e) => setRelationshipId(e.target.value)}
          >
            <option value="">Auto-detect</option>
            {(relationships ?? [])
              .filter((r) => r.status === 'active')
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.relationship_type}
                </option>
              ))}
          </Select>

          {def?.fields.map((f) => (
            <Input
              key={f.name}
              label={f.label}
              type={f.type === 'number' ? 'number' : 'text'}
              value={String(payload[f.name] ?? '')}
              onChange={(e) =>
                setPayload((p) => ({
                  ...p,
                  [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                }))
              }
            />
          ))}

          <Button type="submit" disabled={sendMut.isPending}>
            {sendMut.isPending ? 'Sending…' : 'Send interaction'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
