'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Cpu, Plus } from 'lucide-react';
import { myDevices, createDeviceSetupSession, getDeviceSetupSession } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Input, Sheet, Loading } from '@/components/ui';
import { toast } from '@/components/Toast';
import { timeAgo, extractError } from '@/lib/utils';
import type { Device, DeviceSetupSession } from '@/lib/types';

function AddPuzoSheet() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [setupId, setSetupId] = useState('');
  const [name, setName] = useState('');
  const [session, setSession] = useState<DeviceSetupSession | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      createDeviceSetupSession({
        setup_id: setupId.trim().toUpperCase(),
        name: name.trim(),
        hardware_model: 'ESP32-WROOM-32',
      }),
    onSuccess: (result) => {
      setSession(result);
      toast.success('Setup code created');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const status = useQuery({
    queryKey: ['device-setup', session?.session_id],
    queryFn: () => getDeviceSetupSession(session!.session_id),
    enabled: Boolean(session?.session_id),
    refetchInterval: session?.status === 'pending' ? 2000 : false,
  });

  useEffect(() => {
    if (!status.data) return;
    setSession((current) => (current ? { ...current, ...status.data } : current));
    if (status.data.status === 'claimed') {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  }, [status.data, queryClient]);

  const reset = () => {
    setOpen(false);
    setSession(null);
    setSetupId('');
    setName('');
    setCopied(false);
  };

  const copyCode = async () => {
    if (!session?.code) return;
    try {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy code');
    }
  };

  const apName = setupId ? `PUZO-${setupId.slice(-4)}` : 'PUZO-XXXX';

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Add PUZO
      </Button>
      <Sheet open={open} onClose={reset} title={session ? 'Connect your PUZO' : 'Add a PUZO'}>
        {!session ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-on-surface-variant">
              Turn on your PUZO. Its screen displays a short 4-character setup code (e.g. <strong className="font-mono text-primary">921C</strong>).
            </p>
            <Input
              label="PUZO setup code"
              value={setupId}
              onChange={(event) => setSetupId(event.target.value)}
              placeholder="921C"
              maxLength={15}
              className="font-mono uppercase text-lg tracking-wider"
              autoCapitalize="characters"
              required
            />
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Desk companion"
              required
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating code…' : 'Create setup code'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {session.status === 'pending' && session.code && (
              <>
                <p className="text-sm text-on-surface-variant">
                  Use this code on the PUZO setup page. It expires in about 10 minutes and can be used once.
                </p>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-high p-4">
                  <code className="text-3xl font-black tracking-[0.25em] text-primary-container">
                    {session.code}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyCode} aria-label="Copy setup code">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </Button>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-on-surface-variant">
                  <li>Connect your phone to Wi-Fi named <strong>{apName}</strong>.</li>
                  <li>Open <strong>http://192.168.4.1</strong> in your browser.</li>
                  <li>Enter your home Wi-Fi and this setup code.</li>
                </ol>
                <p className="text-sm text-secondary">Waiting for PUZO to finish setup…</p>
              </>
            )}
            {session.status === 'claimed' && (
              <div className="rounded-lg bg-secondary/10 p-4 text-secondary">
                <p className="font-extrabold">PUZO connected successfully.</p>
                <p className="mt-1 text-sm">It should appear in your device list shortly.</p>
              </div>
            )}
            {(session.status === 'expired' || session.status === 'cancelled') && (
              <div className="rounded-lg bg-error-container/20 p-4 text-on-error-container">
                This setup code is no longer active. Close this window and create a new code.
              </div>
            )}
            <Button variant="outline" onClick={reset}>
              {session.status === 'claimed' ? 'Done' : 'Cancel setup'}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

export default function DevicesPage() {
  const router = useRouter();
  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: myDevices });

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Device',
      render: (device) => (
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-primary-container" />
          <div>
            <p className="font-extrabold">{device?.name || device?.device_id || 'Device'}</p>
            <p className="text-micro-label text-on-surface-variant">{device?.device_id}</p>
          </div>
        </div>
      ),
    },
    { key: 'hardware_model', header: 'Model', render: (device) => device.hardware_model || '—' },
    { key: 'status', header: 'Status', render: (device) => <StatusBadge status={device.status} /> },
    {
      key: 'last_seen',
      header: 'Last seen',
      render: (device) => timeAgo((device.last_seen || device.last_seen_at) as string),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage the PUZOs linked to your account"
        action={<AddPuzoSheet />}
      />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={devices ?? []}
            loading={false}
            onRowClick={(device) => router.push(`/devices/${device.device_id}`)}
            empty={{
              title: 'No devices yet',
              message: 'Add your first PUZO. You will only need its setup ID from the device screen.',
            }}
          />
        </Card>
      )}
    </div>
  );
}
