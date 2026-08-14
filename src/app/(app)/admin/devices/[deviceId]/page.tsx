'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CloudDownload, Send } from 'lucide-react';
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
import { Card, CardHeader, Button, Select, Sheet, Loading, ErrorState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { timeAgo, formatDate, extractError } from '@/lib/utils';

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
      toast.success('Command sent');
      setCommandOpen(false);
      setUpdateOpen(false);
      setSelectedRelease('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'devices', deviceId, 'commands'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const checkNow = () =>
    sendMut.mutate({ command: 'ota_check', payload: {} }, { onSuccess: () => toast.success('Update check pushed to device') });
  const sendUpdate = () => {
    if (!selectedRelease) return toast.error('Choose a release to send');
    sendMut.mutate(
      { command: 'ota_check', payload: { release_id: selectedRelease } },
      { onSuccess: () => toast.success('Update pushed to device') },
    );
  };

  if (isLoading) return <Loading />;
  if (isError || !device) return <ErrorState message={extractError(error).message} onRetry={() => void refetch()} />;

  const telemetry = status?.presence?.telemetry as Record<string, unknown> | undefined;
  const telemRows = telemetry
    ? Object.entries(telemetry).map(([k, v]) => ({ label: k.replace(/_/g, ' '), value: String(v ?? '—') }))
    : [];

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-3 flex min-h-[44px] items-center gap-2 text-label-caps text-on-surface-variant"
      >
        <ArrowLeft size={16} /> BACK
      </button>

      <PageHeader
        title={device.name}
        subtitle={device.device_id}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} />
            <Button onClick={() => setCommandOpen(true)}>
              <Send size={16} /> Send command
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Firmware & updates" subtitle="Push an update to this device now" />
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={checkNow} disabled={sendMut.isPending}>
              <CloudDownload size={16} />
              {sendMut.isPending ? 'Pushing…' : 'Check for update now'}
            </Button>
            <Button variant="secondary" onClick={() => setUpdateOpen(true)} disabled={sendMut.isPending}>
              <Send size={16} /> Send update
            </Button>
            <p className="text-micro-label text-on-surface-variant">
              The device must be online to receive the push. If it is offline the command is queued and delivered on
              its next connection.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Live telemetry" subtitle={timeAgo(status?.presence?.last_seen as string)} />
          {telemRows.length ? (
            <dl className="flex flex-col gap-2">
              {telemRows.map((r) => (
                <div key={r.label} className="flex justify-between border-b border-outline-variant/40 pb-2 last:border-0">
                  <dt className="text-label-caps text-on-surface-variant">{r.label.toUpperCase()}</dt>
                  <dd className="text-body-base">{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-on-surface-variant">No telemetry yet. The device will report on its next heartbeat.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Events" subtitle="Last 50" />
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {!events?.length ? (
              <p className="text-on-surface-variant">No events recorded.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-md bg-surface-container-low px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-caps">{e.type}</span>
                    <span className="text-micro-label text-on-surface-variant">{formatDate(e.created_at)}</span>
                  </div>
                  <pre className="mt-1 overflow-x-auto text-micro-label text-on-surface-variant">
                    {JSON.stringify(e.payload)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Commands" subtitle="Recently sent" />
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {!commands?.length ? (
              <p className="text-on-surface-variant">No commands yet.</p>
            ) : (
              commands.map((c) => (
                <div key={c.id} className="rounded-md bg-surface-container-low px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-caps">{c.command_type}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <pre className="mt-1 overflow-x-auto text-micro-label text-on-surface-variant">
                    {JSON.stringify(c.payload)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Sheet open={commandOpen} onClose={() => setCommandOpen(false)} title={`Send command to ${device.name}`}>
        <CommandForm
          commands={COMMAND_DEFINITIONS.map((c) => ({ command: c.command, label: c.label }))}
          busy={sendMut.isPending}
          onSubmit={(command, payload) => sendMut.mutate({ command, payload })}
        />
      </Sheet>

      <Sheet
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        title={`Send firmware update to ${device.name}`}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Release"
            value={selectedRelease}
            onChange={(e) => setSelectedRelease(e.target.value)}
          >
            <option value="">Select a release…</option>
            {(releases ?? [])
              .filter((r) => r.status === 'published')
              .filter((r) => !device.hardware_model || r.hardware_model === device.hardware_model)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.version} · {r.hardware_model} · {r.channel}
                </option>
              ))}
          </Select>
          {!releases?.some((r) => r.status === 'published') && (
            <p className="text-micro-label text-on-surface-variant">
              No published releases yet. Upload and publish a build from the Firmware page first.
            </p>
          )}
          <Button onClick={sendUpdate} disabled={sendMut.isPending || !selectedRelease}>
            {sendMut.isPending ? 'Pushing…' : 'Push release to device'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
