'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Plus } from 'lucide-react';
import { myDevices, provisionDevice, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Input, Select, Sheet, Loading, EmptyState } from '@/components/ui';
import { TokenModal } from '@/components/TokenModal';
import { toast } from '@/components/Toast';
import { timeAgo, extractError } from '@/lib/utils';
import type { Device } from '@/lib/types';

type ProvisionResult = { device: Device; token: string; note: string };

function ProvisionSheet({ onDone }: { onDone: (result: ProvisionResult) => void }) {
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [hardwareModel, setHardwareModel] = useState('ESP32-WROOM-32');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await provisionDevice({
        device_id: deviceId.trim().toUpperCase(),
        name: name.trim(),
        hardware_model: hardwareModel,
      });
      onDone(result);
      setOpen(false);
      setDeviceId('');
      setName('');
      toast.success('Device registered');
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Register device
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Register a device">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="PUZO-XXXXXXXX"
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Desk companion"
            required
          />
          <Select
            label="Hardware model"
            value={hardwareModel}
            onChange={(e) => setHardwareModel(e.target.value)}
          >
            <option>ESP32-WROOM-32</option>
            <option>ESP32-S3</option>
            <option>ESP32-C3</option>
          </Select>
          <Button type="submit" disabled={busy}>
            {busy ? 'Registering…' : 'Register device'}
          </Button>
        </form>
      </Sheet>
    </>
  );
}

export default function DevicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const [tokenResult, setTokenResult] = useState<ProvisionResult | null>(null);

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Device',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-primary-container" />
          <div>
            <p className="font-extrabold">{d.name}</p>
            <p className="text-micro-label text-on-surface-variant">{d.device_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'hardware_model', header: 'Model', render: (d) => d.hardware_model || '—' },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'last_seen', header: 'Last seen', render: (d) => timeAgo(d.last_seen as string) },
  ];

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage the PUZOs linked to your account"
        action={<ProvisionSheet onDone={setTokenResult} />}
      />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={devices ?? []}
            loading={false}
            onRowClick={(d) => router.push(`/devices/${d.device_id}`)}
            empty={{
              title: 'No devices yet',
              message: 'Register your first PUZO to start using it.',
            }}
          />
        </Card>
      )}

      {tokenResult && (
        <TokenModal
          open={!!tokenResult}
          onClose={() => {
            setTokenResult(null);
            void queryClient.invalidateQueries({ queryKey: ['devices'] });
          }}
          deviceName={tokenResult.device.name}
          deviceId={tokenResult.device.device_id}
          token={tokenResult.token}
        />
      )}
    </div>
  );
}
