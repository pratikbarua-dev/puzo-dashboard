'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CloudSun, HeartPulse, MessageCircleHeart, Moon, Sparkles } from 'lucide-react';
import { getEmotionDecisions, getEmotionEngineSettings, updateEmotionEngineSettings } from '@/lib/api';
import type { EmotionEngineSettings } from '@/lib/types';
import { Card, Loading, ErrorState, Toggle } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

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
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

  const latestDecision = decisions?.[0];
  const contextSources = [
    {
      key: 'weather_reactions_enabled' as const,
      label: 'Weather Reactions',
      description: 'Changes in sky and environment',
      Icon: CloudSun,
    },
    {
      key: 'weather_messages_enabled' as const,
      label: 'Weather Notes',
      description: 'Factual updates & forecast notes',
      Icon: Moon,
    },
    {
      key: 'partner_context_enabled' as const,
      label: 'Partner Context',
      description: 'Meaningful moments & presence',
      Icon: MessageCircleHeart,
    },
  ];

  const intensityOptions: { value: EmotionEngineSettings['emotion_intensity']; label: string }[] = [
    { value: 'low', label: 'Quiet' },
    { value: 'normal', label: 'Balanced' },
    { value: 'expressive', label: 'Expressive' },
  ];

  const formatReason = (reason: string) => reason.replaceAll('_', ' ');

  return (
    <section className="puzo-control-surface" aria-labelledby="emotion-engine-title">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
            <HeartPulse size={20} />
          </span>
          <div className="min-w-0">
            <p className="puzo-eyebrow">A little awareness</p>
            <h2 id="emotion-engine-title" className="puzo-section-title">Contextual reactions</h2>
            <p className="mt-1 max-w-[34rem] text-[12px] leading-5 text-on-surface-variant/80">
              PUZO notices meaningful moments without changing its selected mood.
            </p>
          </div>
        </div>
        <Toggle
          checked={settings.emotion_engine_enabled}
          onChange={(value) => patch('emotion_engine_enabled', value)}
          label="Enable Reactions"
        />
      </div>

      {!settings.emotion_engine_enabled ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs text-on-surface-variant">
          Off · PUZO follows your selected emotional mode only.
        </p>
      ) : (
        <>
          <div className="mt-5">
            <p className="mb-2 text.10px font-extrabold uppercase tracking-widest text-on-surface-variant/80">What PUZO Can Notice</p>
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
              {contextSources.map(({ key, label, description, Icon }) => (
                <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon size={18} className="shrink-0 text-purple-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[11px] text-on-surface-variant/70">{description}</p>
                    </div>
                  </div>
                  <Toggle checked={settings[key]} onChange={(value) => patch(key, value)} ariaLabel={label} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-bold text-white">Expression Level</p>
              <p className="text-[11px] text-on-surface-variant/70">How noticeable reactions should feel</p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-white/10 bg-surface-container-high/90 p-1" role="group" aria-label="Expression level">
              {intensityOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={settings.emotion_intensity === value}
                  onClick={() => patch('emotion_intensity', value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${settings.emotion_intensity === value ? 'bg-gradient-to-r from-purple-600 to-primary-container text-white shadow-md shadow-purple-950/50' : 'text-on-surface-variant hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="mt-3 flex min-h-[40px] w-full items-center justify-between text-left text-xs font-bold text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            aria-expanded={advancedOpen}
          >
            <span>{advancedOpen ? 'Hide timing settings' : 'Quiet hours setup'}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          {advancedOpen && (
            <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
              <label className="text-xs text-on-surface-variant">
                <span className="mb-1 block font-bold uppercase tracking-wider text-[10px]">Start Time</span>
                <select
                  value={settings.emotion_quiet_hours_start || ''}
                  onChange={(event) => patch('emotion_quiet_hours_start', event.target.value || null)}
                  className="min-h-[40px] w-full rounded-xl border border-white/10 bg-surface-container-high px-3 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="">No quiet hours</option>
                  {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={`${String(hour).padStart(2, '0')}:00`}>{String(hour).padStart(2, '0')}:00</option>)}
                </select>
              </label>
              <label className="text-xs text-on-surface-variant">
                <span className="mb-1 block font-bold uppercase tracking-wider text-[10px]">End Time</span>
                <select
                  value={settings.emotion_quiet_hours_end || ''}
                  onChange={(event) => patch('emotion_quiet_hours_end', event.target.value || null)}
                  className="min-h-[40px] w-full rounded-xl border border-white/10 bg-surface-container-high px-3 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="">No quiet hours</option>
                  {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={`${String(hour).padStart(2, '0')}:00`}>{String(hour).padStart(2, '0')}:00</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/80">
              <Sparkles size={13} className="text-purple-400" /> Recent Context History
            </div>
            {!latestDecision ? (
              <p className="text-xs text-on-surface-variant/70">No automatic reactions logged yet.</p>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-purple-400" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">{latestDecision.message || `PUZO felt ${latestDecision.emotion}`}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-on-surface-variant/70">
                    {latestDecision.status} · {latestDecision.reason_codes.map(formatReason).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {saving && <p className="mt-3 text-[11px] font-bold text-purple-400" aria-live="polite">Saving updates…</p>}
      <p className="mt-4 text-[11px] leading-4 text-on-surface-variant/70">Automatic context is temporary and never edits your selected emotional mode.</p>
    </section>
  );
}
