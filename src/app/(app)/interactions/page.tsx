'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2, Send, ArrowUpRight, ArrowDownLeft, Heart, Smile, Sparkles, Volume2 } from 'lucide-react';
import { myInteractions, sendInteraction, deleteInteraction, myDevices, myRelationships } from '@/lib/api';
import { commandDef, buildPayload, commandForInteractionType, defaultPayload, INTERACTION_TYPES } from '@/lib/registry';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { CommandFields } from '@/components/CommandForm';
import { Card, CardHeader, Button, Select, Sheet, CardSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';

export default function InteractionsPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
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
  const [payload, setPayload] = useState<Record<string, unknown>>({ emotion: 'thinking_of_you', message: 'Thinking of you' });

  const def = commandDef(commandForInteractionType(type));
  const partnerDevice = (relationships ?? [])
    .filter((relationship) => relationship.status === 'active')
    .flatMap((relationship) => relationship.devices ?? [])
    .find((device) => !devices?.some((mine) => mine.device_id === device.device_id));

  useEffect(() => {
    if (partnerDevice?.device_id && !target) {
      setTarget(partnerDevice.device_id);
    }
  }, [partnerDevice, target]);

  const presetMut = useMutation({
    mutationFn: (emotion: string) => {
      if (!partnerDevice) throw new Error('No partner PUZO is available');
      return sendInteraction({
        type: 'emotion',
        payload: { emotion, message: labelForEmotion(emotion) },
        target_device_id: partnerDevice.device_id,
      });
    },
    onSuccess: () => {
      toast.success('Reaction sent');
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  function labelForEmotion(emotion: string) {
    return {
      thinking_of_you: 'Thinking of you ❤️',
      happy: "I'm feeling happy 😊",
      miss_you: 'I miss you 🥺',
      love: 'I love you 💕',
      hug: 'Sending a warm hug 🌸',
      heartbeat: 'Sending my heartbeat ⚡',
    }[emotion] || emotion;
  }

  const sendMut = useMutation({
    mutationFn: () =>
      sendInteraction({
        type,
        payload: buildPayload(commandForInteractionType(type), payload),
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

  const EMOTION_PRESETS = [
    { key: 'thinking_of_you', label: 'Thinking of you', icon: '❤️' },
    { key: 'happy', label: 'Happy', icon: '😊' },
    { key: 'miss_you', label: 'Miss you', icon: '🥺' },
    { key: 'love', label: 'I love you', icon: '💕' },
    { key: 'hug', label: 'Warm hug', icon: '🌸' },
    { key: 'heartbeat', label: 'Heartbeat', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <PageHeader
        title="Interactions"
        subtitle="Send emotions, expressions, and vibrations to your partner's companion"
        action={
          <Button onClick={() => setOpen(true)} variant="primary">
            <Plus size={16} /> Send moment
          </Button>
        }
      />

      <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
        <CardHeader title="Quick Reactions" subtitle={partnerDevice ? `Targeting ${partnerDevice.name || partnerDevice.device_id}` : 'Pair a partner companion first'} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
          {EMOTION_PRESETS.map(({ key, label, icon }) => (
            <button
              key={key}
              disabled={!partnerDevice}
              onClick={() => presetMut.mutate(key)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center transition-all hover:border-[#FF5A5F]/50 hover:bg-[#FFEBEF]/20 disabled:opacity-40 cursor-pointer"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-bold text-[#1E232B]">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : !interactions?.length ? (
        <EmptyState
          icon={<Zap size={26} />}
          title="No moments shared yet"
          message="Send your first emotion, message, sound, or animation to your partner's PUZO."
          action={
            <Button onClick={() => setOpen(true)}>
              Send first moment
            </Button>
          }
        />
      ) : (
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader title="Timeline" subtitle="Moments shared between companion devices" />
          <div className="flex flex-col gap-2.5">
            {interactions.map((i) => {
              const isSent = !i.sender_id || i.sender_id === profile?.id;
              const emotionKey = i.payload?.emotion ? String(i.payload.emotion) : null;
              const displayText = i.payload?.message
                ? String(i.payload.message)
                : i.payload?.text
                ? String(i.payload.text)
                : emotionKey
                ? labelForEmotion(emotionKey)
                : i.type;

              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3.5 border border-[#E2E8F0]/60 hover:border-[#FF5A5F]/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        isSent ? 'bg-[#FFEBEF] text-[#FF5A5F]' : 'bg-[#C7F9CC] text-[#065A60]'
                      }`}
                    >
                      {isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#1E232B] text-sm truncate">{displayText}</span>
                        <span className="shrink-0 rounded-full bg-[#E2E8F0] px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#64748B]">
                          {i.type}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-[#94A3B8] mt-0.5">
                        {isSent ? 'Sent' : 'Received'} · {formatDate(i.created_at)} · {i.status}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={delMut.isPending}
                    onClick={() => delMut.mutate(i.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#FFEBEF] hover:text-[#B92B34] transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Send a moment">
        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMut.mutate();
          }}
        >
          <Select
            label="Type of interaction"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPayload(defaultPayload(commandForInteractionType(e.target.value)));
            }}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          {type === 'emotion' && (
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Pick emotion swatch</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {EMOTION_PRESETS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPayload({ emotion: key, message: labelForEmotion(key) })
                    }
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                      payload.emotion === key
                        ? 'border-[#FF5A5F] bg-[#FFEBEF] text-[#C82D35]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span>{icon}</span>
                    <span className="truncate">{label}</span>
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
          </Select>

          <CommandFields
            fields={def?.fields ?? []}
            payload={payload}
            onChange={(name, value) => setPayload((p) => ({ ...p, [name]: value }))}
          />

          <Button type="submit" isLoading={sendMut.isPending} disabled={!partnerDevice} className="w-full mt-2">
            Send moment now
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
