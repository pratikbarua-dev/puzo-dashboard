'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, FolderArchive, Pause, Rocket, Edit3 } from 'lucide-react';
import {
  adminListEmotions,
  adminUpsertEmotion,
  adminListAssets,
  adminCreateAsset,
  adminSetAssetStatus,
} from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column, type TableFilter } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, Button, Input, Select, Textarea, Sheet, Loading } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';
import type { ContentEmotion, ContentAsset } from '@/lib/types';

const ASSET_KINDS = [
  'animation',
  'expression',
  'sound',
  'theme',
  'animation_pack',
  'sound_pack',
];

const EMOTION_FILTERS: TableFilter[] = [
  {
    key: 'priority',
    label: 'Priority',
    options: [
      { value: 'idle_personality', label: 'Idle Personality' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'local_user', label: 'Local User' },
      { value: 'partner', label: 'Partner' },
      { value: 'system', label: 'System' },
      { value: 'critical_safety', label: 'Critical Safety' },
    ],
  },
];

const ASSET_FILTERS: TableFilter[] = [
  {
    key: 'kind',
    label: 'Kind',
    options: ASSET_KINDS.map((k) => ({ value: k, label: k })),
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
      { value: 'unpublished', label: 'Unpublished' },
    ],
  },
];

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'emotions' | 'assets'>('emotions');

  // Emotions Query
  const { data: emotions, isLoading: emLoading } = useQuery({
    queryKey: ['admin', 'emotions'],
    queryFn: adminListEmotions,
  });

  // Assets Query
  const { data: assets, isLoading: assetLoading } = useQuery({
    queryKey: ['admin', 'content', 'assets'],
    queryFn: adminListAssets,
  });

  // Emotion Sheet State
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [editingEmotion, setEditingEmotion] = useState<ContentEmotion | null>(null);
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('happy');
  const [sound, setSound] = useState('');
  const [haptic, setHaptic] = useState('');
  const [durationMs, setDurationMs] = useState(1800);
  const [priority, setPriority] = useState<ContentEmotion['priority']>('local_user');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  // Asset Sheet State
  const [assetOpen, setAssetOpen] = useState(false);
  const [assetKind, setAssetKind] = useState<ContentAsset['kind']>('animation');
  const [assetName, setAssetName] = useState('');
  const [assetVersion, setAssetVersion] = useState('1.0.0');
  const [assetPath, setAssetPath] = useState('');

  const openEmotionForm = (e?: ContentEmotion) => {
    if (e) {
      setEditingEmotion(e);
      setName(e.name || '');
      setExpression(e.expression);
      setSound(e.sound || '');
      setHaptic(e.haptic || '');
      setDurationMs(e.duration_ms || 1800);
      setPriority(e.priority || 'local_user');
      setDescription(e.description || '');
    } else {
      setEditingEmotion(null);
      setName('');
      setExpression('happy');
      setSound('');
      setHaptic('');
      setDurationMs(1800);
      setPriority('local_user');
      setDescription('');
    }
    setEmotionOpen(true);
  };

  const saveEmotion = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setBusy(true);
    try {
      await adminUpsertEmotion({
        name: name.trim(),
        expression: expression.trim(),
        sound: sound.trim() || undefined,
        haptic: haptic.trim() || undefined,
        duration_ms: Number(durationMs),
        priority,
        description: description.trim() || undefined,
        is_active: true,
      });
      toast.success(editingEmotion ? 'Emotion updated' : 'Emotion created');
      setEmotionOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'emotions'] });
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const saveAsset = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setBusy(true);
    try {
      await adminCreateAsset({
        kind: assetKind,
        name: assetName.trim(),
        version: assetVersion.trim(),
        storage_path: assetPath.trim(),
        status: 'published',
      });
      toast.success('Content asset registered');
      setAssetOpen(false);
      setAssetName('');
      setAssetPath('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'assets'] });
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const assetStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminSetAssetStatus(id, status),
    onSuccess: () => {
      toast.success('Asset status updated');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'assets'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const emotionColumns: Column<ContentEmotion>[] = [
    {
      key: 'name',
      header: 'Emotion',
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded bg-primary-container/20 text-primary">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="font-extrabold">{e?.name || 'Emotion'}</p>
            {e?.description && <p className="text-micro-label text-on-surface-variant">{e.description}</p>}
          </div>
        </div>
      ),
    },
    { key: 'expression', header: 'Expression', render: (e) => <span className="font-mono text-xs">{e.expression}</span> },
    {
      key: 'priority',
      header: 'Priority',
      render: (e) => <StatusBadge status={e.priority || 'local_user'} />,
    },
    { key: 'sound', header: 'Sound', render: (e) => e.sound || '—' },
    { key: 'haptic', header: 'Haptic', render: (e) => e.haptic || '—' },
    { key: 'duration_ms', header: 'Duration', render: (e) => `${e.duration_ms || 1800}ms` },
    {
      key: 'actions',
      header: 'Actions',
      render: (e) => (
        <Button variant="ghost" size="sm" onClick={() => openEmotionForm(e)}>
          <Edit3 size={14} /> Edit
        </Button>
      ),
    },
  ];

  const assetColumns: Column<ContentAsset>[] = [
    {
      key: 'name',
      header: 'Asset Name',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded bg-surface-container-high text-on-surface-variant">
            <FolderArchive size={16} />
          </div>
          <div>
            <p className="font-extrabold">{a?.name || 'Asset'}</p>
            <p className="text-micro-label font-mono text-on-surface-variant">{a?.storage_path || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'kind', header: 'Kind', render: (a) => <span className="font-mono text-xs capitalize">{a.kind}</span> },
    { key: 'version', header: 'Version', render: (a) => `v${a.version}` },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'created_at', header: 'Created', render: (a) => formatDate(a.created_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            assetStatusMut.mutate({
              id: a.id,
              status: a.status === 'published' ? 'unpublished' : 'published',
            })
          }
        >
          {a.status === 'published' ? <Pause size={14} /> : <Rocket size={14} />}
          {a.status === 'published' ? ' Unpublish' : ' Publish'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin · Content Management"
        subtitle="Emotions catalog & animation/sound asset packs"
        action={
          <Button onClick={() => (activeTab === 'emotions' ? openEmotionForm() : setAssetOpen(true))}>
            <Plus size={16} /> {activeTab === 'emotions' ? 'Add Emotion' : 'Register Asset'}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('emotions')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 text-body-base font-extrabold transition-fast ${
            activeTab === 'emotions'
              ? 'border-primary-container text-white'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles size={16} /> Emotions Catalog ({emotions?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-4 text-body-base font-extrabold transition-fast ${
            activeTab === 'assets'
              ? 'border-primary-container text-white'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <FolderArchive size={16} /> Downloadable Assets ({assets?.length ?? 0})
        </button>
      </div>

      {activeTab === 'emotions' ? (
        emLoading ? (
          <Loading label="Loading emotions catalog…" />
        ) : (
          <Card className="p-0">
            <DataTable
              columns={emotionColumns}
              rows={emotions ?? []}
              filters={EMOTION_FILTERS}
              empty={{ title: 'No emotions', message: 'No emotions registered in catalog.' }}
            />
          </Card>
        )
      ) : assetLoading ? (
        <Loading label="Loading content assets…" />
      ) : (
        <Card className="p-0">
          <DataTable
            columns={assetColumns}
            rows={assets ?? []}
            filters={ASSET_FILTERS}
            empty={{ title: 'No content assets', message: 'Upload asset packages to populate.' }}
          />
        </Card>
      )}

      {/* Emotion Upsert Sheet */}
      <Sheet
        open={emotionOpen}
        onClose={() => setEmotionOpen(false)}
        title={editingEmotion ? `Edit Emotion: ${editingEmotion?.name || ''}` : 'Add Emotion to Catalog'}
      >
        <form onSubmit={saveEmotion} className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="happy" />
          <Input label="OLED Expression" value={expression} onChange={(e) => setExpression(e.target.value)} required placeholder="happy" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sound" value={sound} onChange={(e) => setSound(e.target.value)} placeholder="happy" />
            <Input label="Haptic Pattern" value={haptic} onChange={(e) => setHaptic(e.target.value)} placeholder="double" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (ms)"
              type="number"
              value={durationMs}
              onChange={(e) => setDurationMs(Number(e.target.value))}
            />
            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as ContentEmotion['priority'])}>
              <option value="idle_personality">idle_personality</option>
              <option value="scheduled">scheduled</option>
              <option value="local_user">local_user</option>
              <option value="partner">partner</option>
              <option value="system">system</option>
              <option value="critical_safety">critical_safety</option>
            </Select>
          </div>
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : editingEmotion ? 'Update emotion' : 'Create emotion'}
          </Button>
        </form>
      </Sheet>

      {/* Asset Register Sheet */}
      <Sheet open={assetOpen} onClose={() => setAssetOpen(false)} title="Register Content Asset">
        <form onSubmit={saveAsset} className="flex flex-col gap-4">
          <Select label="Kind" value={assetKind} onChange={(e) => setAssetKind(e.target.value as ContentAsset['kind'])}>
            {ASSET_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
          <Input label="Name" value={assetName} onChange={(e) => setAssetName(e.target.value)} required placeholder="Happy Dance Pack" />
          <Input label="Version" value={assetVersion} onChange={(e) => setAssetVersion(e.target.value)} required placeholder="1.0.0" />
          <Input label="Storage path" value={assetPath} onChange={(e) => setAssetPath(e.target.value)} required placeholder="content/animation/happy_dance/1.0.0/data.json" />
          <Button type="submit" disabled={busy}>
            {busy ? 'Registering…' : 'Register asset'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
