'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, Trash2, Copy, Check, Heart, Sparkles } from 'lucide-react';
import {
  createPairingCode,
  joinPairingCode,
  myPairingCodes,
  revokePairingCode,
} from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Input, Select, Sheet, Loading, EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { formatDate, extractError } from '@/lib/utils';

export default function PairingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: codes, isLoading } = useQuery({
    queryKey: ['pairing'],
    queryFn: myPairingCodes,
  });

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [relType, setRelType] = useState('partner');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMut = useMutation({
    mutationFn: () => createPairingCode(relType),
    onSuccess: (data) => {
      setNewCode(data.code);
      setCreateOpen(false);
      toast.success('Pairing code created!');
      void queryClient.invalidateQueries({ queryKey: ['pairing'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const joinMut = useMutation({
    mutationFn: () => joinPairingCode(joinCode),
    onSuccess: () => {
      toast.success('Paired! Relationship created.');
      setJoinOpen(false);
      setJoinCode('');
      void queryClient.invalidateQueries({ queryKey: ['relationships'] });
      router.push('/relationships');
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokePairingCode(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pairing'] }),
    onError: (e) => toast.error(extractError(e).message),
  });

  const copyCode = async () => {
    if (!newCode) return;
    try {
      await navigator.clipboard.writeText(newCode);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy code');
    }
  };

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <PageHeader
        title="Pairing"
        subtitle="Link your PUZO with your partner or friend's device"
        action={
          <Button onClick={() => setCreateOpen(true)} variant="primary">
            <Plus size={16} /> New Code
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader
              title="Create a Pairing Code"
              subtitle="Share it once — it expires after use or in 10 minutes"
            />
            <div className="flex flex-col gap-4 mt-2">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Generate a secure, single-use invite code to pair your PUZO companion with another user.
              </p>
              <Button variant="outline" onClick={() => setJoinOpen(true)} className="w-full">
                <Link2 size={16} /> I Have a Code — Join Pairing
              </Button>
              {newCode && (
                <div className="mt-2 rounded-2xl border border-[#FF5A5F]/30 bg-[#FFEBEF]/40 p-5 text-center shadow-sm">
                  <p className="mb-2 text-[10px] font-mono font-bold tracking-widest text-[#FF5A5F] uppercase flex items-center justify-center gap-1.5">
                    <Sparkles size={14} className="text-[#FF5A5F]" /> Active Invite Code
                  </p>
                  <p className="mb-4 break-all font-mono text-3xl font-black tracking-widest text-[#1E232B]">
                    {newCode}
                  </p>
                  <Button variant="primary" onClick={copyCode} className="w-full">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied to Clipboard' : 'Copy Code'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-[32px] p-5 sm:p-6 border border-[#EBF0F5] shadow-sm">
          <CardHeader title="Your Codes" subtitle="Pending, used, and revoked invitations" />
          {isLoading ? (
            <Loading />
          ) : !codes?.length ? (
            <EmptyState
              icon={<Heart size={28} />}
              title="No active pairing codes"
              message="Create a code to invite a partner, or ask for theirs to join."
            />
          ) : (
            <div className="flex flex-col gap-2.5 mt-2">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1E232B] uppercase tracking-wider">{c.relationship_type}</p>
                    <p className="text-[11px] font-mono text-[#64748B]">
                      {c.status} · expires {formatDate(c.expires_at)}
                    </p>
                  </div>
                  {c.status === 'pending' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMut.mutate(c.id)}
                      className="text-[#B92B34] hover:bg-[#FFEBEF]"
                    >
                      <Trash2 size={14} /> Revoke
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-[#94A3B8] capitalize">{c.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Join Sheet */}
      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a Pairing">
        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            joinMut.mutate();
          }}
        >
          <Input
            label="Pairing Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            hint="Six digits, from the code your partner generated."
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            className="text-center font-mono text-2xl font-bold tracking-widest text-[#1E232B]"
          />
          <Button
            type="submit"
            disabled={joinMut.isPending || joinCode.length !== 6}
            className="w-full mt-2"
          >
            {joinMut.isPending ? 'Joining…' : 'Join Pairing'}
          </Button>
        </form>
      </Sheet>

      {/* Create Sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New Pairing Code">
        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <Select label="Relationship Type" value={relType} onChange={(e) => setRelType(e.target.value)}>
            <option value="partner">Partner</option>
            <option value="friend">Friend</option>
            <option value="family">Family</option>
          </Select>
          <Button type="submit" disabled={createMut.isPending} className="w-full mt-2">
            {createMut.isPending ? 'Creating…' : 'Create Code'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
