'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellOff, ListOrdered, MapPin, Timer, Vibrate, Volume2 } from 'lucide-react';
import { getDeviceSettings, getProfileLocation, updateDeviceSettings, updateProfileLocation } from '@/lib/api';
import type { DeviceSettings, DeviceSettingsPatch } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { Card, CardHeader, Button, Input, Toggle, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

type SettingsDraft = Pick<
  DeviceSettings,
  | 'sleep_timeout_min'
  | 'focus_duration_min'
  | 'timezone_offset_min'
  | 'random_text_tap_count'
  | 'wake_sound_enabled'
  | 'wake_vibration_enabled'
  | 'quiet_mode_enabled'
>;

type ToggleDraft = Pick<SettingsDraft, 'wake_sound_enabled' | 'wake_vibration_enabled' | 'quiet_mode_enabled'>;

const NUMERIC_FIELDS: {
  key: keyof Pick<
    DeviceSettings,
    'sleep_timeout_min' | 'focus_duration_min' | 'timezone_offset_min' | 'random_text_tap_count'
  >;
  label: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}[] = [
  { key: 'sleep_timeout_min', label: 'Auto-sleep timeout (min)', min: 0, max: 480, hint: '0 = never' },
  { key: 'focus_duration_min', label: 'Focus duration (min)', min: 5, max: 240 },
  { key: 'timezone_offset_min', label: 'Timezone offset (min)', min: -840, max: 840, step: 15 },
  { key: 'random_text_tap_count', label: 'Random-text tap count', min: 5, max: 20 },
];

const TOGGLE_FIELDS: { key: keyof ToggleDraft; label: string; icon: React.ReactNode }[] = [
  { key: 'wake_sound_enabled', label: 'Wake sound', icon: <Volume2 size={16} /> },
  { key: 'wake_vibration_enabled', label: 'Wake vibration', icon: <Vibrate size={16} /> },
  { key: 'quiet_mode_enabled', label: 'Quiet mode', icon: <BellOff size={16} /> },
];

function formatOffset(min: number): string {
  const sign = min < 0 ? '-' : '+';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function DeviceSettingsCard({ deviceId }: { deviceId: string }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: settings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['devices', deviceId, 'settings'],
    queryFn: () => getDeviceSettings(deviceId),
  });

  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [locCity, setLocCity] = useState(profile?.city ?? profile?.location ?? '');
  const [locLat, setLocLat] = useState(profile?.latitude != null ? String(profile.latitude) : '');
  const [locLng, setLocLng] = useState(profile?.longitude != null ? String(profile.longitude) : '');

  useEffect(() => {
    if (profile) {
      setLocCity(profile.city ?? profile.location ?? '');
      setLocLat(profile.latitude != null ? String(profile.latitude) : '');
      setLocLng(profile.longitude != null ? String(profile.longitude) : '');
    }
  }, [profile]);

  const { data: locData } = useQuery({
    queryKey: ['me', 'location'],
    queryFn: getProfileLocation,
    enabled: !profile,
  });

  useEffect(() => {
    if (locData) {
      setLocCity(locData.city ?? locData.location ?? '');
      setLocLat(locData.latitude != null ? String(locData.latitude) : '');
      setLocLng(locData.longitude != null ? String(locData.longitude) : '');
    }
  }, [locData]);

  useEffect(() => {
    if (settings && !draft) {
      setDraft({
        sleep_timeout_min: settings.sleep_timeout_min,
        focus_duration_min: settings.focus_duration_min,
        timezone_offset_min: settings.timezone_offset_min,
        random_text_tap_count: settings.random_text_tap_count,
        wake_sound_enabled: settings.wake_sound_enabled,
        wake_vibration_enabled: settings.wake_vibration_enabled,
        quiet_mode_enabled: settings.quiet_mode_enabled,
      });
    }
  }, [settings, draft]);

  const numericDirty = !!draft && !!settings
    ? NUMERIC_FIELDS.some((f) => draft[f.key] !== settings[f.key])
    : false;

  const saveNumericMut = useMutation({
    mutationFn: (patch: DeviceSettingsPatch) => updateDeviceSettings(deviceId, patch),
    onSuccess: () => {
      toast.success('Device settings saved');
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const toggleMut = useMutation({
    mutationFn: (patch: DeviceSettingsPatch) => updateDeviceSettings(deviceId, patch),
    onSuccess: (_data, patch) => {
      const key = Object.keys(patch)[0] as keyof SettingsDraft;
      const label = TOGGLE_FIELDS.find((t) => t.key === key)?.label ?? 'Setting';
      toast.success(`${label} ${patch[key] ? 'enabled' : 'disabled'}`);
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
    onError: (e, patch) => {
      toast.error(extractError(e).message);
      const key = Object.keys(patch)[0] as keyof SettingsDraft;
      setDraft((d) => (d ? { ...d, [key]: !patch[key] } : d));
    },
  });

  const locMut = useMutation({
    mutationFn: (input: { city: string; latitude: number | null; longitude: number | null }) =>
      updateProfileLocation({
        location: input.city,
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
      }),
    onSuccess: () => {
      toast.success('Location saved');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'location'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const handleToggle = (key: keyof ToggleDraft, value: boolean) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    toggleMut.mutate({ [key]: value });
  };

  const handleSaveNumeric = () => {
    if (!draft) return;
    const patch: DeviceSettingsPatch = {};
    for (const f of NUMERIC_FIELDS) {
      const raw = Number(draft[f.key]);
      const clamped = Math.min(f.max, Math.max(f.min, raw));
      patch[f.key] = clamped;
    }
    setDraft((d) => (d ? { ...d, ...patch } : d));
    saveNumericMut.mutate(patch);
  };

  if (isLoading) return <Loading label="Loading device settings…" />;
  if (isError || !draft) {
    return (
      <ErrorState message={extractError(error).message} onRetry={() => void refetch()} />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Behavior & Display"
        subtitle="Settings synced to this PUZO device"
        action={<ListOrdered size={18} className="text-on-surface-variant" />}
      />

      <div className="mb-4 flex flex-col gap-1">
        {TOGGLE_FIELDS.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-3 rounded-md bg-surface-container-low px-3 py-2">
            <span className="flex items-center gap-2 text-body-base">
              <span className="text-on-surface-variant">{t.icon}</span>
              {t.label}
            </span>
            <Toggle
              checked={draft[t.key]}
              onChange={(v) => handleToggle(t.key, v)}
              label={t.label}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {NUMERIC_FIELDS.map((f) => (
          <div key={f.key}>
            <Input
              label={f.label}
              type="number"
              min={f.min}
              max={f.max}
              step={f.step}
              value={draft[f.key]}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, [f.key]: Number(e.target.value) } : d))
              }
            />
            {f.key === 'timezone_offset_min' && (
              <p className="mt-1 text-micro-label text-on-surface-variant">
                Shown as {formatOffset(draft.timezone_offset_min)}
              </p>
            )}
            {f.hint && (
              <p className="mt-1 text-micro-label text-on-surface-variant">{f.hint}</p>
            )}
          </div>
        ))}
      </div>

      <Button
        className="mt-4"
        disabled={!numericDirty}
        isLoading={saveNumericMut.isPending}
        onClick={handleSaveNumeric}
      >
        Save settings
      </Button>

<div className="mt-5 border-t border-outline-variant/40 pt-4">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MapPin size={14} />
            <span className="text-label-caps">DEVICE LOCATION</span>
          </div>
          <p className="mt-1 text-micro-label text-on-surface-variant">
            Used for local time and weather on your companion. Set city name and
            coordinates so the backend can fetch live weather.
          </p>
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const lat = locLat.trim() ? Number(locLat) : null;
              const lng = locLng.trim() ? Number(locLng) : null;
              if (!locCity.trim() && lat == null && lng == null) return;
              if ((lat == null) !== (lng == null)) {
                toast.error('Latitude and longitude must both be set together');
                return;
              }
              if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
                toast.error('Latitude must be between -90 and 90');
                return;
              }
              if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
                toast.error('Longitude must be between -180 and 180');
                return;
              }
              locMut.mutate({ city: locCity.trim(), latitude: lat, longitude: lng });
            }}
          >
            <Input
              label="City"
              value={locCity}
              maxLength={120}
              onChange={(e) => setLocCity(e.target.value)}
              placeholder="e.g. Dhaka, Bangladesh"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                value={locLat}
                onChange={(e) => setLocLat(e.target.value)}
                placeholder="e.g. 23.8103"
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                value={locLng}
                onChange={(e) => setLocLng(e.target.value)}
                placeholder="e.g. 90.4125"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-micro-label text-on-surface-variant">
                {locCity.length}/120 characters
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!locCity.trim() && !locLat.trim() && !locLng.trim()}
                isLoading={locMut.isPending}
              >
                Save location
              </Button>
            </div>
          </form>
        </div>
    </Card>
  );
}