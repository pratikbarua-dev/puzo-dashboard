'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudRain, HeartPulse, Sparkles } from 'lucide-react';
import { getEmotionDecisions, getEmotionEngineSettings, updateEmotionEngineSettings } from '@/lib/api';
import type { EmotionEngineSettings } from '@/lib/types';
import { Card, Loading, ErrorState, Select } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md bg-surface-container-low px-3 py-2 text-sm text-on-surface">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" />
    </label>
  );
}

export function EmotionEngineCard({ deviceId }: { deviceId: string }) {
  const queryClient = useQueryClient();
  const settingsKey = ['devices', deviceId, 'emotion-engine'];
  const { data: settings, isLoading, isError, error, refetch } = useQuery({ queryKey: settingsKey, queryFn: () => getEmotionEngineSettings(deviceId) });
  const { data: decisions } = useQuery({
    queryKey: ['devices', deviceId, 'emotion-decisions'],
    queryFn: () => getEmotionDecisions(deviceId),
    enabled: Boolean(settings?.emotion_engine_enabled),
    refetchInterval: 30000,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (patch: Partial<EmotionEngineSettings>) => updateEmotionEngineSettings(deviceId, patch),
    onSuccess: (next) => { queryClient.setQueryData(settingsKey, next); setSaving(null); },
    onError: (e) => { setSaving(null); toast.error(extractError(e).message); },
  });

  if (isLoading) return <Card><Loading label="Loading emotion engine…" /></Card>;
  if (isError || !settings) return <Card><ErrorState message={extractError(error).message} onRetry={() => void refetch()} /></Card>;

  const patch = (key: keyof EmotionEngineSettings, value: EmotionEngineSettings[keyof EmotionEngineSettings]) => {
    setSaving(key);
    mutation.mutate({ [key]: value });
  };

  return (
    <section className="puzo-control-surface" aria-labelledby="emotion-engine-title">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-primary-container"><HeartPulse size={20} /></span>
        <div><p className="puzo-eyebrow">A little awareness</p><h2 id="emotion-engine-title" className="puzo-section-title">Emotion engine</h2><p className="mt-1.5 max-w-[34rem] text-[12px] leading-5 text-on-surface-variant">PUZO can respond to meaningful context without replacing its persistent mood. Every reaction is temporary, explainable, and rate-limited.</p></div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Toggle label="Enable contextual reactions" checked={settings.emotion_engine_enabled} onChange={(value) => patch('emotion_engine_enabled', value)} />
        <Toggle label="Weather reactions" checked={settings.weather_reactions_enabled} onChange={(value) => patch('weather_reactions_enabled', value)} />
        <Toggle label="Show factual weather messages" checked={settings.weather_messages_enabled} onChange={(value) => patch('weather_messages_enabled', value)} />
        <Toggle label="Partner context" checked={settings.partner_context_enabled} onChange={(value) => patch('partner_context_enabled', value)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Select label="Expression level" value={settings.emotion_intensity} onChange={(event) => patch('emotion_intensity', event.target.value as EmotionEngineSettings['emotion_intensity'])}><option value="low">Quiet</option><option value="normal">Balanced</option><option value="expressive">Expressive</option></Select>
        <Select label="Quiet hours start" value={settings.emotion_quiet_hours_start || ''} onChange={(event) => patch('emotion_quiet_hours_start', event.target.value || null)}><option value="">No quiet hours</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={`${String(hour).padStart(2, '0')}:00`}>{String(hour).padStart(2, '0')}:00</option>)}</Select>
        <Select label="Quiet hours end" value={settings.emotion_quiet_hours_end || ''} onChange={(event) => patch('emotion_quiet_hours_end', event.target.value || null)}><option value="">No quiet hours</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={`${String(hour).padStart(2, '0')}:00`}>{String(hour).padStart(2, '0')}:00</option>)}</Select>
      </div>
      {saving && <p className="mt-3 text-[11px] text-on-surface-variant" aria-live="polite">Saving…</p>}
      {settings.emotion_engine_enabled && <div className="mt-5 border-t border-border/20 pt-4"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><Sparkles size={13} /> Recent context</div>{!decisions?.length ? <p className="text-xs text-on-surface-variant">No automatic reactions yet.</p> : <div className="space-y-2">{decisions.slice(0, 4).map((decision) => <div key={decision.id} className="flex items-start gap-3 rounded-md bg-surface-container-low px-3 py-2.5"><CloudRain size={16} className="mt-0.5 text-primary-container" /><div className="min-w-0"><p className="text-sm text-on-surface">{decision.message || `PUZO felt ${decision.emotion}`}</p><p className="mt-0.5 text-[10px] text-on-surface-variant">{decision.status} · {decision.reason_codes.join(', ')}</p></div></div>)}</div>}</div>}
      <p className="mt-4 text-[11px] leading-4 text-on-surface-variant">Automatic context never edits your selected emotional mode. System safety and partner messages can still take priority.</p>
    </section>
  );
}
