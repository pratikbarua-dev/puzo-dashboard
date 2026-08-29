'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Edit3, Music4, WifiOff } from 'lucide-react';
import { myDevice, updateMyDevice, transferDevice, removeMyDevice, sendDeviceCommand } from '@/lib/api';
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
import { batteryLabel, batteryStatus } from '@/lib/battery';

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
  const [wifiResetOpen, setWifiResetOpen] = useState(false);

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

  const wifiResetMut = useMutation({
    mutationFn: () => sendDeviceCommand(deviceId, 'wifi_reset_warning', {}),
    onSuccess: () => {
      toast.success('Reset warning sent. Hold the B3F button for 5 seconds on PUZO to confirm.');
      setWifiResetOpen(false);
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
      value: batteryStatus(device.battery_percentage, device.battery_voltage) !== 'unavailable' && typeof device.battery_percentage === 'number'
        ? `${Math.round(device.battery_percentage)}%${typeof device.battery_voltage === 'number' ? ` · ${device.battery_voltage.toFixed(2)} V` : ''} (estimated)`
        : batteryLabel(batteryStatus(device.battery_percentage, device.battery_voltage)),
    },
    { label: 'Last seen', value: timeAgo((device.last_seen || device.last_seen_at) as string) },
    { label: 'Created', value: formatDate(device.created_at) },
  ];

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-3 flex min-h-[44px] items-center gap-2 font-mono text-xs font-bold text-[#64748B] hover:text-[#1E232B] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> BACK TO DEVICES
      </button>

      <PageHeader
        title={device?.name || device?.device_id || 'Device'}
        subtitle={device?.device_id}
        action={<StatusBadge status={device.status} />}
      />

      <div className="grid gap-4">
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader title="Hardware Details" subtitle="Connected PUZO device parameters" />
          {(batteryStatus(device.battery_percentage, device.battery_voltage) === 'low' || batteryStatus(device.battery_percentage, device.battery_voltage) === 'critical') && (
            <div className={`mb-4 rounded-2xl px-4 py-3 text-xs font-mono font-bold ${batteryStatus(device.battery_percentage, device.battery_voltage) === 'critical' ? 'bg-[#FFEBEF] text-[#B92B34]' : 'bg-[#FEF3C7] text-[#92400E]'}`} role="status">
              {batteryLabel(batteryStatus(device.battery_percentage, device.battery_voltage))} — recharge PUZO soon.
            </div>
          )}
          <dl className="flex flex-col divide-y divide-[#F1F5F9] rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-1">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between items-center gap-3 py-3">
                <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[#94A3B8]">{r.label}</dt>
                <dd className="text-sm font-extrabold text-[#1E232B]">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setNewName(device?.name || '');
                setRenameOpen(true);
              }}
              className="py-3"
            >
              <Edit3 size={16} /> Rename Device
            </Button>
            <Button variant="outline" onClick={() => setTransferOpen(true)} className="py-3">
              Transfer Ownership
            </Button>
            <Button variant="outline" onClick={() => setWifiResetOpen(true)} className="py-3">
              <WifiOff size={16} /> Wi-Fi Reset
            </Button>
            <Button variant="danger" onClick={() => setRemoveOpen(true)} className="py-3">
              <Trash2 size={16} /> Unlink Device
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <DeviceEmotionalModeCard deviceId={deviceId} />
          <DeviceMoodCard deviceId={deviceId} />
        </div>
        <DeviceSettingsCard deviceId={deviceId} />

        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader
            title="Sound Packs"
            subtitle="Choose which sound pack this PUZO plays"
            action={<Music4 size={18} className="text-[#FF5A5F]" />}
          />
          <Link href={`/audio-packs?device=${encodeURIComponent(deviceId)}`} className="inline-block w-full sm:w-auto">
            <Button variant="tealOutline" className="w-full sm:w-auto">Browse Sound Packs</Button>
          </Link>
        </Card>
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
        <p className="mb-4 text-xs text-[#64748B] leading-relaxed">
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

      <ConfirmDialog
        open={wifiResetOpen}
        onClose={() => setWifiResetOpen(false)}
        title="Request Wi-Fi reset?"
        message="PUZO will show a reset warning. Wi-Fi credentials are erased only after you hold the physical B3F button for 5 seconds."
        confirmLabel="Show reset warning"
        danger
        onConfirm={() => wifiResetMut.mutate()}
        busy={wifiResetMut.isPending}
      />
    </div>
  );
}
