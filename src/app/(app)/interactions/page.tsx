'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2, Send, ArrowUpRight, ArrowDownLeft, Heart, Smile, Sparkles, Volume2 } from 'lucide-react';
import { myInteractions, deleteInteraction, myDevices } from '@/lib/api';
import { commandDef, INTERACTION_TYPES } from '@/lib/registry';
import { useAuth } from '@/lib/auth-store';
import { useSendInteraction } from '@/hooks/useSendInteraction';
import { labelForEmotion, EMOTION_PRESETS, describeInteraction } from '@/lib/interaction-display';
import { PageHeader } from '@/components/PageHeader';
import { InteractionStatus } from '@/components/InteractionStatus';
import { Card, CardHeader, Button, Input, Select, Sheet, CardSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';

export default function InteractionsPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: interactions, isLoading } = useQuery({
    queryKey: ['interactions'],
    queryFn: myInteractions,
  });
  const { partnerDevice, send: sendMut, sendingKey, isSending } = useSendInteraction();
  // The user's own PUZOs — populate the "source device" picker in the composer.
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState('emotion');
  const [target, setTarget] = useState('');
  const [source, setSource] = useState('');
  const [relationshipId, setRelationshipId] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>({ emotion: 'thinking_of_you', message: 'Thinking of you' });

  const def = commandDef(type === 'message' ? 'display' : type);

  useEffect(() => {
    if (partnerDevice?.device_id && !target) {
      setTarget(partnerDevice.device_id);
    }
  }, [partnerDevice, target]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteInteraction(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['interactions'] }),
    onError: (e) => toast.error(extractError(e).message),
  });


  return (
    <div>
      <PageHeader
        title="Interactions"
        subtitle="Send emotions, expressions, and vibrations to your partner's companion"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Send moment
          </Button>
        }
      />

      <Card className="mb-4">
        <CardHeader title="Quick Reactions" subtitle={partnerDevice ? `Targeting ${partnerDevice.name || partnerDevice.device_id}` : 'Pair a partner companion first'} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {EMOTION_PRESETS.map(({ key, label, icon }) => (
            <Button
              key={key}
              variant="outline"
              disabled={!partnerDevice}
              isLoading={isSending && sendingKey === key}
              onClick={() =>
                partnerDevice &&
                sendMut.mutate({
                  type: 'emotion',
                  payload: { emotion: key, message: labelForEmotion(key) },
                  target_device_id: partnerDevice.device_id,
                })
              }
              className="flex-col py-3 gap-1 min-h-[56px]"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-[11px] font-semibold">{label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : !interactions?.length ? (
        <EmptyState
          icon={<Zap size={28} />}
          title="No moments shared yet"
          message="Send your first emotion, message, sound, or animation to your partner's PUZO."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Send first moment
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader title="Timeline" subtitle="Moments shared between companion devices" />
          <div className="flex flex-col gap-2">
            {interactions.map((i) => {
              const isSent = !i.sender_id || i.sender_id === profile?.id;
              const { text: displayText } = describeInteraction(i);

              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3 border border-border/20 hover:bg-surface-container-high transition-fast"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isSent ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-on-surface text-sm">{displayText}</span>
                        <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
                          {i.type}
                        </span>
                        {isSent && (
                          <InteractionStatus
                            interaction={i}
                            optimistic={i.id.startsWith('optimistic:')}
                          />
                        )}
                      </div>
                      <p className="text-micro-label text-on-surface-variant mt-0.5">
                        {isSent ? 'Sent' : 'Received'} · {formatDate(i.created_at)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={delMut.isPending}
                    onClick={() => delMut.mutate(i.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Send a moment">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendMut.mutate({
              type,
              payload,
              target_device_id: target,
              source_device_id: source || undefined,
              relationship_id: relationshipId || undefined,
            });
            setOpen(false);
          }}
        >
          <Select label="Type of interaction" value={type} onChange={(e) => setType(e.target.value)}>
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          {type === 'emotion' && (
            <div>
              <label className="mb-2 block text-label-caps text-on-surface-variant">Pick emotion swatch</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {EMOTION_PRESETS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPayload({ emotion: key, message: labelForEmotion(key) })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition-fast ${
                      payload.emotion === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 bg-surface-container-low hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Select
            label="Target companion device"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          >
            {partnerDevice && (
              <option value={partnerDevice.device_id}>
                Partner&apos;s PUZO ({partnerDevice.name || partnerDevice.device_id})
              </option>
            )}
            {(devices ?? []).map((d) => (
              <option key={d.device_id} value={d.device_id}>
                My PUZO ({d.name || d.device_id})
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

          <Button type="submit" isLoading={isSending}>
            Send moment now
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
