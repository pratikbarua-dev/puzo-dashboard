'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderCog, Plus, Rocket, Pause } from 'lucide-react';
import { firmwareReleases, firmwarePublish, firmwareUpload } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Input, Select, Textarea, Sheet, Loading, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatBytes, formatDate, extractError } from '@/lib/utils';
import type { FirmwareRelease } from '@/lib/types';

export default function AdminFirmwarePage() {
  const queryClient = useQueryClient();
  const { data: releases, isLoading } = useQuery({
    queryKey: ['admin', 'firmware'],
    queryFn: firmwareReleases,
  });

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  const [hardwareModel, setHardwareModel] = useState('ESP32-WROOM-32');
  const [channel, setChannel] = useState('stable');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a .bin file');
    if (file.size > 2 * 1024 * 1024) return toast.error('Firmware must be 2 MB or smaller');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('firmware', file);
      form.append('version', version);
      form.append('build_number', buildNumber);
      form.append('hardware_model', hardwareModel);
      form.append('channel', channel);
      form.append('release_notes', notes);
      await firmwareUpload(form);
      toast.success('Firmware uploaded as draft');
      setOpen(false);
      setFile(null);
      setVersion('');
      setBuildNumber('');
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'firmware'] });
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const publishMut = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => firmwarePublish(id, publish),
    onSuccess: (r) => {
      toast.success(r.status === 'published' ? 'Release published' : 'Release unpublished');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'firmware'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const columns: Column<FirmwareRelease>[] = [
    { key: 'version', header: 'Version', render: (r) => <span className="font-extrabold">v{r.version}</span> },
    { key: 'build_number', header: 'Build', render: (r) => r.build_number ?? '—' },
    { key: 'hardware_model', header: 'Hardware', render: (r) => r.hardware_model },
    { key: 'channel', header: 'Channel', render: (r) => <StatusBadge status={r.channel} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'size_bytes', header: 'Size', render: (r) => formatBytes(r.size_bytes) },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            publishMut.mutate({ id: r.id, publish: r.status !== 'published' });
          }}
        >
          {r.status === 'published' ? <Pause size={14} /> : <Rocket size={14} />}
          {r.status === 'published' ? ' Unpublish' : ' Publish'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin · Firmware"
        subtitle="Releases, uploads, and publishing"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Upload
          </Button>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={columns}
            rows={releases ?? []}
            empty={{
              title: 'No releases',
              message: 'Upload a .bin build to get started.',
            }}
          />
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Upload firmware">
        <form onSubmit={upload} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-micro-label text-on-surface-variant">FIRMWARE .BIN (≤2 MB)</span>
            <input
              type="file"
              accept=".bin"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-md bg-surface-container-high px-3 py-3 text-body-base file:mr-3 file:rounded file:border-0 file:bg-primary-container file:px-3 file:py-1 file:text-white"
            />
          </label>
          <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.4" required />
          <Input
            label="Build number"
            type="number"
            value={buildNumber}
            onChange={(e) => setBuildNumber(e.target.value)}
            placeholder="104"
            required
          />
          <Select label="Hardware model" value={hardwareModel} onChange={(e) => setHardwareModel(e.target.value)}>
            <option>ESP32-WROOM-32</option>
            <option>ESP32-S3</option>
            <option>ESP32-C3</option>
          </Select>
          <Select label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
          </Select>
          <Textarea label="Release notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          <Button type="submit" disabled={busy}>
            {busy ? 'Uploading…' : 'Upload firmware'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
