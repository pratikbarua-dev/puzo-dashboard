'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit3,
  Heart,
  Users,
  Trash2,
  UserX,
  ChevronRight,
  LogOut,
  Link2,
  CalendarClock,
  MapPin,
  Bell,
  Send,
} from 'lucide-react';
import {
  updateMe,
  deleteMe,
  myInteractions,
  deleteInteraction,
  plans,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { usePartner } from '@/lib/usePartner';
import { Button, Input, Sheet, ConfirmDialog, Toggle } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { toast } from '@/components/Toast';
import { authClient } from '@/lib/auth-client';
import { extractError, formatDate } from '@/lib/utils';
import {
  disablePushNotifications,
  enablePushNotifications,
  hasPushPermission,
  isFcmConfigured,
} from '@/lib/fcm';

const SINCE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };

export default function MePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, subscription } = useAuth();
  const partner = usePartner();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteHistoryOpen, setDeleteHistoryOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setPushEnabled(hasPushPermission());
  }, []);

  const { data: interactions } = useQuery({
    queryKey: ['interactions'],
    queryFn: myInteractions,
  });

  const { data: planData } = useQuery({ queryKey: ['plans'], queryFn: plans });

  const saveProfileMut = useMutation({
    mutationFn: () => updateMe({ display_name: displayName, username }),
    onSuccess: () => {
      toast.success('Profile updated');
      setEditProfileOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteAccountMut = useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: async () => {
      toast.info('Account deactivated');
      await authClient.signOut();
      router.push('/login');
      router.refresh();
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  /** Really deletes the signed-in user's interaction history on the backend. */
  const clearHistoryMut = useMutation({
    mutationFn: async () => {
      const rows = interactions ?? [];
      const results = await Promise.allSettled(rows.map((i) => deleteInteraction(i.id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { total: rows.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      if (total === 0) toast.info('No history to clear');
      else if (failed === 0) toast.success(`Cleared ${total} interaction${total === 1 ? '' : 's'}`);
      else toast.error(`Cleared ${total - failed} of ${total}; ${failed} could not be removed`);
      setDeleteHistoryOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const pushMut = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await enablePushNotifications();
      else await disablePushNotifications();
      return next;
    },
    onSuccess: (next) => {
      setPushEnabled(next);
      toast.success(next ? 'Push notifications enabled' : 'Push notifications disabled');
    },
    onError: (err) => {
      setPushEnabled(hasPushPermission());
      toast.error(extractError(err).message);
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.info('Signed out');
    router.push('/login');
    router.refresh();
  };

  const activePlan =
    subscription?.plan ?? planData?.plans.find((p) => p.id === subscription?.plan_id) ?? null;
  const planLabel = activePlan?.name ?? (subscription ? 'PUZO' : 'Free');
  const subStatus = subscription?.status ?? null;
  const subIsLive = subStatus === 'active' || subStatus === 'trialing';

  const partnerInitial = (partner.name ?? '?').replace('@', '')[0]?.toUpperCase() ?? '?';
  const sinceLabel = partner.since
    ? new Date(partner.since).toLocaleDateString(undefined, SINCE_FORMAT).toUpperCase()
    : null;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-10">
      {/* 1. Profile Header */}
      <div className="rounded-[32px] bg-white p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col items-center text-center">
        <div className="relative mb-3.5">
          <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-md bg-gradient-to-tr from-amber-200 to-rose-300">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'You'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-black text-[#A82835]">
                {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setDisplayName(profile?.display_name || '');
              setUsername(profile?.username || '');
              setEditProfileOpen(true);
            }}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F5F9] border border-white text-[#1E232B] shadow-sm hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            title="Edit profile"
          >
            <Edit3 size={13} />
          </button>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-[#1E232B]">
          {profile?.display_name || profile?.username || 'Your profile'}
        </h1>
        {profile?.username && (
          <p className="mt-0.5 text-xs text-[#64748B] font-medium">@{profile.username}</p>
        )}

        <div className="mt-3.5">
          <span
            className={
              partner.relationship
                ? 'inline-flex items-center rounded-full bg-[#67E8F9]/30 px-5 py-1 text-xs font-mono font-bold tracking-wider text-[#0891B2]'
                : 'inline-flex items-center rounded-full bg-[#F1F5F9] px-5 py-1 text-xs font-mono font-bold tracking-wider text-[#64748B]'
            }
          >
            {partner.relationship ? 'CONNECTED' : 'NOT PAIRED'}
          </span>
        </div>
      </div>

      {/* 2. Partner Connection — real relationship members */}
      <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col gap-3.5">
        <h2 className="text-sm font-extrabold text-[#1E232B]">Partner Connection</h2>

        {partner.name ? (
          <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] p-3.5 border border-[#E2E8F0]/60">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-rose-200 to-amber-200">
                {partner.avatarUrl ? (
                  <img
                    src={partner.avatarUrl}
                    alt={partner.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm font-black text-[#A82835]">
                    {partnerInitial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[#64748B]">
                  Paired with <strong className="text-[#1E232B] font-bold">{partner.name}</strong>
                </p>
                <p className="text-[10px] font-mono font-bold tracking-wider text-[#94A3B8] uppercase">
                  {sinceLabel ? `SINCE ${sinceLabel}` : partner.relationship?.status?.toUpperCase()}
                </p>
              </div>
            </div>

            <Heart size={18} className="shrink-0 text-[#FF5A5F]" />
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F8FAFC] p-3.5 border border-dashed border-[#CBD5E1] text-xs text-[#64748B]">
            {partner.isLoading
              ? 'Checking your relationships…'
              : 'No partner paired yet. Share a pairing code to link your PUZOs.'}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/relationships" className="w-full">
            <Button variant="tealOutline" className="w-full py-3">
              <Users size={16} />
              <span>Manage Relationship</span>
            </Button>
          </Link>
          <Link href="/pairing" className="w-full">
            <Button variant="secondary" className="w-full py-3">
              <Link2 size={16} />
              <span>{partner.name ? 'Pairing Hub' : 'Pair a Partner'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Subscription — real plan & status */}
      <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#1E232B]">Subscription</h2>
          <span className="rounded-full bg-[#FFEBEF] px-3 py-0.5 text-[11px] font-mono font-bold text-[#C82D35] uppercase">
            {planLabel}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E232B]">
            <span
              className={`h-2 w-2 rounded-full ${
                subIsLive ? 'bg-[#10B981]' : subStatus ? 'bg-[#F59E0B]' : 'bg-[#CBD5E1]'
              }`}
            />
            <span className="capitalize">{subStatus ?? 'No active plan'}</span>
          </div>
          <p className="text-xs text-[#64748B]">
            {subscription?.current_period_end
              ? `${
                  subStatus === 'cancelled' || subStatus === 'canceled' ? 'Ends' : 'Renews'
                } on ${formatDate(subscription.current_period_end)}`
              : subIsLive
              ? 'No renewal date on file.'
              : 'Upgrade to unlock scheduled emotions, animation packs and more.'}
          </p>
        </div>

        <Link href="/subscription" className="w-full mt-1">
          <Button variant="danger" className="w-full py-3.5 bg-[#A82835] hover:bg-[#91222D]">
            {subIsLive ? 'Manage Plan' : 'View Plans'}
          </Button>
        </Link>
      </div>

      {/* 4. Companion & Automation — previously orphaned routes */}
      <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col">
        <h2 className="text-sm font-extrabold text-[#1E232B] mb-3">Companion</h2>

        <div className="flex flex-col divide-y divide-[#F1F5F9]">
          <Link
            href="/schedules"
            className="flex items-center justify-between py-3 -mx-2 px-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFEBEF] text-[#FF5A5F]">
                <CalendarClock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E232B]">Automations &amp; Schedules</p>
                <p className="text-[11px] text-[#64748B]">Queue emotions for later</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8]" />
          </Link>

          <Link
            href="/interactions"
            className="flex items-center justify-between py-3 -mx-2 px-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-[#1E232B]">
                <Send size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E232B]">Send an Interaction</p>
                <p className="text-[11px] text-[#64748B]">
                  {interactions ? `${interactions.length} sent so far` : 'Nudges, moods & messages'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8]" />
          </Link>

          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center justify-between py-3 -mx-2 px-2 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0891B2]">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E232B]">Location &amp; Weather</p>
                <p className="text-[11px] text-[#64748B]">
                  {profile?.city || profile?.location || 'Set your city for weather reactions'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8]" />
          </button>

          {/* Web push toggle */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E]">
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E232B]">Push Notifications</p>
                <p className="text-[11px] text-[#64748B]">
                  {isFcmConfigured
                    ? 'Alerts when your partner reaches out'
                    : 'Not configured for this dashboard'}
                </p>
              </div>
            </div>
            {isFcmConfigured ? (
              <Toggle
                checked={pushEnabled}
                onChange={(v) => pushMut.mutate(v)}
                ariaLabel="Push notifications"
              />
            ) : (
              <span className="shrink-0 font-mono text-[10px] text-[#94A3B8]">OFF</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Data & Privacy */}
      <div className="rounded-[32px] bg-white p-5 sm:p-6 border border-[#EBF0F5] shadow-sm shadow-slate-900/5 flex flex-col">
        <h2 className="text-sm font-extrabold text-[#1E232B] mb-3">Data &amp; Privacy</h2>

        <div className="flex flex-col divide-y divide-[#F1F5F9]">
          <button
            onClick={() => setDeleteHistoryOpen(true)}
            className="flex items-center justify-between py-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-[#1E232B]">
                <Trash2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E232B]">Delete History</p>
                <p className="text-[11px] text-[#64748B]">
                  {interactions?.length
                    ? `Remove ${interactions.length} interaction${
                        interactions.length === 1 ? '' : 's'
                      } from your feed`
                    : 'Nothing in your feed right now'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8]" />
          </button>

          <button
            onClick={() => setDeleteAccountOpen(true)}
            className="flex items-center justify-between py-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFEBEF] text-[#B92B34]">
                <UserX size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#B92B34]">Delete Account</p>
                <p className="text-[11px] text-[#64748B]">Permanently remove your data</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8]" />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#64748B] hover:text-[#B92B34] transition-colors cursor-pointer"
      >
        <LogOut size={14} />
        <span>Sign out of PUZO</span>
      </button>

      {/* Edit Profile Sheet */}
      <Sheet open={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Profile">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfileMut.mutate();
          }}
          className="flex flex-col gap-4 py-2"
        >
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            placeholder="username"
            maxLength={20}
          />
          <Button type="submit" disabled={saveProfileMut.isPending} className="w-full mt-2">
            {saveProfileMut.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Sheet>

      {/* Location & Weather Sheet */}
      <Sheet open={locationOpen} onClose={() => setLocationOpen(false)} title="Location & Weather">
        <LocationPicker />
      </Sheet>

      {/* Clear History Confirm */}
      <ConfirmDialog
        open={deleteHistoryOpen}
        onClose={() => setDeleteHistoryOpen(false)}
        title="Clear History"
        message={`This removes ${
          interactions?.length ?? 0
        } interaction(s) from your feed on the server. Your partner keeps their own copy.`}
        confirmLabel="Clear History"
        onConfirm={() => clearHistoryMut.mutate()}
        busy={clearHistoryMut.isPending}
        danger={false}
      />

      {/* Delete Account Confirm */}
      <ConfirmDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        title="Delete Account"
        message="This permanently deletes your companion account, unlinks your physical PUZO devices, and ends your relationships."
        confirmLabel="Delete Account"
        onConfirm={() => deleteAccountMut.mutate()}
        busy={deleteAccountMut.isPending}
      />
    </div>
  );
}
