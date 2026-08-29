'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CloudDownload,
  Send,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Wifi,
  HardDrive,
  Clock,
  Activity,
  Terminal,
} from 'lucide-react';
import {
  adminDevice,
  adminDeviceStatus,
  adminDeviceEvents,
  adminDeviceCommands,
  adminSendCommand,
  firmwareReleases,
} from '@/lib/api';
import { COMMAND_DEFINITIONS } from '@/lib/registry';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { CommandForm } from '@/components/CommandForm';
import { DeviceEmotionalModeCard, DeviceMoodCard } from '@/components/DeviceModeCard';
import { Card, CardHeader, Button, Select, Sheet, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { timeAgo, formatDate, extractError, formatBytes } from '@/lib/utils';
import { batteryLabel, batteryStatus } from '@/lib/battery';
import type { FirmwareRelease } from '@/lib/types';

export default function AdminDeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deviceId = params.deviceId;

  const { data: device, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'devices', deviceId],
    queryFn: () => adminDevice(deviceId),
  });
  const { data: status } = useQuery({
    queryKey: ['admin', 'devices', deviceId, 'status'],
    queryFn: () => adminDeviceStatus(deviceId),
  });
  const { data: events } = useQuery({
    queryKey: ['admin', 'devices', deviceId, 'events'],
    queryFn: () => adminDeviceEvents(deviceId),
  });
  const { data: commands } = useQuery({
    queryKey: ['admin', 'devices', deviceId, 'commands'],
    queryFn: () => adminDeviceCommands(deviceId),
  });
  const { data: releases } = useQuery({
    queryKey: ['admin', 'firmware'],
    queryFn: firmwareReleases,
  });

  const [commandOpen, setCommandOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState('');

  const sendMut = useMutation({
    mutationFn: ({ command, payload }: { command: string; payload: Record<string, unknown> }) =>
      adminSendCommand(deviceId, command, payload),
    onSuccess: () => {
      toast.success('Command sent to device');
      setCommandOpen(false);
      setUpdateOpen(false);
      setSelectedRelease('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'devices', deviceId, 'commands'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const checkNow = () =>
    sendMut.mutate({ command: 'ota_check', payload: {} }, { onSuccess: () => toast.success('Update check pushed to device') });

  const sendUpdate = (releaseId?: string) => {
    const relId = releaseId || selectedRelease;
    if (!relId) return toast.error('Choose a release to send');
    sendMut.mutate(
      { command: 'ota_check', payload: { release_id: relId } },
      { onSuccess: () => toast.success('Update pushed to device') },
    );
  };

  const restartDevice = () =>
    sendMut.mutate({ command: 'restart', payload: {} }, { onSuccess: () => toast.success('Restart command sent') });

  if (isLoading) return <Loading label="Loading device details…" />;
  if (isError || !device) return <ErrorState message={extractError(error).message} onRetry={() => void refetch()} />;

  const telemetry = status?.presence?.telemetry as Record<string, unknown> | undefined;
  const batteryPercentage = typeof telemetry?.battery_percentage === 'number' ? telemetry.battery_percentage : null;
  const batteryVoltage = typeof telemetry?.battery_voltage === 'number' ? telemetry.battery_voltage : null;
  const currentBatteryStatus = batteryStatus(batteryPercentage, batteryVoltage);

  // Compare device firmware against published releases
  const hwModel = device.hardware_model || 'ESP32-WROOM-32';
  const publishedForHw = (releases ?? []).filter(
    (r) => r.status === 'published' && r.hardware_model === hwModel,
  );
  const latestRelease = publishedForHw[0]; // Releases returned sorted newest first

  const devBuild = typeof device.firmware_build === 'number' ? device.firmware_build : Number(device.firmware_build) || 0;
  const relBuild = latestRelease?.build_number ? Number(latestRelease.build_number) : 0;
  const isUpdateAvailable =
    !!latestRelease &&
    (devBuild > 0 && relBuild > 0
      ? relBuild > devBuild
      : device.firmware_version !== latestRelease.version);

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => router.back()}
        className="flex min-h-[40px] items-center gap-2 font-mono text-xs font-bold text-[#64748B] hover:text-[#1E232B] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> BACK TO DEVICES
      </button>

      <PageHeader
        title={device?.name || device?.device_id || 'Device'}
        subtitle={`${device?.device_id} · ${hwModel} · ${device?.firmware_channel || 'stable'}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} />
            <Button variant="outline" size="sm" onClick={restartDevice} disabled={sendMut.isPending}>
              <RotateCw size={14} /> Restart
            </Button>
            <Button size="sm" onClick={() => setCommandOpen(true)}>
              <Send size={14} /> Send command
            </Button>
          </div>
        }
      />

      {/* Firmware Update Available Alert Banner */}
      {isUpdateAvailable && latestRelease && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#FFEBEF] border border-[#FF5A5F]/30 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#FF5A5F] border border-[#FF5A5F]/20">
              <CloudDownload size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#1E232B]">
                Firmware Update Available: v{latestRelease.version} (build {latestRelease.build_number})
              </h4>
              <p className="font-mono text-[11px] text-[#64748B]">
                Device currently running v{device.firmware_version || '0.0.0'} (build {device.firmware_build ?? 0}). Target: {latestRelease.hardware_model}.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => sendUpdate(latestRelease.id)}
            disabled={sendMut.isPending}
            variant="primary"
          >
            <Send size={14} /> Push Update v{latestRelease.version} Now
          </Button>
        </div>
      )}

      {/* Grid Row 1: Firmware Control + Live Telemetry */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Firmware & Update Management Card */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Firmware &amp; OTA Control"
            subtitle="Channel, versioning, and direct release push"
            action={
              !isUpdateAvailable ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#C7F9CC] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#065A60]">
                  <CheckCircle2 size={12} /> Up to date
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#92400E]">
                  <AlertCircle size={12} /> Update available
                </span>
              )
            }
          />
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">INSTALLED VERSION</span>
              <p className="text-sm font-extrabold text-[#1E232B]">v{device.firmware_version || '0.1.0'}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">BUILD NUMBER</span>
              <p className="text-sm font-extrabold text-[#1E232B]">
                {typeof device.firmware_build === 'number' || typeof device.firmware_build === 'string'
                  ? String(device.firmware_build)
                  : '—'}
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">HARDWARE MODEL</span>
              <p className="text-sm font-bold text-[#1E232B]">{hwModel}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">FIRMWARE CHANNEL</span>
              <p className="text-sm font-bold text-[#1E232B] uppercase">{device.firmware_channel || 'stable'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={checkNow} disabled={sendMut.isPending}>
              <CloudDownload size={16} />
              {sendMut.isPending ? 'Pushing check command…' : 'Check for update now'}
            </Button>
            <Button variant="secondary" onClick={() => setUpdateOpen(true)} disabled={sendMut.isPending}>
              <Send size={16} /> Force specific release
            </Button>
            <p className="mt-1 font-mono text-[10px] text-[#94A3B8]">
              Commands are delivered over WebSocket if connected, or queued until next heartbeat.
            </p>
          </div>
        </Card>

        {/* Live Telemetry & Presence Card */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Live Telemetry &amp; Metrics"
            subtitle={`Last reported ${timeAgo(status?.presence?.last_seen as string)}`}
            action={<Activity size={18} className="text-[#FF5A5F]" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#64748B] border border-[#E2E8F0]">
                <Wifi size={18} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">PRESENCE</span>
                <p className="text-sm font-extrabold text-[#1E232B] capitalize">{status?.presence?.status || 'Offline'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#64748B] border border-[#E2E8F0]">
                <HardDrive size={18} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">FREE HEAP</span>
                <p className="text-sm font-extrabold text-[#1E232B]">
                  {telemetry?.heap_free != null ? formatBytes(Number(telemetry.heap_free)) : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#64748B] border border-[#E2E8F0]">
                <Clock size={18} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">UPTIME</span>
                <p className="text-sm font-extrabold text-[#1E232B]">
                  {telemetry?.uptime != null ? `${Math.floor(Number(telemetry.uptime) / 3600)}h ${Math.floor((Number(telemetry.uptime) % 3600) / 60)}m` : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#64748B] border border-[#E2E8F0]">
                <Zap size={18} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">BATTERY / TEMP</span>
                <p className="text-sm font-extrabold text-[#1E232B]">
                  {currentBatteryStatus !== 'unavailable' && batteryPercentage !== null
                    ? `${Math.round(batteryPercentage)}%${batteryVoltage !== null ? ` · ${batteryVoltage.toFixed(2)}V` : ''}`
                    : batteryLabel(currentBatteryStatus)}
                </p>
                <p className="font-mono text-[10px] text-[#94A3B8]">
                  {telemetry?.temperature != null ? `${telemetry.temperature}°C` : 'Temp unavailable'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DeviceEmotionalModeCard deviceId={deviceId} admin />
        <DeviceMoodCard deviceId={deviceId} admin />
      </div>

      {/* Grid Row 2: Logs (Events & Commands) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Device Events Log */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Received Device Events"
            subtitle="Last 50 hardware events & heartbeats"
            action={<Terminal size={18} className="text-[#94A3B8]" />}
          />
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {!events?.length ? (
              <p className="py-8 text-center text-xs text-[#94A3B8]">No events recorded from this device.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#FF5A5F] border border-[#E2E8F0]">
                      {e.type}
                    </span>
                    <span className="font-mono text-[10px] text-[#94A3B8]">{formatDate(e.created_at)}</span>
                  </div>
                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-white p-2.5 font-mono text-[10px] text-[#64748B] border border-[#E2E8F0]">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Commands Dispatch Log */}
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Command History"
            subtitle="Sent commands & delivery status"
            action={<Send size={18} className="text-[#94A3B8]" />}
          />
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {!commands?.length ? (
              <p className="py-8 text-center text-xs text-[#94A3B8]">No commands sent yet.</p>
            ) : (
              commands.map((c) => (
                <div key={c.id} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-[#1E232B]">{c.command_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#94A3B8]">{timeAgo(c.created_at)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  {c.payload && Object.keys(c.payload).length > 0 && (
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-white p-2.5 font-mono text-[10px] text-[#64748B] border border-[#E2E8F0]">
                      {JSON.stringify(c.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Sheets: Command Form & Release Selector */}
      <Sheet open={commandOpen} onClose={() => setCommandOpen(false)} title={`Send command to ${device?.name || 'device'}`}>
        <CommandForm
          commands={COMMAND_DEFINITIONS.map((c) => ({ command: c.command, label: c.label }))}
          busy={sendMut.isPending}
          onSubmit={(command, payload) => sendMut.mutate({ command, payload })}
        />
      </Sheet>

      <Sheet
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        title={`Force firmware update on ${device?.name || 'device'}`}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Target Firmware Release"
            value={selectedRelease}
            onChange={(e) => setSelectedRelease(e.target.value)}
          >
            <option value="">Select a release…</option>
            {(releases ?? [])
              .filter((r) => r.status === 'published')
              .filter((r) => !device.hardware_model || r.hardware_model === device.hardware_model)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.version} (build {r.build_number}) · {r.hardware_model} · {r.channel}
                </option>
              ))}
          </Select>
          {!releases?.some((r) => r.status === 'published') && (
            <p className="font-mono text-xs text-[#94A3B8]">
              No published releases available. Upload and publish a release from the Firmware page first.
            </p>
          )}
          <Button onClick={() => sendUpdate()} disabled={sendMut.isPending || !selectedRelease}>
            {sendMut.isPending ? 'Pushing…' : 'Push release to device'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
