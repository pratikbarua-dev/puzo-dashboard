'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe, deleteMe } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Input, Select, ConfirmDialog } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

const TIMEZONES = ['UTC', 'Asia/Dhaka', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => updateMe({ display_name: displayName, username, timezone }),
    onSuccess: () => {
      toast.success('Profile saved');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: () => {
      toast.info('Account deleted');
      router.push('/login');
      router.refresh();
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile and account" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate();
            }}
          >
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="@username"
            />
            <Select label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Card>

        <Card className="h-fit">
          <CardHeader title="About" />
          <dl className="flex flex-col gap-2 text-body-base">
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Account ID</dt>
              <dd className="font-mono text-xs">{profile?.id ? `${profile.id.slice(0, 8)}…` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Role</dt>
              <dd>{profile?.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Timezone</dt>
              <dd>{timezone}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-outline-variant pt-4">
            <p className="mb-2 text-label-caps text-error">DANGER ZONE</p>
            <Button variant="danger" className="w-full" onClick={() => setDeleteOpen(true)}>
              Delete my account
            </Button>
            <p className="mt-2 text-micro-label text-on-surface-variant">
              Unlinks all devices, ends relationships, and cancels schedules.
            </p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
        message="This permanently deactivates your account, unlinks your devices, and ends your relationships. This cannot be undone."
        confirmLabel="Delete my account"
        onConfirm={() => deleteMut.mutate()}
        busy={deleteMut.isPending}
      />
    </div>
  );
}
