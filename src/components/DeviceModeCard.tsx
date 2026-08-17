'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Clock3,
  CloudSun,
  Heart,
  Send,
  Sparkles,
  SunMedium,
  Target,
} from 'lucide-react';
import {
  adminGetDeviceMode,
  adminSendDeviceMood,
  adminSetDeviceMode,
  getDeviceMode,
  sendDeviceMood,
  setDeviceMode,
} from '@/lib/api';
import type { DeviceMode } from '@/lib/types';
import { Card, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

const MODES: {
  value: DeviceMode;
  label: string;
  description: string;
  Icon: typeof SunMedium;
}[] = [
  { value: 'normal', label: 'Normal', description: 'Everyday behavior', Icon: Sparkles },
  { value: 'focus', label: 'Focus', description: 'Stay in the flow', Icon: Target },
  { value: 'clock', label: 'Clock', description: 'Keep time close', Icon: Clock3 },
  { value: 'weather', label: 'Weather', description: 'A quick forecast', Icon: CloudSun },
];

const MOODS = [
  ['happy', 'Happy', '😊'],
  ['sad', 'Sad', '😢'],
  ['angry', 'Angry', '😡'],
  ['love', 'Love', '❤️'],
  ['sleepy', 'Sleepy', '😴'],
  ['curious', 'Curious', '🤔'],
  ['excited', 'Excited', '🤩'],
] as const;

const MOOD_ACCENTS: Record<string, string> = {
  happy: 'puzo-mood-tone-happy',
  sad: 'puzo-mood-tone-sad',
  angry: 'puzo-mood-tone-angry',
  love: 'puzo-mood-tone-love',
  sleepy: 'puzo-mood-tone-sleepy',
  curious: 'puzo-mood-tone-curious',
  excited: 'puzo-mood-tone-excited',
};

export function DeviceModeCard({ deviceId, admin = false }: { deviceId: string; admin?: boolean }) {
  const queryClient = useQueryClient();
  const [pendingMode, setPendingMode] = useState<DeviceMode | null>(null);
  const queryKey = [admin ? 'admin' : 'devices', deviceId, 'mode'];
  const { data: mode, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => (admin ? adminGetDeviceMode(deviceId) : getDeviceMode(deviceId)),
  });
  const modeMut = useMutation({
    mutationFn: (next: DeviceMode) => (admin ? adminSetDeviceMode(deviceId, next) : setDeviceMode(deviceId, next)),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result.mode);
      setPendingMode(null);
      toast.success(result.command?.status === 'queued' ? 'Mode queued until PUZO reconnects' : 'PUZO mode updated');
    },
    onError: (e) => {
      setPendingMode(null);
      toast.error(extractError(e).message);
    },
  });

  if (isLoading) return <Card><Loading label="Loading mode…" /></Card>;
  if (isError || !mode) return <Card><ErrorState message={extractError(error).message} onRetry={() => void refetch()} /></Card>;

  const activeMode = pendingMode || mode;
  const selected = MODES.find((item) => item.value === activeMode) || MODES[0];
  return (
    <section className="puzo-control-surface" aria-labelledby="puzo-mode-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="puzo-eyebrow">PUZO mode</p>
          <h2 id="puzo-mode-title" className="puzo-section-title">Choose how PUZO behaves</h2>
        </div>
        <div className="puzo-current-pill" aria-live="polite">
          <span className="puzo-current-dot" />
          {selected.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="group" aria-label="PUZO modes">
        {MODES.map((item) => {
          const Icon = item.Icon;
          const isSelected = activeMode === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${item.label}: ${item.description}`}
              disabled={modeMut.isPending}
              onClick={() => {
                if (item.value === activeMode) return;
                setPendingMode(item.value);
                modeMut.mutate(item.value);
              }}
              className={`puzo-mode-tile ${isSelected ? 'puzo-mode-tile-selected' : ''}`}
            >
              <span className="puzo-mode-icon" aria-hidden="true"><Icon size={23} strokeWidth={1.8} /></span>
              <span className="mt-4 block text-[14px] font-semibold tracking-[-0.01em] text-on-surface">{item.label}</span>
              <span className="mt-1 block text-[11px] leading-4 text-on-surface-variant">{item.description}</span>
              <span className="puzo-selection-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 max-w-[38rem] text-[11px] leading-4 text-on-surface-variant">Saved to this PUZO. Local moments can briefly take over, then return to your selected mode.</p>
    </section>
  );
}

export function DeviceMoodCard({ deviceId, admin = false }: { deviceId: string; admin?: boolean }) {
  const [emotion, setEmotion] = useState('happy');
  const moodMut = useMutation({
    mutationFn: (next: string) => (admin ? adminSendDeviceMood(deviceId, next) : sendDeviceMood(deviceId, next)),
    onSuccess: (result) => toast.success(result.command?.status === 'queued' ? 'Mood queued until PUZO reconnects' : `Sent ${result.emotion}`),
    onError: (e) => toast.error(extractError(e).message),
  });

  return (
    <section className="puzo-control-surface" aria-labelledby="send-mood-title">
      <div className="mb-5">
        <p className="puzo-eyebrow">A little expression</p>
        <h2 id="send-mood-title" className="puzo-section-title">Send a mood</h2>
        <p className="mt-1.5 max-w-[28rem] text-[12px] leading-5 text-on-surface-variant">Tell PUZO how you&apos;re feeling. This is a one-time moment, not a change to its mode.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Moods">
        {MOODS.map(([value, label, emoji]) => {
          const isSelected = emotion === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              aria-label={label}
              onClick={() => setEmotion(value)}
              className={`group puzo-mood-tile ${isSelected ? 'puzo-mood-tile-selected' : ''} ${MOOD_ACCENTS[value]}`}
            >
              <span className="puzo-mood-icon" aria-hidden="true">{emoji}</span>
              <span className="mt-2 block text-[12px] font-semibold text-on-surface">{label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => moodMut.mutate(emotion)}
        disabled={moodMut.isPending}
        className="puzo-send-button mt-4"
      >
        {moodMut.isPending ? <span className="puzo-button-spinner" aria-hidden="true" /> : <Send size={16} strokeWidth={2.2} />}
        {moodMut.isPending ? 'Sending…' : `Send ${MOODS.find(([value]) => value === emotion)?.[1] || 'mood'}`}
        <Heart size={14} className="ml-auto opacity-50" fill="currentColor" />
      </button>
    </section>
  );
}
