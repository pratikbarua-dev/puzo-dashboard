'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Smile,
  SmartphoneNfc,
  BatteryCharging,
  Sparkles,
  Target,
  Clock3,
  CloudSun,
} from 'lucide-react';
import {
  myDevices,
  myInteractions,
  sendInteraction,
  setDeviceMood,
  setDeviceMode,
  getDeviceMood,
  getDeviceMode,
  getDeviceSettings,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { usePartner } from '@/lib/usePartner';
import { Button, Sheet } from '@/components/ui';
import { toast } from '@/components/Toast';
import { timeAgo, extractError } from '@/lib/utils';
import { batteryLabel, batteryStatus } from '@/lib/battery';
import { parseWeatherCache } from '@/lib/weather';
import type { DeviceMood, DeviceMode } from '@/lib/types';

interface ModeOption {
  id: string;
  type: 'mood' | 'mode';
  label: string;
  category: string;
  description: string;
  emoji: string;
}

const ALL_MODES: ModeOption[] = [
  // 1. Core Emotional Personalities
  { id: 'love', type: 'mood', label: 'Love', category: 'Emotional Mode', description: 'Affectionate & loving', emoji: '❤️' },
  { id: 'happy', type: 'mood', label: 'Happy', category: 'Emotional Mode', description: 'Warm and joyful', emoji: '😊' },
  { id: 'playful', type: 'mood', label: 'Playful', category: 'Emotional Mode', description: 'Bright and silly', emoji: '😜' },
  { id: 'curious', type: 'mood', label: 'Curious', category: 'Emotional Mode', description: 'Notices the world', emoji: '🧐' },
  { id: 'calm', type: 'mood', label: 'Calm', category: 'Emotional Mode', description: 'Quiet and gentle', emoji: '😌' },
  { id: 'sleepy', type: 'mood', label: 'Sleepy', category: 'Emotional Mode', description: 'Soft and slow', emoji: '😴' },
  { id: 'excited', type: 'mood', label: 'Excited', category: 'Emotional Mode', description: 'Energetic & expressive', emoji: '🤩' },
  { id: 'tender', type: 'mood', label: 'Tender', category: 'Emotional Mode', description: 'Quiet and sensitive', emoji: '🥺' },
  { id: 'grumpy', type: 'mood', label: 'Grumpy', category: 'Emotional Mode', description: 'Blunt and fiery', emoji: '😡' },

  // 2. Hardware Operational Modes
  { id: 'normal', type: 'mode', label: 'Normal Pet', category: 'Device Mode', description: 'Autonomous desk companion', emoji: '✨' },
  { id: 'focus', type: 'mode', label: 'Focus Timer', category: 'Device Mode', description: 'Stay in the zone', emoji: '🎯' },
  { id: 'clock', type: 'mode', label: 'Desk Clock', category: 'Device Mode', description: 'Always-on digital time', emoji: '⏱️' },
  { id: 'weather', type: 'mode', label: 'Live Weather', category: 'Device Mode', description: 'Realtime ambient forecast', emoji: '🌤️' },
];

/**
 * The sheet exposes two labels ("Tender", "Grumpy") that the firmware calls
 * `sad` and `angry`; everything else is a 1:1 match with `DeviceMood`.
 */
const MOOD_ALIASES: Record<string, DeviceMood> = { tender: 'sad', grumpy: 'angry' };
const MOOD_TO_TILE: Record<string, string> = { sad: 'tender', angry: 'grumpy' };

export default function OverviewPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const partner = usePartner();
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const { data: interactions } = useQuery({ queryKey: ['interactions'], queryFn: myInteractions });

  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  /** Set only while a mood/mode write is in flight, so the face reacts instantly. */
  const [optimisticModeId, setOptimisticModeId] = useState<string | null>(null);

  const partnerDevice = partner.devices.find(
    (d) => !devices?.some((mine) => mine.device_id === d.device_id),
  );
  const primaryDevice = devices?.[0];
  const primaryDeviceId = primaryDevice?.device_id;

  /* ---- real device state powering the OLED face ---- */

  const { data: deviceMood } = useQuery({
    queryKey: ['devices', primaryDeviceId, 'mood'],
    queryFn: () => getDeviceMood(primaryDeviceId!),
    enabled: !!primaryDeviceId,
  });

  const { data: deviceMode } = useQuery({
    queryKey: ['devices', primaryDeviceId, 'mode'],
    queryFn: () => getDeviceMode(primaryDeviceId!),
    enabled: !!primaryDeviceId,
  });

  /** `weather_cache` holds exactly what the hardware renders in weather mode. */
  const { data: deviceSettings } = useQuery({
    queryKey: ['devices', primaryDeviceId, 'settings'],
    queryFn: () => getDeviceSettings(primaryDeviceId!),
    enabled: !!primaryDeviceId,
  });
  const weather = parseWeatherCache(deviceSettings?.weather_cache);

  // A non-default hardware mode takes over the screen; otherwise the mood shows.
  const serverModeId =
    deviceMode && deviceMode !== 'normal'
      ? deviceMode
      : deviceMood
      ? MOOD_TO_TILE[deviceMood] ?? deviceMood
      : deviceMode ?? null;
  const activeModeId = optimisticModeId ?? serverModeId;

  const lastInteraction = interactions?.[0];
  const lastTime = lastInteraction?.created_at ? timeAgo(lastInteraction.created_at) : 'none yet';

  const isOnline = primaryDevice?.status === 'online';
  const battery = batteryStatus(primaryDevice?.battery_percentage, primaryDevice?.battery_voltage);

  const sendAction = useMutation({
    mutationFn: async ({ type, payload }: { type: 'love' | 'nudge' | 'expression'; payload?: Record<string, unknown> }) => {
      const targetId = partnerDevice?.device_id || primaryDevice?.device_id;
      if (!targetId) {
        throw new Error('No companion device registered yet');
      }

      if (type === 'love') {
        return sendInteraction({
          type: 'emotion',
          payload: { emotion: 'love', message: 'Sent with love' },
          target_device_id: targetId,
        });
      } else if (type === 'nudge') {
        return sendInteraction({
          type: 'vibration',
          payload: { pattern: 'heartbeat', duration_ms: 1200 },
          target_device_id: targetId,
        });
      } else if (type === 'expression') {
        return sendInteraction({
          type: 'expression',
          payload: payload || { name: 'happy' },
          target_device_id: targetId,
        });
      }
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'love') toast.success('Sent Love to your partner!');
      if (variables.type === 'nudge') toast.success('Nudge sent! Haptics triggered.');
      if (variables.type === 'expression') toast.success('Expression updated on PUZO!');
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
    onError: (err) => {
      toast.error(extractError(err).message);
    },
  });

  const moodMut = useMutation({
    mutationFn: ({ mood }: { mood: DeviceMood; label: string }) =>
      setDeviceMood(primaryDeviceId!, mood),
    onSuccess: (_, { mood, label }) => {
      queryClient.setQueryData(['devices', primaryDeviceId, 'mood'], mood);
      void queryClient.invalidateQueries({ queryKey: ['devices', primaryDeviceId, 'mode'] });
      toast.success(`PUZO mood set to ${label}`);
    },
    onError: (err) => toast.error(extractError(err).message),
    onSettled: () => setOptimisticModeId(null),
  });

  const modeMut = useMutation({
    mutationFn: ({ mode }: { mode: DeviceMode; label: string }) =>
      setDeviceMode(primaryDeviceId!, mode),
    onSuccess: (_, { mode, label }) => {
      queryClient.setQueryData(['devices', primaryDeviceId, 'mode'], mode);
      toast.success(`PUZO switched to ${label}`);
    },
    onError: (err) => toast.error(extractError(err).message),
    onSettled: () => setOptimisticModeId(null),
  });

  const handleSelectMode = (item: ModeOption) => {
    setModeSheetOpen(false);

    if (!primaryDeviceId) {
      toast.error('Pair a PUZO before changing its mode');
      return;
    }

    setOptimisticModeId(item.id);
    if (item.type === 'mood') {
      moodMut.mutate({ mood: MOOD_ALIASES[item.id] ?? (item.id as DeviceMood), label: item.label });
    } else {
      modeMut.mutate({ mode: item.id as DeviceMode, label: item.label });
    }
  };

  const selectedMode = ALL_MODES.find((m) => m.id === activeModeId) ?? null;
  const headline = partner.name
    ? `${partner.name} is nearby`
    : profile?.display_name || profile?.username
    ? `${profile.display_name || profile.username} is nearby`
    : 'Your PUZO is nearby';
  const placeLabel = profile?.city || profile?.location || weather?.city || null;

  return (
    <div className="flex flex-col items-center gap-5 pt-2 select-none">
      {/* 1. Header Presence & Status */}
      <div className="flex flex-col items-center text-center">
        {primaryDevice ? (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest ${
              isOnline ? 'text-[#10B981]' : 'text-[#94A3B8]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#CBD5E1]'
              }`}
            />
            <span>
              {isOnline
                ? 'ONLINE'
                : primaryDevice.status === 'updating'
                ? 'UPDATING'
                : 'OFFLINE'}
            </span>
          </div>
        ) : (
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-[#94A3B8] hover:text-[#FF5A5F] transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
            <span>NO DEVICE</span>
          </Link>
        )}

        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E232B]">
          {headline}
        </h1>

        <p className="mt-0.5 text-xs text-[#64748B] font-medium">
          {placeLabel ? `${placeLabel} • ` : ''}
          {primaryDevice?.last_seen || primaryDevice?.last_seen_at
            ? `seen ${timeAgo(primaryDevice.last_seen ?? primaryDevice.last_seen_at)}`
            : 'no telemetry yet'}
        </p>
      </div>

      {/* 2. Hero OLED Screen Card */}
      <div className="w-full rounded-[32px] bg-white p-4 sm:p-5 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col items-center">
        {/* OLED Screen Bezel with glowing face */}
        <div
          className="oled-bezel oled-scanlines relative w-full aspect-[16/11] sm:h-64 flex flex-col items-center justify-center p-6 cursor-pointer group"
          onClick={() => setModeSheetOpen(true)}
          title="Tap to change PUZO's mode"
        >
          {/* Animated OLED Visualizer based on Active Mode */}
          <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-105 pb-3">
            {/* Mode: Love */}
            {activeModeId === 'love' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                    <path d="M4 20C12 6 32 6 40 20" stroke="#FFD166" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                  <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                    <path d="M4 20C12 6 32 6 40 20" stroke="#FFD166" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M6 6C16 20 32 20 42 6" stroke="#FFD166" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Happy / Normal */}
            {(activeModeId === 'happy' || activeModeId === 'normal') && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
                    <path d="M4 18C10 6 30 6 36 18" stroke="#FFD166" strokeWidth="6.5" strokeLinecap="round" />
                  </svg>
                  <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
                    <path d="M4 18C10 6 30 6 36 18" stroke="#FFD166" strokeWidth="6.5" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="46" height="22" viewBox="0 0 46 22" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M6 5C16 19 30 19 40 5" stroke="#FFD166" strokeWidth="6.5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Playful / Winking */}
            {activeModeId === 'playful' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <div className="h-6 w-8 rounded-full bg-[#FFD166] shadow-[0_0_12px_#FFD166]" />
                  <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
                    <path d="M4 18C10 6 26 6 32 18" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M6 5C14 17 30 17 38 5" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Curious */}
            {activeModeId === 'curious' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-7 neon-yellow-glow">
                  <div className="h-9 w-9 rounded-full border-[5px] border-[#FFD166] shadow-[0_0_12px_#FFD166]" />
                  <div className="h-5 w-5 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
                </div>
                <svg width="36" height="12" viewBox="0 0 36 12" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M6 6H30" stroke="#FFD166" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Calm */}
            {activeModeId === 'calm' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <svg width="38" height="18" viewBox="0 0 38 18" fill="none">
                    <path d="M4 12C12 18 26 18 34 12" stroke="#FFD166" strokeWidth="5.5" strokeLinecap="round" />
                  </svg>
                  <svg width="38" height="18" viewBox="0 0 38 18" fill="none">
                    <path d="M4 12C12 18 26 18 34 12" stroke="#FFD166" strokeWidth="5.5" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="36" height="14" viewBox="0 0 36 14" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M8 5C14 11 22 11 28 5" stroke="#FFD166" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Sleepy */}
            {activeModeId === 'sleepy' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <div className="h-1.5 w-8 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
                  <div className="h-1.5 w-8 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
                </div>
                <span className="font-mono text-base font-bold text-[#FFD166] tracking-widest animate-bounce">
                  z Z Z
                </span>
              </div>
            )}

            {/* Mode: Excited */}
            {activeModeId === 'excited' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 text-2xl font-black text-[#FFD166] neon-yellow-glow">
                  <span>★</span>
                  <span>★</span>
                </div>
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="neon-yellow-glow">
                  <path d="M6 6C14 22 34 22 42 6" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Tender / Sad */}
            {activeModeId === 'tender' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-8 neon-yellow-glow">
                  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                    <path d="M4 18C12 4 26 4 34 18" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                    <path d="M4 18C12 4 26 4 34 18" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="40" height="18" viewBox="0 0 40 18" fill="none" className="neon-yellow-glow">
                  <path d="M6 14C14 4 26 4 34 14" stroke="#FFD166" strokeWidth="5.5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Grumpy */}
            {activeModeId === 'grumpy' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-7 neon-yellow-glow">
                  <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                    <path d="M6 6L30 18" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                    <path d="M6 18L30 6" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
                <svg width="34" height="12" viewBox="0 0 34 12" fill="none" className="neon-yellow-glow mt-1">
                  <path d="M6 8C14 4 20 4 28 8" stroke="#FFD166" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Mode: Focus Timer */}
            {activeModeId === 'focus' && (
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full border-4 border-dashed border-[#FFD166] flex items-center justify-center animate-spin">
                  <Target size={24} className="text-[#FFD166]" />
                </div>
                <span className="font-mono text-lg font-black text-[#FFD166] tracking-widest">
                  25:00 FOCUS
                </span>
              </div>
            )}

            {/* Mode: Desk Clock */}
            {activeModeId === 'clock' && (
              <div className="flex flex-col items-center gap-1.5">
                <Clock3 size={24} className="text-[#FFD166]" />
                <span className="font-mono text-3xl font-black text-[#FFD166] tracking-widest">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono text-[10px] text-[#FFD166]/80 uppercase tracking-widest">
                  {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}

            {/* Mode: Weather — mirrors `device_settings.weather_cache` */}
            {activeModeId === 'weather' && (
              <div className="flex flex-col items-center gap-1.5">
                <CloudSun size={28} className="text-[#FFD166]" />
                <span className="font-mono text-2xl font-black text-[#FFD166] tracking-widest">
                  {weather?.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : '--°C'}
                </span>
                <span className="font-mono text-[10px] text-[#FFD166]/80 uppercase tracking-widest">
                  {weather
                    ? [weather.label, weather.city].filter(Boolean).join(' • ') || 'Weather ready'
                    : 'Awaiting forecast'}
                </span>
              </div>
            )}

            {/* No device paired yet, or state still loading */}
            {!activeModeId && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-8 neon-yellow-glow opacity-60">
                  <div className="h-1.5 w-8 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
                  <div className="h-1.5 w-8 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
                </div>
                <span className="font-mono text-[10px] text-[#FFD166]/70 uppercase tracking-widest">
                  {primaryDeviceId ? 'Reading PUZO…' : 'No PUZO paired'}
                </span>
              </div>
            )}
          </div>

          {/* Floating Pill Button inside screen */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModeSheetOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-[10px] font-mono font-bold tracking-tight text-white/90 hover:text-white hover:bg-white/25 transition-all border border-white/20 shadow-sm cursor-pointer"
            >
              <Sparkles size={11} className="text-[#FFD166]" />
              <span>Tap to change your PUZO&apos;s mode</span>
            </button>
          </div>
        </div>

        {/* Current Mood Pill Badge below Screen */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <button
            onClick={() => setModeSheetOpen(true)}
            disabled={moodMut.isPending || modeMut.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEBEF] px-4 py-1.5 text-xs font-mono font-bold tracking-wider text-[#FF5A5F] hover:bg-[#FFDDE4] transition-colors cursor-pointer disabled:opacity-60"
          >
            <Heart size={14} className="fill-[#FF5A5F]" />
            <span>
              {moodMut.isPending || modeMut.isPending
                ? 'SYNCING TO PUZO…'
                : `CURRENT MODE: ${(selectedMode?.label ?? 'Unknown').toUpperCase()}`}
            </span>
          </button>

          <p className="text-[11px] text-[#94A3B8] font-medium">
            Last interaction: {lastTime}
          </p>
        </div>
      </div>

      {/* 3. Primary Quick Action Buttons */}
      <div className="w-full flex flex-col gap-3">
        {/* Full-width Coral Button: Send Love */}
        <Button
          size="lg"
          variant="primary"
          isLoading={sendAction.isPending && sendAction.variables?.type === 'love'}
          onClick={() => sendAction.mutate({ type: 'love' })}
          className="w-full py-4 text-base shadow-lg shadow-[#FF5A5F]/20"
        >
          <Heart size={20} className="fill-white" />
          <span>Send Love</span>
        </Button>

        {/* Split Action Buttons: Expression & Nudge */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            variant="tealOutline"
            onClick={() => setModeSheetOpen(true)}
            className="w-full py-3.5"
          >
            <Smile size={19} />
            <span>Expression</span>
          </Button>

          <Button
            size="lg"
            variant="tealOutline"
            isLoading={sendAction.isPending && sendAction.variables?.type === 'nudge'}
            onClick={() => sendAction.mutate({ type: 'nudge' })}
            className="w-full py-3.5"
          >
            <SmartphoneNfc size={19} />
            <span>Nudge</span>
          </Button>
        </div>
      </div>

      {/* 4. PUZO Core Hardware Status Tile — real telemetry */}
      <Link
        href={primaryDeviceId ? `/devices/${primaryDeviceId}` : '/devices'}
        className="w-full rounded-[22px] bg-white p-4 border border-[#EBF0F5] shadow-sm flex items-center justify-between hover:border-[#FF5A5F]/40 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              battery === 'critical'
                ? 'bg-[#FFEBEF] text-[#B92B34]'
                : battery === 'low'
                ? 'bg-[#FEF3C7] text-[#92400E]'
                : 'bg-[#F1F5F9] text-[#1E232B]'
            }`}
          >
            <BatteryCharging size={22} className="text-current" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold tracking-widest text-[#94A3B8] uppercase">
              {primaryDevice?.name || 'PUZO CORE'}
            </p>
            <p className="text-sm font-extrabold text-[#1E232B]">
              {primaryDevice?.battery_percentage != null
                ? `${Math.round(primaryDevice.battery_percentage)}%`
                : primaryDevice?.battery_voltage != null
                ? `${primaryDevice.battery_voltage.toFixed(2)}V`
                : '—'}
              {' • '}
              {batteryLabel(battery)}
            </p>
          </div>
        </div>

        <div className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-mono font-bold text-[#64748B]">
          {primaryDevice?.firmware_version || 'no firmware'}
        </div>
      </Link>

      {/* Complete Mode & Personality Sheet */}
      <Sheet
        open={modeSheetOpen}
        onClose={() => setModeSheetOpen(false)}
        title="Select PUZO Mode & Face"
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Section 1: Emotional Personalities */}
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
              Emotional Personalities (9 Moods)
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {ALL_MODES.filter((m) => m.type === 'mood').map((item) => {
                const isSelected = activeModeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMode(item)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF5A5F] bg-[#FFEBEF]/50 shadow-sm'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF5A5F]/50 hover:bg-[#FFEBEF]/20'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-xs font-bold text-[#1E232B]">{item.label}</span>
                    <span className="text-[10px] text-[#64748B] text-center line-clamp-1">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Hardware Operating Modes */}
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
              Hardware Modes (4 Operational Behaviors)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {ALL_MODES.filter((m) => m.type === 'mode').map((item) => {
                const isSelected = activeModeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMode(item)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-[#0891B2] bg-[#E0F2FE]/50 shadow-sm'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0891B2]/50 hover:bg-[#E0F2FE]/20'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-[#1E232B]">{item.label}</p>
                      <p className="text-[10px] text-[#64748B]">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
