'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminGetDeviceMode,
  adminSendDeviceMood,
  adminSetDeviceMode,
  getDeviceMode,
  sendDeviceMood,
  setDeviceMode,
} from '@/lib/api';
import type { DeviceMode } from '@/lib/types';
import { Card, CardHeader, Button, Select, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

const MODES: { value: DeviceMode; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Affection and everyday behavior' },
  { value: 'focus', label: 'Focus', description: 'Timed focus session' },
  { value: 'clock', label: 'Clock', description: 'Show the clock temporarily' },
  { value: 'weather', label: 'Weather', description: 'Show cached weather temporarily' },
];

const MOODS = [
  ['happy', 'Happy'],
  ['sad', 'Sad'],
  ['curious', 'Curious'],
  ['sleepy', 'Sleepy'],
  ['excited', 'Excited'],
  ['love', 'Love'],
  ['angry', 'Angry'],
] as const;

export function DeviceModeCard({ deviceId, admin = false }: { deviceId: string; admin?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = [admin ? 'admin' : 'devices', deviceId, 'mode'];
  const { data: mode, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => (admin ? adminGetDeviceMode(deviceId) : getDeviceMode(deviceId)),
  });
  const modeMut = useMutation({
    mutationFn: (next: DeviceMode) => (admin ? adminSetDeviceMode(deviceId, next) : setDeviceMode(deviceId, next)),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result.mode);
      toast.success(result.command?.status === 'queued' ? 'Mode queued until PUZO reconnects' : 'PUZO mode updated');
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  if (isLoading) return <Card><Loading label="Loading mode…" /></Card>;
  if (isError || !mode) return <Card><ErrorState message={extractError(error).message} onRetry={() => void refetch()} /></Card>;

  const selected = MODES.find((item) => item.value === mode) || MODES[0];
  return (
    <Card>
      <CardHeader title="PUZO mode" subtitle="Choose the operational behavior from the dashboard" />
      <div className="flex flex-col gap-3">
        <Select
          label="Current desired mode"
          value={mode}
          onChange={(event) => modeMut.mutate(event.target.value as DeviceMode)}
          disabled={modeMut.isPending}
        >
          {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
        <p className="text-micro-label text-on-surface-variant">{selected.description}. Focus, clock, and weather still follow their normal local timeout rules.</p>
      </div>
    </Card>
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
    <Card>
      <CardHeader title="Send a mood" subtitle="A one-time emotional expression; it does not change the operational mode" />
      <div className="flex flex-col gap-3">
        <Select label="Mood" value={emotion} onChange={(event) => setEmotion(event.target.value)}>
          {MOODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Button onClick={() => moodMut.mutate(emotion)} isLoading={moodMut.isPending}>Send mood</Button>
      </div>
    </Card>
  );
}
