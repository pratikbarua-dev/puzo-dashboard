'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlarmClock, Bell, Pencil, Plus, Trash2 } from 'lucide-react';
import { myAlarms, createAlarm, updateAlarm, deleteAlarm, myDevices } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Select, Sheet, Card, CardHeader, CardSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { cn, extractError } from '@/lib/utils';

/** Weekday order is the device's convention: index 0 = Sunday (tm_wday). */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Built-in melodies compiled into the firmware (command registry on the backend). */
const BUILTIN_SOUNDS = [
  'wake', 'notification', 'happy', 'love', 'success', 'startup',
  'touch', 'charging', 'partner_reaction', 'sad', 'sleepy', 'error',
];

const pad = (n: number) => String(n).padStart(2, '0');

interface FormState {
  id: string | null;
  device_id: string;
  time: string; // "HH:MM"
  days: number[];
  sound: string;
  label: string;
  snooze_min: number;
}

const emptyForm: FormState = {
  id: null,
  device_id: '',
  time: '07:30',
  days: [],
  sound: 'wake',
  label: '',
  snooze_min: 9,
};

export default function AlarmsPage() {
  const queryClient = useQueryClient();
  const { entitlements } = useAuth();
  const { data: alarms, isLoading } = useQuery({ queryKey: ['alarms'], queryFn: myAlarms });
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);

  const locked = !entitlements?.alarm_clock;

  const deviceById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of devices ?? []) map.set(d.device_id, d.name || d.device_id);
    return map;
  }, [devices]);

  const alarmsByDevice = useMemo(() => {
    const groups = new Map<string, typeof alarms>();
    for (const a of alarms ?? []) {
      const list = groups.get(a.device_id) ?? [];
      list.push(a);
      groups.set(a.device_id, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [alarms]);

  const openCreate = () => {
    setForm({ ...emptyForm, device_id: devices?.[0]?.device_id ?? '' });
    setOpen(true);
  };

  const openEdit = (alarm: NonNullable<typeof alarms>[number]) => {
    setForm({
      id: alarm.id,
      device_id: alarm.device_id,
      time: `${pad(alarm.hour)}:${pad(alarm.minute)}`,
      days: alarm.days ?? [],
      sound: alarm.sound ?? 'wake',
      label: alarm.label ?? '',
      snooze_min: alarm.snooze_min ?? 9,
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const [hour, minute] = form.time.split(':').map(Number);
      // Empty selection means "every day" on both the backend and the device.
      const base = {
        hour,
        minute,
        days: form.days.length ? [...form.days].sort((a, b) => a - b) : undefined,
        sound: form.sound || undefined,
        label: form.label.trim() || undefined,
        snooze_min: form.snooze_min,
      };
      if (form.id) {
        return updateAlarm(form.id, base);
      }
      return createAlarm({ ...base, device_id: form.device_id });
    },
    onSuccess: (res) => {
      // set_alarm is not queueable: an offline device reports `failed` by
      // design (the definition is re-pushed on its next reconnect).
      if (res.command && res.command.status === 'failed') {
        toast.info('Saved. Device is offline — it will sync when it reconnects.');
      } else {
        toast.success(form.id ? 'Alarm updated' : 'Alarm set');
      }
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteAlarm(id),
    onSuccess: () => {
      toast.success('Alarm deleted');
      void queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <PageHeader
        title="Alarms"
        subtitle={locked ? 'Requires the Plus plan' : 'Wake up with your companion'}
        action={
          locked ? undefined : (
            <Button onClick={openCreate} variant="primary" disabled={!devices?.length}>
              <Plus size={16} /> Alarm
            </Button>
          )
        }
      />

      {locked ? (
        <EmptyState
          icon={<AlarmClock size={28} />}
          title="The alarm clock is a Plus feature"
          message="Upgrade so your PUZO can wake you — it rings even when offline."
          action={
            <a href="/subscription">
              <Button variant="primary">Upgrade to Plus</Button>
            </a>
          }
        />
      ) : isLoading ? (
        <CardSkeleton count={2} />
      ) : !devices?.length ? (
        <EmptyState
          icon={<AlarmClock size={28} />}
          title="No companion yet"
          message="Provision a device first, then set alarms for it."
        />
      ) : !alarmsByDevice.length ? (
        <EmptyState
          icon={<AlarmClock size={28} />}
          title="No alarms yet"
          message="Set one and your companion will ring, buzz, and flash at the time you pick."
        />
      ) : (
        alarmsByDevice.map(([deviceId, list]) => (
          <Card key={deviceId} className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
            <CardHeader
              title={deviceById.get(deviceId) ?? deviceId}
              subtitle={`${list?.length ?? 0} alarm${list?.length === 1 ? '' : 's'} · stored on the device`}
            />
            <div className="flex flex-col gap-2.5">
              {(list ?? []).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#1E232B]">
                      <span className="font-mono">{pad(a.hour)}:{pad(a.minute)}</span>
                      {a.label ? ` · ${a.label}` : ''}
                    </p>
                    <p className="font-mono text-[11px] text-[#64748B] mt-0.5">
                      {a.days?.length
                        ? a.days.map((d) => WEEKDAYS[d]).join(' ')
                        : 'Every day'}
                      {' · '}snooze {a.snooze_min}m{a.sound ? ` · ${a.sound}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)} aria-label="Edit alarm">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removeMut.isPending}
                      onClick={() => removeMut.mutate(a.id)}
                      className="text-[#B92B34] hover:bg-[#FFEBEF]"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit alarm' : 'Set an alarm'}>
        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          {!form.id && (
            <Select
              label="Companion device"
              value={form.device_id}
              onChange={(e) => setForm((f) => ({ ...f, device_id: e.target.value }))}
              required
            >
              <option value="" disabled>
                Choose a device
              </option>
              {(devices ?? []).map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.name || d.device_id}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Time"
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            required
          />

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Repeat
            </span>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((label, day) => {
                const on = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={on}
                    className={cn(
                      'min-h-[38px] flex-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border',
                      on
                        ? 'bg-[#FF5A5F] border-[#FF5A5F] text-white shadow-sm shadow-[#FF5A5F]/25'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="mt-1.5 block text-[11px] leading-snug text-[#94A3B8]">
              No days selected means every day.
            </span>
          </div>

          <Select
            label="Sound"
            value={form.sound}
            onChange={(e) => setForm((f) => ({ ...f, sound: e.target.value }))}
          >
            {BUILTIN_SOUNDS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Input
            label="Label (optional)"
            value={form.label}
            maxLength={23}
            placeholder="Wake up"
            hint="Shown on the screen while ringing (max 23 chars)."
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />

          <Select
            label="Snooze"
            value={String(form.snooze_min)}
            onChange={(e) => setForm((f) => ({ ...f, snooze_min: Number(e.target.value) }))}
          >
            {[1, 3, 5, 9, 10, 15, 20, 30].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </Select>

          <p className="flex items-center gap-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[11px] leading-snug text-[#64748B]">
            <Bell size={14} className="shrink-0 text-[#FF5A5F]" />
            Alarms live on the device, so they ring even when it is offline. Tap once to snooze, twice or the button to stop.
          </p>

          <Button type="submit" isLoading={saveMut.isPending} className="w-full mt-2">
            {form.id ? 'Save alarm' : 'Set alarm'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}