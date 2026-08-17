'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Cpu, Trash2, Edit3, Send } from 'lucide-react';
import { myDevice, updateMyDevice, transferDevice, removeMyDevice, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeviceSettingsCard } from '@/components/DeviceSettingsCard';
import { DeviceEmotionalModeCard, DeviceMoodCard } from '@/components/DeviceModeCard';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Sheet,
  Loading,
  ErrorState,
  ConfirmDialog,
} from '@/components/ui';
import { toast } from '@/components/Toast';
import { timeAgo, formatDate, extractError } from '@/lib/utils';

export default function DeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deviceId = params.deviceId;

  const { data: device, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['devices', deviceId],
    queryFn: () => myDevice(deviceId),
  });

  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);

  const renameMut = useMutation({
    mutationFn: () => updateMyDevice(deviceId, { name: newName.trim() }),
    onSuccess: () => {
      toast.success('Device renamed');
      setRenameOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const transferMut = useMutation({
    mutationFn: () => transferDevice(deviceId, username.trim().replace(/^@/, '')),
    onSuccess: () => {
      toast.success('Device transferred');
      setTransferConfirmOpen(false);
      setTransferOpen(false);
      setUsername('');
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const removeMut = useMutation({
    mutationFn: () => removeMyDevice(deviceId),
    onSuccess: () => {
      toast.success('Device removed');
      router.push('/devices');
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  if (isLoading) return <Loading />;
  if (isError || !device) {
    return (
      <ErrorState message={extractError(error).message} onRetry={() => void refetch()} />
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Device ID', value: device.device_id },
    { label: 'Status', value: device.status },
    {
      label: 'Battery',
      value: typeof device.battery_percentage === 'number'
        ? `${Math.round(device.battery_percentage)}%${typeof device.battery_voltage === 'number' ? ` · ${device.battery_voltage.toFixed(2)} V` : ''} (estimated)`
        : 'No telemetry yet',
    },
    { label: 'Last seen', value: timeAgo((device.last_seen || device.last_seen_at) as string) },
    { label: 'Created', value: formatDate(device.created_at) },
  ];

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-3 flex min-h-[44px] items-center gap-2 text-label-caps text-on-surface-variant"
      >
        <ArrowLeft size={16} /> BACK
      </button>

      <PageHeader
        title={device?.name || device?.device_id || 'Device'}
        subtitle={device?.device_id}
        action={<StatusBadge status={device.status} />}
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader title="Details" />
          <dl className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between gap-3 border-b border-outline-variant/40 pb-2 last:border-0">
                <dt className="text-label-caps text-on-surface-variant">{r.label.toUpperCase()}</dt>
                <dd className="text-body-base">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNewName(device?.name || '');
                setRenameOpen(true);
              }}
            >
              <Edit3 size={16} /> Rename device
            </Button>
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              Transfer ownership
            </Button>
            <Button variant="danger" onClick={() => setRemoveOpen(true)}>
              <Trash2 size={16} /> Remove device
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <DeviceEmotionalModeCard deviceId={deviceId} />
          <DeviceMoodCard deviceId={deviceId} />
        </div>
        <DeviceSettingsCard deviceId={deviceId} />
      </div>

      <Sheet open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename device">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            renameMut.mutate();
          }}
        >
          <Input
            label="Device name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Living Room PUZO"
            required
          />
          <Button type="submit" isLoading={renameMut.isPending}>
            Save name
          </Button>
        </form>
      </Sheet>

      <Sheet open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer device">
        <p className="mb-4 text-on-surface-variant">
          The recipient must already have a PUZO account. The device will be relinked to them.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTransferConfirmOpen(true);
          }}
        >
          <Input
            label="Recipient username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            required
          />
          <Button type="submit">
            Transfer device
          </Button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={transferConfirmOpen}
        onClose={() => setTransferConfirmOpen(false)}
        title="Confirm ownership transfer"
        message={`Are you sure you want to transfer "${device?.name || device?.device_id}" to @${username.replace(/^@/, '')}? You will lose access to this device immediately.`}
        confirmLabel="Transfer now"
        danger
        onConfirm={() => transferMut.mutate()}
        busy={transferMut.isPending}
      />

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove device"
        message={`Remove "${device?.name || device?.device_id}" from your account? Its token will be invalidated immediately.`}
        confirmLabel="Remove"
        onConfirm={() => removeMut.mutate()}
        busy={removeMut.isPending}
      />
    </div>
  );
}
