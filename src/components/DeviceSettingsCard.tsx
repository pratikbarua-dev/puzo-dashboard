'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellOff, ListOrdered, Locate, MapPin, Search, Timer, Vibrate, Volume2, X } from 'lucide-react';
import { getDeviceSettings, getProfileLocation, updateDeviceSettings, updateProfileLocation } from '@/lib/api';
import type { DeviceSettings, DeviceSettingsPatch, HapticIntensity } from '@/lib/types';
import { HAPTIC_INTENSITIES } from '@/lib/registry';
import { useAuth } from '@/lib/auth-store';
import { Card, CardHeader, Button, Input, Toggle, Select, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

type SettingsDraft = Pick<
  DeviceSettings,
  | 'sleep_timeout_min'
  | 'focus_duration_min'
  | 'timezone_offset_min'
  | 'wake_sound_enabled'
  | 'wake_vibration_enabled'
  | 'quiet_mode_enabled'
  | 'eye_pack'
  | 'volume'
  | 'haptic_intensity'
>;

type ToggleDraft = Pick<SettingsDraft, 'wake_sound_enabled' | 'wake_vibration_enabled' | 'quiet_mode_enabled'>;

const NUMERIC_FIELDS: {
  key: keyof Pick<
    DeviceSettings,
    'sleep_timeout_min' | 'focus_duration_min' | 'timezone_offset_min'
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
        wake_sound_enabled: settings.wake_sound_enabled,
        wake_vibration_enabled: settings.wake_vibration_enabled,
        quiet_mode_enabled: settings.quiet_mode_enabled,
        eye_pack: settings.eye_pack,
        // Devices provisioned before these settings existed answer without them.
        volume: settings.volume ?? 70,
        haptic_intensity: settings.haptic_intensity ?? 'medium',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
        );
        if (res.ok) {
          const data = (await res.json()) as { results?: { id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }[] };
          setSuggestions(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = (item: { name: string; latitude: number; longitude: number; country?: string; admin1?: string }) => {
    const parts = [item.name, item.admin1, item.country].filter(Boolean);
    const fullName = parts.join(', ');
    setLocCity(fullName);
    setLocLat(String(item.latitude));
    setLocLng(String(item.longitude));
    setSearchQuery('');
    setShowDropdown(false);
    locMut.mutate({ city: fullName, latitude: item.latitude, longitude: item.longitude });
  };

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        let name = `Location (${lat}, ${lng})`;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (res.ok) {
            const data = (await res.json()) as { city?: string; locality?: string; countryName?: string };
            const cityName = data.city || data.locality || '';
            if (cityName) {
              name = data.countryName ? `${cityName}, ${data.countryName}` : cityName;
            }
          }
        } catch {
          // ignore fallback
        }
        setLocCity(name);
        setLocLat(String(lat));
        setLocLng(String(lng));
        setIsGeolocating(false);
        locMut.mutate({ city: name, latitude: lat, longitude: lng });
      },
      (err) => {
        setIsGeolocating(false);
        toast.error(`Geolocation failed: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

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

  const eyePackMut = useMutation({
    mutationFn: (eye_pack: DeviceSettings['eye_pack']) => updateDeviceSettings(deviceId, { eye_pack }),
    onSuccess: () => {
      toast.success('OLED eye style updated');
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const volumeMut = useMutation({
    mutationFn: (volume: number) => updateDeviceSettings(deviceId, { volume }),
    onSuccess: (_data, volume) => {
      toast.success(`Volume set to ${volume}%`);
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const hapticMut = useMutation({
    mutationFn: (haptic_intensity: HapticIntensity) =>
      updateDeviceSettings(deviceId, { haptic_intensity }),
    onSuccess: (_data, haptic_intensity) => {
      toast.success(`Vibration strength set to ${haptic_intensity}`);
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  // The slider fires on every pixel of travel, so the value is only sent once the
  // user lets go — a drag from 20 to 80 is one command, not sixty.
  const sentVolume = useRef<number | null>(null);
  const commitVolume = () => {
    if (!draft) return;
    const target = sentVolume.current ?? settings?.volume ?? null;
    if (draft.volume === target) return;
    sentVolume.current = draft.volume;
    volumeMut.mutate(draft.volume);
  };

  if (isLoading) return <Loading label="Loading device settings…" />;
  if (isError || !draft) {
    return (
      <ErrorState message={extractError(error).message} onRetry={() => void refetch()} />
    );
  }

  return (
    <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
      <CardHeader
        title="Behavior & Display"
        subtitle="Settings synced directly to this PUZO hardware"
        action={<ListOrdered size={18} className="text-[#94A3B8]" />}
      />

      <div className="mb-4 flex flex-col divide-y divide-[#F1F5F9] rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-1">
        {TOGGLE_FIELDS.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-3 py-3">
            <span className="flex items-center gap-2.5 text-sm font-bold text-[#1E232B]">
              <span className="text-[#FF5A5F]">{t.icon}</span>
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

      <div className="mb-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#1E232B]">
            <Volume2 size={16} className="text-[#FF5A5F]" />
            Speaker Volume
          </span>
          <span className="font-mono text-xs font-bold text-[#FF5A5F] tabular-nums">
            {draft.volume}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={draft.volume}
          aria-label="Speaker volume"
          disabled={volumeMut.isPending}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDraft((d) => (d ? { ...d, volume: value } : d));
          }}
          onPointerUp={commitVolume}
          onKeyUp={commitVolume}
          onBlur={commitVolume}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E2E8F0] accent-[#FF5A5F] disabled:opacity-50"
        />
        <p className="mt-2 text-[11px] text-[#64748B]">
          {draft.volume === 0
            ? 'Muted — sounds are skipped entirely.'
            : 'Scales playback level in software; amplifier gain is fixed in hardware.'}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#1E232B]">
            <Vibrate size={16} className="text-[#2EC4B6]" />
            Vibration Strength
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Vibration strength">
          {HAPTIC_INTENSITIES.map((i) => {
            const active = draft.haptic_intensity === i.value;
            return (
              <button
                key={i.value}
                type="button"
                aria-pressed={active}
                disabled={hapticMut.isPending}
                onClick={() => {
                  if (active) return;
                  setDraft((d) => (d ? { ...d, haptic_intensity: i.value } : d));
                  hapticMut.mutate(i.value);
                }}
                className={`rounded-xl border py-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                  active
                    ? 'border-[#2EC4B6] bg-[#C7F9CC]/40 text-[#065A60] shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                {i.label}
              </button>
            );
          })}
        </div>
        {draft.quiet_mode_enabled && (
          <p className="mt-2 text-[11px] font-mono text-[#A82835]">
            Quiet mode is on, so this PUZO stays silent and still until turned off.
          </p>
        )}
      </div>

      <div className="mb-4">
        <Select
          label="OLED Eye Style"
          value={draft.eye_pack}
          disabled={eyePackMut.isPending}
          onChange={(event) => {
            const value = event.target.value as DeviceSettings['eye_pack'];
            setDraft((d) => (d ? { ...d, eye_pack: value } : d));
            eyePackMut.mutate(value);
          }}
        >
          <option value="classic">PUZO Classic (Parametric Eyes)</option>
          <option value="iris_oled">IrisOLED Expressions (Bitmap Reactions)</option>
        </Select>
        <p className="mt-1 text-[11px] text-[#94A3B8]">IrisOLED is an SSD1306 expressive eye pack with bitmap reactions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
              <p className="mt-1 font-mono text-[10px] text-[#94A3B8]">
                Shown as {formatOffset(draft.timezone_offset_min)}
              </p>
            )}
            {f.hint && (
              <p className="mt-1 text-[10px] text-[#94A3B8]">{f.hint}</p>
            )}
          </div>
        ))}
      </div>

      <Button
        className="mt-4 w-full"
        disabled={!numericDirty}
        isLoading={saveNumericMut.isPending}
        onClick={handleSaveNumeric}
      >
        Save Settings
      </Button>

      <div className="mt-5 border-t border-[#F1F5F9] pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#94A3B8] uppercase">
            <MapPin size={13} className="text-[#FF5A5F]" />
            <span>DEVICE LOCATION</span>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isGeolocating}
            className="flex items-center gap-1 text-xs font-bold text-[#FF5A5F] hover:underline disabled:opacity-50 cursor-pointer"
          >
            <Locate size={13} className={isGeolocating ? 'animate-spin' : ''} />
            {isGeolocating ? 'Detecting…' : 'Detect my location'}
          </button>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          Used for local weather on your companion. Search a city to auto-detect coordinates.
        </p>

        {locCity && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <MapPin size={16} className="shrink-0 text-[#FF5A5F]" />
              <div className="truncate">
                <span className="font-bold text-[#1E232B]">{locCity}</span>
                {locLat && locLng && (
                  <span className="ml-2 font-mono text-xs text-[#94A3B8]">
                    ({Number(locLat).toFixed(2)}°, {Number(locLng).toFixed(2)}°)
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              title="Clear location"
              onClick={() => {
                setLocCity('');
                setLocLat('');
                setLocLng('');
                locMut.mutate({ city: '', latitude: null, longitude: null });
              }}
              className="ml-2 text-[#94A3B8] hover:text-[#1E232B] cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="relative mt-3" ref={dropdownRef}>
          <div className="relative">
            <Input
              label={locCity ? 'Change location' : 'Search city'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Start typing a city (e.g. Dhaka, New York, London)..."
            />
            {isSearching && (
              <div className="absolute right-3 top-9 flex items-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF5A5F] border-t-transparent" />
              </div>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white py-1.5 shadow-xl">
              {suggestions.map((item) => {
                const region = [item.admin1, item.country].filter(Boolean).join(', ');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCity(item)}
                    className="flex w-full flex-col text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#1E232B]">{item.name}</span>
                    {region && (
                      <span className="text-xs text-[#64748B]">{region}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {showDropdown && !isSearching && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center text-xs text-[#94A3B8] shadow-xl">
              No matching cities found
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
