'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Download,
  Lock,
  Music4,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  activateAudioPack,
  audioPack,
  audioPacks,
  deviceAudioPacks,
  installAudioPack,
  myDevices,
  removeAudioPack,
} from '@/lib/api';
import type { AudioPackState, DeviceAudioPack } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import {
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Loading,
  Select,
  Sheet,
} from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError, formatBytes, titleCase } from '@/lib/utils';

/**
 * Sound packs, from the owner's side. Deliberately says nothing about checksums,
 * storage paths or the device filesystem — this page is "which sounds does my PUZO
 * play", not a flash volume manager.
 */

const STATE_LABELS: Record<AudioPackState, string> = {
  not_installed: 'Not on device',
  pending: 'Queued',
  downloading: 'Sending',
  installed: 'On device',
  failed: 'Failed',
};

const STATE_CLASSES: Record<AudioPackState, string> = {
  not_installed: 'bg-surface-container-highest text-on-surface-variant',
  pending: 'bg-tertiary/20 text-on-surface-variant',
  downloading: 'bg-tertiary/20 text-on-surface-variant',
  installed: 'bg-secondary/15 text-secondary',
  failed: 'bg-error/15 text-error',
};

function StateChip({ state }: { state: AudioPackState }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATE_CLASSES[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

function AudioPacksView() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [deviceId, setDeviceId] = useState(searchParams.get('device') ?? '');
  const [detailSlug, setDetailSlug] = useState<string | null>(null);

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: myDevices,
  });

  useEffect(() => {
    if (!deviceId && devices?.length) setDeviceId(devices[0].device_id);
  }, [devices, deviceId]);

  const devicePacksQuery = useQuery({
    queryKey: ['devices', deviceId, 'audio-packs'],
    queryFn: () => deviceAudioPacks(deviceId),
    enabled: !!deviceId,
    // A pack travels to the device over Wi-Fi, so rows have to keep refreshing
    // while one is in flight. Once nothing is moving, stop polling.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((p) => p.state === 'pending' || p.state === 'downloading')
        ? 4000
        : false,
  });

  // With no device yet there is still a catalogue worth browsing; install state
  // simply does not exist for it.
  const catalogueQuery = useQuery({
    queryKey: ['audio-packs'],
    queryFn: audioPacks,
    enabled: !devicesLoading && !deviceId,
  });

  const packs: DeviceAudioPack[] = useMemo(() => {
    if (deviceId) return devicePacksQuery.data ?? [];
    return (catalogueQuery.data ?? []).map((p) => ({
      ...p,
      state: 'not_installed' as AudioPackState,
      installed_version: null,
      installed_bytes: 0,
      update_available: false,
      active: false,
      last_error: null,
    }));
  }, [deviceId, devicePacksQuery.data, catalogueQuery.data]);

  const activePack = packs.find((p) => p.active) ?? null;

  const invalidatePacks = () => {
    void queryClient.invalidateQueries({ queryKey: ['devices', deviceId, 'audio-packs'] });
  };

  const installMut = useMutation({
    mutationFn: (slug: string) => installAudioPack(deviceId, slug),
    onSuccess: () => {
      toast.success('Sending the pack to your PUZO…');
      invalidatePacks();
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const activateMut = useMutation({
    mutationFn: (slug: string | null) => activateAudioPack(deviceId, slug),
    onSuccess: (_data, slug) => {
      toast.success(slug ? 'PUZO is using these sounds now' : 'Back to PUZO’s own sounds');
      invalidatePacks();
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const removeMut = useMutation({
    mutationFn: (slug: string) => removeAudioPack(deviceId, slug),
    onSuccess: () => {
      toast.success('Pack removed from the device');
      invalidatePacks();
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  /* ---- sound preview ---- */

  const detailQuery = useQuery({
    queryKey: ['audio-packs', detailSlug],
    queryFn: () => audioPack(detailSlug as string),
    enabled: !!detailSlug,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingSound(null);
  };

  // A preview left playing after the sheet closes would keep singing over the
  // rest of the app.
  useEffect(() => stopPreview, []);

  const togglePreview = (soundId: string, url: string) => {
    if (playingSound === soundId) {
      stopPreview();
      return;
    }
    audioRef.current?.pause();
    const el = new Audio(url);
    el.onended = () => setPlayingSound(null);
    el.onerror = () => {
      setPlayingSound(null);
      toast.error('Could not play that preview');
    };
    audioRef.current = el;
    setPlayingSound(soundId);
    void el.play().catch(() => {
      setPlayingSound(null);
      toast.error('Could not play that preview');
    });
  };

  const closeDetail = () => {
    stopPreview();
    setDetailSlug(null);
  };

  const listLoading = deviceId ? devicePacksQuery.isLoading : devicesLoading || catalogueQuery.isLoading;
  const listError = deviceId ? devicePacksQuery.error : catalogueQuery.error;

  return (
    <div>
      <PageHeader
        title="Sounds"
        subtitle="Sound packs your companion can play"
      />

      {devices && devices.length > 1 && (
        <Card className="mb-4">
          <Select
            label="Companion device"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.name || d.device_id}
              </option>
            ))}
          </Select>
        </Card>
      )}

      {!devicesLoading && !devices?.length && (
        <Card className="mb-4">
          <p className="text-body-base text-on-surface-variant">
            Browse what is available below. Add a PUZO first to install a pack on it.
          </p>
          <Link href="/devices" className="mt-3 inline-block">
            <Button variant="outline" size="sm">
              Go to devices
            </Button>
          </Link>
        </Card>
      )}

      {deviceId && (
        <Card className="mb-4">
          <CardHeader
            title="Now playing"
            subtitle={
              activePack
                ? `${activePack.name} replaces PUZO’s built-in sounds`
                : 'PUZO is using its own built-in sounds'
            }
            action={<Music4 size={18} className="text-on-surface-variant" />}
          />
          {activePack && (
            <Button
              variant="outline"
              size="sm"
              isLoading={activateMut.isPending && activateMut.variables === null}
              onClick={() => activateMut.mutate(null)}
            >
              Go back to built-in sounds
            </Button>
          )}
        </Card>
      )}

      {listLoading ? (
        <CardSkeleton count={3} />
      ) : listError ? (
        <ErrorState
          message={extractError(listError).message}
          onRetry={() =>
            void (deviceId ? devicePacksQuery.refetch() : catalogueQuery.refetch())
          }
        />
      ) : !packs.length ? (
        <EmptyState
          icon={<Music4 size={28} />}
          title="No sound packs yet"
          message="New packs show up here as they are released. PUZO already has its own set of sounds in the meantime."
        />
      ) : (
        <Card>
          <CardHeader title="Available packs" subtitle={`${packs.length} pack${packs.length === 1 ? '' : 's'}`} />
          <div className="flex flex-col gap-3">
            {packs.map((p) => {
              const busy =
                (installMut.isPending && installMut.variables === p.slug) ||
                (activateMut.isPending && activateMut.variables === p.slug) ||
                (removeMut.isPending && removeMut.variables === p.slug);
              const inFlight = p.state === 'pending' || p.state === 'downloading';
              const pct =
                p.total_bytes > 0
                  ? Math.min(100, Math.round((p.installed_bytes / p.total_bytes) * 100))
                  : 0;

              return (
                <div
                  key={p.slug}
                  className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-3"
                >
                  <div className="flex items-start gap-3">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- pack art is a remote URL from the catalogue, not a bundled asset
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container/50 text-primary">
                        <Music4 size={20} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-extrabold text-on-surface">
                          {p.name}
                        </span>
                        {p.active && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Playing
                          </span>
                        )}
                        {p.is_premium && p.locked && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-tertiary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            <Lock size={9} /> Premium
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="mt-0.5 line-clamp-2 text-micro-label text-on-surface-variant">
                          {p.description}
                        </p>
                      )}
                      <p className="mt-1 text-micro-label text-on-surface-variant">
                        {formatBytes(p.total_bytes)} · v{p.installed_version ?? p.version}
                        {p.update_available && ' · new version available'}
                      </p>
                    </div>

                    {deviceId && <StateChip state={p.state} />}
                  </div>

                  {inFlight && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-micro-label text-on-surface-variant">
                        {p.state === 'pending'
                          ? 'Waiting for PUZO to come online…'
                          : `Sending — ${pct}%`}
                      </p>
                    </div>
                  )}

                  {p.state === 'failed' && p.last_error && (
                    <p className="mt-3 flex items-start gap-1.5 text-micro-label text-error">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {p.last_error}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDetailSlug(p.slug)}>
                      <Play size={13} /> Preview
                    </Button>

                    {p.locked ? (
                      <Link href="/subscription">
                        <Button variant="outline" size="sm">
                          <Lock size={13} /> Unlock with a plan
                        </Button>
                      </Link>
                    ) : !deviceId ? null : p.state === 'installed' ? (
                      <>
                        {p.update_available && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            isLoading={installMut.isPending && installMut.variables === p.slug}
                            onClick={() => installMut.mutate(p.slug)}
                          >
                            <RefreshCw size={13} /> Update
                          </Button>
                        )}
                        {p.active ? (
                          <Button variant="ghost" size="sm" disabled>
                            <Check size={13} /> In use
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busy}
                            isLoading={activateMut.isPending && activateMut.variables === p.slug}
                            onClick={() => activateMut.mutate(p.slug)}
                          >
                            Use these sounds
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          isLoading={removeMut.isPending && removeMut.variables === p.slug}
                          onClick={() => removeMut.mutate(p.slug)}
                        >
                          <Trash2 size={13} /> Remove
                        </Button>
                      </>
                    ) : inFlight ? (
                      <Button variant="outline" size="sm" disabled>
                        Sending to PUZO…
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        isLoading={installMut.isPending && installMut.variables === p.slug}
                        onClick={() => installMut.mutate(p.slug)}
                      >
                        <Download size={13} />
                        {p.state === 'failed' ? 'Try again' : 'Add to PUZO'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Sheet
        open={!!detailSlug}
        onClose={closeDetail}
        title={detailQuery.data?.name ?? 'Pack sounds'}
      >
        {detailQuery.isLoading ? (
          <Loading label="Loading sounds…" />
        ) : detailQuery.isError ? (
          <ErrorState
            message={extractError(detailQuery.error).message}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : !detailQuery.data?.sounds.length ? (
          <p className="text-body-base text-on-surface-variant">
            This pack has no sounds to preview yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {detailQuery.data.locked && (
              <p className="mb-1 flex items-start gap-1.5 rounded-xl bg-tertiary/15 px-3 py-2 text-micro-label text-on-surface-variant">
                <Lock size={12} className="mt-0.5 shrink-0" />
                Previews come with the plan that includes this pack.
              </p>
            )}
            {detailQuery.data.sounds.map((s) => {
              const isPlaying = playingSound === s.sound_id;
              return (
                <div
                  key={s.sound_id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-base font-semibold text-on-surface">
                      {titleCase(s.sound_id)}
                    </p>
                    <p className="text-micro-label text-on-surface-variant">
                      {formatBytes(s.bytes)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!s.preview_url}
                    aria-label={isPlaying ? `Stop ${s.sound_id}` : `Play ${s.sound_id}`}
                    onClick={() => s.preview_url && togglePreview(s.sound_id, s.preview_url)}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Sheet>
    </div>
  );
}

export default function AudioPacksPage() {
  return (
    <Suspense fallback={<CardSkeleton count={3} />}>
      <AudioPacksView />
    </Suspense>
  );
}
