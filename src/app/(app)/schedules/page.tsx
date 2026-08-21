'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { mySchedules, createSchedule, cancelSchedule, myDevices, myRelationships } from '@/lib/api';
import { buildPayload, commandDef, commandForInteractionType, defaultPayload, INTERACTION_TYPES } from '@/lib/registry';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { CommandFields } from '@/components/CommandForm';
import { Card, CardHeader, Button, Input, Select, Sheet, CardSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const { entitlements } = useAuth();
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: mySchedules,
  });
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const { data: relationships } = useQuery({ queryKey: ['relationships'], queryFn: myRelationships });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState('message');
  const [target, setTarget] = useState('');
  const [source, setSource] = useState('');
  const [when, setWhen] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>(() =>
    defaultPayload(commandForInteractionType('message')),
  );

  const def = commandDef(commandForInteractionType(type));

  const partnerDevice = (relationships ?? [])
    .filter((relationship) => relationship.status === 'active')
    .flatMap((relationship) => relationship.devices ?? [])
    .find((device) => !devices?.some((mine) => mine.device_id === device.device_id));

  const createMut = useMutation({
    mutationFn: () =>
      createSchedule({
        type,
        // Every type has its own strict payload schema — a vibration scheduled
        // with a message body is rejected outright.
        payload: buildPayload(commandForInteractionType(type), payload),
        target_device_id: target || partnerDevice?.device_id || '',
        source_device_id: source || undefined,
        scheduled_for: new Date(when).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Scheduled');
      setOpen(false);
      setWhen('');
      setPayload(defaultPayload(commandForInteractionType(type)));
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelSchedule(id),
    onSuccess: () => {
      toast.success('Schedule cancelled');
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const locked = !entitlements?.scheduled_emotions;

  return (
    <div>
      <PageHeader
        title="Schedules"
        subtitle={locked ? 'Requires the Plus plan' : 'Interactions on a timer'}
        action={
          locked ? undefined : (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Schedule
            </Button>
          )
        }
      />

      {locked ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title="Scheduled interactions are a Plus feature"
          message="Upgrade to send emotions and messages on a timer."
          action={
            <a href="/subscription">
              <Button>Upgrade to Plus</Button>
            </a>
          }
        />
      ) : isLoading ? (
        <CardSkeleton count={2} />
      ) : !schedules?.length ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title="Nothing scheduled"
          message="Create a future interaction and it will fire automatically."
        />
      ) : (
        <Card>
          <CardHeader title="Upcoming & past" />
          <div className="flex flex-col gap-2">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-container-low px-3 py-2 border border-border/20"
              >
                <div>
                  <p className="text-label-caps font-bold">
                    {s.type}
                    {s.payload?.text ? ` · ${String(s.payload.text).slice(0, 40)}` : ''}
                  </p>
                  <p className="text-micro-label text-on-surface-variant">
                    {s.status} · fires {formatDate(s.scheduled_for)}
                  </p>
                </div>
                {s.status === 'pending' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancelMut.isPending}
                    onClick={() => cancelMut.mutate(s.id)}
                  >
                    <Trash2 size={14} /> Cancel
                  </Button>
                ) : (
                  <span className="text-label-caps text-on-surface-variant">{s.status}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Schedule an interaction">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <Select
            label="Type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPayload(defaultPayload(commandForInteractionType(e.target.value)));
            }}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <CommandFields
            fields={def?.fields ?? []}
            payload={payload}
            onChange={(name, value) => setPayload((p) => ({ ...p, [name]: value }))}
          />

          <Select
            label="Target companion device"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          >
            {partnerDevice && (
              <option value={partnerDevice.device_id}>
                Partner&apos;s PUZO ({partnerDevice.name || partnerDevice.device_id})
              </option>
            )}
            {(devices ?? []).map((d) => (
              <option key={d.device_id} value={d.device_id}>
                My PUZO ({d.name || d.device_id})
              </option>
            ))}
          </Select>

          <Select label="Source device (yours, optional)" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">None</option>
            {(devices ?? []).map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.name || d.device_id} ({d.device_id})
              </option>
            ))}
          </Select>

          <Input
            label="When"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
          />

          <Button type="submit" isLoading={createMut.isPending}>
            Schedule moment
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
