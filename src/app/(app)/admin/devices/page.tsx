'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Plus, KeyRound, CloudDownload, Trash2 } from 'lucide-react';
import {
  adminDevices,
  adminRegisterDevice,
  adminProvision,
  adminRemoveDevice,
  adminSendCommand,
} from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column, type TableFilter } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Input, Select, Sheet, Loading } from '@/components/ui';
import { TokenModal } from '@/components/TokenModal';
import { toast } from '@/components/Toast';
import { timeAgo, extractError } from '@/lib/utils';
import type { Device } from '@/lib/types';

type RegisterResult = { device: Device; token: string; note: string };

const FILTERS: TableFilter[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'online', label: 'Online' },
      { value: 'offline', label: 'Offline' },
      { value: 'updating', label: 'Updating' },
      { value: 'unknown', label: 'Unknown' },
    ],
  },
  {
    key: 'firmware_channel',
    label: 'Channel',
    options: [
      { value: 'stable', label: 'Stable' },
      { value: 'beta', label: 'Beta' },
      { value: 'development', label: 'Dev' },
    ],
  },
];

export default function AdminDevicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery({
    queryKey: ['admin', 'devices'],
    queryFn: adminDevices,
  });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [hardwareModel, setHardwareModel] = useState('ESP32-WROOM-32');
  const [channel, setChannel] = useState('stable');
  const [tokenResult, setTokenResult] = useState<RegisterResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await adminRegisterDevice({
        name: name.trim(),
        hardware_model: hardwareModel,
        firmware_channel: channel,
      });
      setTokenResult(result);
      setRegisterOpen(false);
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
      toast.success('Device registered');
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const provisionMut = useMutation({
    mutationFn: (deviceId: string) => adminProvision(deviceId),
    onSuccess: (data) => setTokenResult(data),
    onError: (e) => toast.error(extractError(e).message),
  });

  const removeMut = useMutation({
    mutationFn: (deviceId: string) => adminRemoveDevice(deviceId),
    onSuccess: () => {
      toast.success('Device removed');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'devices'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const bulkCheckMut = useMutation({
    mutationFn: async (deviceIds: string[]) => {
      let count = 0;
      for (const id of deviceIds) {
        await adminSendCommand(id, 'ota_check', {});
        count++;
      }
      return count;
    },
    onSuccess: (count) => {
      toast.success(`OTA check pushed to ${count} device(s)`);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Device',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-primary-container" />
          <div>
            <p className="font-extrabold">{d.name}</p>
            <p className="text-micro-label text-on-surface-variant font-mono">{d.device_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'hardware_model', header: 'Model', render: (d) => d.hardware_model || '—' },
    {
      key: 'firmware_version',
      header: 'Firmware',
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs">v{d.firmware_version || '0.1.0'}</span>
          <span className="text-micro-label text-on-surface-variant uppercase">{d.firmware_channel || 'stable'}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'last_seen', header: 'Last seen', render: (d) => timeAgo((d.last_seen || d.last_seen_at) as string) },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => provisionMut.mutate(d.device_id)}>
            <KeyRound size={14} /> Token
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeMut.mutate(d.device_id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin · Devices"
        subtitle="Fleet-wide device management & monitoring"
        action={
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus size={16} /> Register
          </Button>
        }
      />

      {isLoading ? (
        <Loading label="Loading fleet devices…" />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={devices ?? []}
            filters={FILTERS}
            selectable
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            actions={
              selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkCheckMut.mutate(selectedIds)}
                  disabled={bulkCheckMut.isPending}
                >
                  <CloudDownload size={14} />
                  {bulkCheckMut.isPending ? 'Pushing…' : `Push OTA Check (${selectedIds.length})`}
                </Button>
              )
            }
            onRowClick={(d) => router.push(`/admin/devices/${d.device_id}`)}
            empty={{ title: 'No devices', message: 'The fleet is empty.' }}
          />
        </Card>
      )}

      <Sheet open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register a device">
        <form onSubmit={register} className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Hardware model" value={hardwareModel} onChange={(e) => setHardwareModel(e.target.value)}>
            <option>ESP32-WROOM-32</option>
            <option>ESP32-S3</option>
            <option>ESP32-C3</option>
          </Select>
          <Select label="Firmware channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="development">Development</option>
          </Select>
          <Button type="submit" disabled={busy}>
            {busy ? 'Registering…' : 'Register device'}
          </Button>
        </form>
      </Sheet>

      {tokenResult && (
        <TokenModal
          open={!!tokenResult}
          onClose={() => setTokenResult(null)}
          deviceName={tokenResult.device.name}
          deviceId={tokenResult.device.device_id}
          token={tokenResult.token}
        />
      )}
    </div>
  );
}
