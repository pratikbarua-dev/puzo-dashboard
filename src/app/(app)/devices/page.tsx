'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Battery,
  Wifi,
  Edit2,
  Unlink,
  Settings as SettingsIcon,
  Download,
  Check,
  Plus,
  ChevronRight,
  Radio,
  Copy,
} from 'lucide-react';
import {
  myDevices,
  updateMyDevice,
  removeMyDevice,
  getDeviceSettings,
  updateDeviceSettings,
  sendDeviceCommand,
  createDeviceSetupSession,
  getDeviceSetupSession,
} from '@/lib/api';
import type { Device, DeviceSettingsPatch } from '@/lib/types';
import { Button, Input, Sheet, Toggle, ConfirmDialog, EmptyState, Loading } from '@/components/ui';
import { DeviceEmotionalModeCard } from '@/components/DeviceModeCard';
import { EmotionEngineCard } from '@/components/EmotionEngineCard';
import { toast } from '@/components/Toast';
import { batteryLabel, batteryStatus } from '@/lib/battery';
import { extractError, timeAgo } from '@/lib/utils';

const SLEEP_OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: 'Never', value: 0 },
];

/** Human label for a Wi-Fi RSSI reading, matching the firmware's own bands. */
function signalLabel(rssi?: number | null): string {
  if (rssi == null) return 'Unknown';
  if (rssi >= -55) return 'Excellent';
  if (rssi >= -67) return 'Good';
  if (rssi >= -80) return 'Fair';
  return 'Weak';
}

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: myDevices });

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [unpairOpen, setUnpairOpen] = useState(false);
  const [wifiResetOpen, setWifiResetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const device: Device | undefined = useMemo(() => {
    if (!devices?.length) return undefined;
    return devices.find((d) => d.device_id === selectedDeviceId) ?? devices[0];
  }, [devices, selectedDeviceId]);

  const deviceId = device?.device_id;

  /* ---- hardware (NVS) settings ---- */

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['devices', deviceId, 'settings'],
    queryFn: () => getDeviceSettings(deviceId!),
    enabled: !!deviceId,
  });

  const settingsMut = useMutation({
    mutationFn: (patch: DeviceSettingsPatch) => updateDeviceSettings(deviceId!, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['devices', deviceId, 'settings'], updated);
      toast.success('Saved to your PUZO');
    },
    onError: (err) => {
      toast.error(extractError(err).message);
      void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'settings'] });
    },
  });

  const renameMut = useMutation({
    mutationFn: (name: string) => updateMyDevice(deviceId!, { name }),
    onSuccess: (updated) => {
      toast.success(`Renamed to "${updated.name}"`);
      setRenameOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const unpairMut = useMutation({
    mutationFn: () => removeMyDevice(deviceId!),
    onSuccess: () => {
      toast.success('PUZO unpaired from your account');
      setUnpairOpen(false);
      setSelectedDeviceId('');
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const wifiResetMut = useMutation({
    mutationFn: () => sendDeviceCommand(deviceId!, 'wifi_reset_warning', {}),
    onSuccess: () => {
      toast.info('PUZO will clear its Wi-Fi and reopen its setup hotspot.');
      setWifiResetOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (isLoading) return <Loading label="Loading your PUZO hardware…" />;

  return (
    <div className="flex flex-col gap-5 pt-2 pb-10 select-none">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E232B]">
            My Devices
          </h1>
          <p className="mt-1 text-xs text-[#64748B] font-medium">
            Manage your connected PUZO hardware.
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#FF5A5F] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#E64E53] transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Add PUZO</span>
        </button>
      </div>

      {!device && (
        <EmptyState
          icon={<Radio size={26} />}
          title="No PUZO paired yet"
          message="Power on your PUZO, join its setup hotspot, then add it here to link it to your account."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              <span>Add PUZO Hardware</span>
            </Button>
          }
        />
      )}

      {/* 2. Device switcher — every device is tappable through to its detail page */}
      {devices && devices.length > 1 && (
        <div className="flex flex-col gap-2">
          {devices.map((d) => {
            const active = d.device_id === device?.device_id;
            return (
              <div
                key={d.device_id}
                className={`flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 transition-colors ${
                  active ? 'border-[#FF5A5F]' : 'border-[#EBF0F5]'
                }`}
              >
                <button
                  onClick={() => setSelectedDeviceId(d.device_id)}
                  className="flex flex-1 items-center gap-2.5 text-left cursor-pointer"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      d.status === 'online' ? 'bg-emerald-500' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span className="text-sm font-bold text-[#1E232B]">{d.name || d.device_id}</span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">{d.device_id}</span>
                </button>
                <Link
                  href={`/devices/${d.device_id}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E232B] transition-colors"
                  title="Open device details"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {device && (
        <>
          {/* 3. Primary Device Card */}
          <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFEBEF] text-[#FF5A5F]">
                <Smartphone size={28} className="text-[#FF5A5F]" />
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/devices/${device.device_id}`}
                  className="flex items-center gap-1 text-xl font-extrabold tracking-tight text-[#1E232B] hover:text-[#FF5A5F] transition-colors truncate"
                >
                  <span className="truncate">{device.name || device.device_id}</span>
                  <ChevronRight size={18} className="shrink-0 text-[#94A3B8]" />
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  {device.status === 'online' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7F9CC] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#065A60]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#065A60]" />
                      CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#64748B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
                      {device.status === 'updating' ? 'UPDATING' : 'OFFLINE'}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    {timeAgo(device.last_seen ?? device.last_seen_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Real battery & Wi-Fi telemetry */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(() => {
                const status = batteryStatus(device.battery_percentage, device.battery_voltage);
                return (
                  <div
                    className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-mono font-bold ${
                      status === 'critical'
                        ? 'bg-[#FFEBEF] text-[#B92B34]'
                        : status === 'low'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#F1F5F9] text-[#1E232B]'
                    }`}
                    title={batteryLabel(status)}
                  >
                    <Battery
                      size={16}
                      className={status === 'normal' ? 'text-[#64748B]' : 'text-current'}
                    />
                    <span>
                      {device.battery_percentage != null
                        ? `${device.battery_percentage}%`
                        : device.battery_voltage != null
                        ? `${device.battery_voltage.toFixed(2)}V`
                        : '—'}
                    </span>
                  </div>
                );
              })()}

              <div
                className="flex items-center gap-2 rounded-2xl bg-[#F1F5F9] px-4 py-3 text-xs font-mono font-bold text-[#1E232B]"
                title={`Wi-Fi signal: ${signalLabel(device.wifi_rssi)}`}
              >
                <Wifi size={16} className="text-[#64748B]" />
                <span>{device.wifi_rssi != null ? `${device.wifi_rssi} dBm` : '—'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              <Button
                variant="coralOutline"
                size="md"
                onClick={() => {
                  setNewName(device.name || '');
                  setRenameOpen(true);
                }}
                className="w-full py-3"
              >
                <Edit2 size={16} />
                <span>Rename Device</span>
              </Button>

              <Button
                variant="softPink"
                size="md"
                onClick={() => setUnpairOpen(true)}
                className="w-full py-3"
              >
                <Unlink size={16} />
                <span>Unpair</span>
              </Button>
            </div>
          </div>

          {/* 4. Hardware Configuration — writes real NVS keys via set_config */}
          <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SettingsIcon size={18} className="text-[#FF5A5F]" />
                <h3 className="text-base font-extrabold text-[#1E232B]">Configuration</h3>
              </div>
              {settingsMut.isPending && (
                <span className="font-mono text-[10px] text-[#94A3B8]">saving…</span>
              )}
            </div>

            {settingsLoading ? (
              <p className="py-4 text-xs font-mono text-[#94A3B8]">Reading device config…</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#F1F5F9]">
                {/* Sleep Timeout → sleep_timeout_min */}
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-bold text-[#1E232B]">Sleep Timeout</p>
                    <p className="text-xs font-mono text-[#94A3B8]">Screen off delay</p>
                  </div>
                  <select
                    value={String(settings?.sleep_timeout_min ?? 15)}
                    disabled={settingsMut.isPending}
                    onChange={(e) =>
                      settingsMut.mutate({ sleep_timeout_min: Number(e.target.value) })
                    }
                    className="rounded-2xl bg-[#F1F5F9] border-none px-3.5 py-2 text-xs font-mono font-bold text-[#1E232B] outline-none cursor-pointer disabled:opacity-50"
                  >
                    {SLEEP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* System Sounds → wake_sound_enabled */}
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-bold text-[#1E232B]">System Sounds</p>
                    <p className="text-xs font-mono text-[#94A3B8]">Chimes &amp; alerts</p>
                  </div>
                  <Toggle
                    checked={settings?.wake_sound_enabled ?? true}
                    onChange={(v) => settingsMut.mutate({ wake_sound_enabled: v })}
                    ariaLabel="System sounds"
                  />
                </div>

                {/* Haptic Feedback → wake_vibration_enabled */}
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-bold text-[#1E232B]">Haptic Feedback</p>
                    <p className="text-xs font-mono text-[#94A3B8]">Vibration motor</p>
                  </div>
                  <Toggle
                    checked={settings?.wake_vibration_enabled ?? true}
                    onChange={(v) => settingsMut.mutate({ wake_vibration_enabled: v })}
                    ariaLabel="Haptic feedback"
                  />
                </div>

                {/* Quiet Mode → quiet_mode_enabled */}
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-bold text-[#1E232B]">Quiet Mode</p>
                    <p className="text-xs font-mono text-[#94A3B8]">Mute sound &amp; vibration</p>
                  </div>
                  <Toggle
                    checked={settings?.quiet_mode_enabled ?? false}
                    onChange={(v) => settingsMut.mutate({ quiet_mode_enabled: v })}
                    ariaLabel="Quiet mode"
                  />
                </div>

                {/* Wi-Fi Network → real telemetry + wifi_reset_warning command */}
                <div className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1E232B]">Wi-Fi Network</p>
                    <p className="truncate text-xs font-mono text-[#94A3B8]">
                      {device.last_ip
                        ? `${device.last_ip} · ${signalLabel(device.wifi_rssi)}`
                        : 'No connection reported yet'}
                    </p>
                  </div>
                  <button
                    onClick={() => setWifiResetOpen(true)}
                    disabled={wifiResetMut.isPending}
                    className="shrink-0 rounded-2xl bg-[#F1F5F9] px-3.5 py-1.5 text-xs font-bold text-[#1E232B] hover:bg-[#E2E8F0] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Personality & Emotional Mode */}
          <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5">
            <DeviceEmotionalModeCard deviceId={device.device_id} />
          </div>

          {/* 6. Contextual Awareness Emotion Engine */}
          <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5">
            <EmotionEngineCard deviceId={device.device_id} />
          </div>

          {/* 7. Firmware */}
          <Link
            href={`/devices/${device.device_id}`}
            className="rounded-[32px] bg-white p-5 border border-[#EBF0F5] shadow-sm flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C7F9CC] text-[#065A60]">
                <Download size={22} className="text-[#065A60]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#1E232B]">Firmware</p>
                <p className="truncate text-xs font-mono text-[#94A3B8]">
                  {device.firmware_version
                    ? `${device.firmware_version} · ${device.firmware_channel} channel`
                    : `${device.firmware_channel} channel · version not reported`}
                </p>
              </div>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
              {device.firmware_version ? <Check size={16} /> : <ChevronRight size={16} />}
            </div>
          </Link>
        </>
      )}

      {/* Rename Sheet */}
      <Sheet open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename PUZO">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) {
              toast.error('Give your PUZO a name first.');
              return;
            }
            renameMut.mutate(name);
          }}
          className="flex flex-col gap-4 py-2"
        >
          <Input
            label="Device Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={120}
            placeholder="Living room PUZO"
          />
          <Button type="submit" disabled={renameMut.isPending} className="w-full">
            {renameMut.isPending ? 'Saving…' : 'Save Name'}
          </Button>
        </form>
      </Sheet>

      {/* Add hardware Sheet */}
      <AddDeviceSheet open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Unpair confirm */}
      <ConfirmDialog
        open={unpairOpen}
        onClose={() => setUnpairOpen(false)}
        title="Unpair PUZO"
        message={`This unlinks ${
          device?.name || device?.device_id || 'this device'
        } from your account. Its token is revoked, so you will need to run setup again to reconnect it.`}
        confirmLabel="Unpair"
        onConfirm={() => unpairMut.mutate()}
        busy={unpairMut.isPending}
      />

      {/* Wi-Fi reset confirm */}
      <ConfirmDialog
        open={wifiResetOpen}
        onClose={() => setWifiResetOpen(false)}
        title="Reset Wi-Fi"
        message="Your PUZO will forget its saved network and reopen its setup hotspot. You will need to reconnect it to Wi-Fi from the setup portal."
        confirmLabel="Reset Wi-Fi"
        onConfirm={() => wifiResetMut.mutate()}
        busy={wifiResetMut.isPending}
      />
    </div>
  );
}

/**
 * Real device onboarding: creates a setup session on the backend, shows the
 * one-time 8-digit code to type into the PUZO setup portal, then polls the
 * session until the hardware claims it.
 */
function AddDeviceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [setupId, setSetupId] = useState('');
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const reset = () => {
    setSetupId('');
    setName('');
    setSessionId(null);
    setCode(null);
    setExpiresAt(null);
  };

  const createMut = useMutation({
    mutationFn: () =>
      createDeviceSetupSession({
        setup_id: setupId.trim().replace(/\s+/g, ''),
        name: name.trim(),
      }),
    onSuccess: (session) => {
      setSessionId(session.session_id);
      setCode(session.code);
      setExpiresAt(session.expires_at);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const { data: session } = useQuery({
    queryKey: ['device-setup', sessionId],
    queryFn: () => getDeviceSetupSession(sessionId!),
    enabled: !!sessionId && open,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (session?.status === 'claimed') {
      toast.success(`${session.device?.name || session.setup_id} is now linked to your account.`);
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      reset();
      onClose();
    } else if (session?.status === 'expired') {
      toast.error('That setup code expired. Generate a new one.');
      setSessionId(null);
      setCode(null);
    }
  }, [session, queryClient, onClose]);

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add PUZO Hardware"
    >
      {code ? (
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-center">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
              Setup code
            </p>
            <p className="mt-1.5 font-mono text-3xl font-black tracking-[0.2em] text-[#1E232B]">
              {code}
            </p>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(code);
                toast.info('Code copied');
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] hover:text-[#1E232B] cursor-pointer"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>

          <ol className="flex flex-col gap-2 text-xs text-[#475569]">
            <li>
              1. Join your PUZO&apos;s hotspot, then open{' '}
              <span className="font-mono font-bold text-[#1E232B]">http://192.168.4.1</span>
            </li>
            <li>2. Enter the code above and your home Wi-Fi credentials.</li>
            <li>3. This screen updates automatically once your PUZO checks in.</li>
          </ol>

          <p className="text-[11px] font-mono text-[#94A3B8]">
            Waiting for hardware… {expiresAt ? `code expires ${timeAgo(expiresAt)}` : ''}
          </p>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setCode(null);
              setSessionId(null);
            }}
          >
            Start over
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!setupId.trim() || !name.trim()) {
              toast.error('Enter both the setup ID and a name.');
              return;
            }
            createMut.mutate();
          }}
          className="flex flex-col gap-4 py-2"
        >
          <Input
            label="Setup ID"
            hint="The suffix printed on your PUZO or in its hotspot name, e.g. PUZO-5DC0 → 5DC0"
            value={setupId}
            onChange={(e) => setSetupId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
            placeholder="5DC0"
            maxLength={80}
          />
          <Input
            label="Device Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Living room PUZO"
            maxLength={120}
          />
          <Button type="submit" disabled={createMut.isPending} className="w-full">
            {createMut.isPending ? 'Generating…' : 'Generate Setup Code'}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
