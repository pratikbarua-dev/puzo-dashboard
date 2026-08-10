'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, Trash2, Copy, Check } from 'lucide-react';
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
      void queryClient.invalidateQueries({ queryKey: ['pairing'] });
    },
    onError: (e) => toast.error(extractError(e).message),
  });

  const joinMut = useMutation({
    mutationFn: () => joinPairingCode(joinCode.trim().toUpperCase()),
    onSuccess: () => {
      toast.success('Paired! Relationship created.');
      setJoinOpen(false);
      setJoinCode('');
      void queryClient.invalidateQueries({ queryKey: ['relationships'] });
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
    <div>
      <PageHeader
        title="Pairing"
        subtitle="Link a partner's PUZO to yours"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New code
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Create a code"
            subtitle="Share it once — it expires after use or 10 minutes"
          />
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              I have a code — join
            </Button>
            {newCode && (
              <div className="mt-2 rounded-lg bg-secondary/10 p-4 text-center">
                <p className="mb-2 text-label-caps text-on-surface-variant">YOUR CODE</p>
                <p className="mb-3 break-all font-mono text-2xl font-extrabold tracking-wider text-secondary">
                  {newCode}
                </p>
                <Button variant="secondary" onClick={copyCode} className="w-full">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy code'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Your codes" subtitle="Pending, used, and revoked" />
          {isLoading ? (
            <Loading />
          ) : !codes?.length ? (
            <EmptyState
              icon={<Link2 size={28} />}
              title="No pairing codes"
              message="Create a code to invite a partner, or ask for theirs to join."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-2"
                >
                  <div>
                    <p className="text-label-caps">{c.relationship_type}</p>
                    <p className="text-micro-label text-on-surface-variant">
                      {c.status} · expires {formatDate(c.expires_at)}
                    </p>
                  </div>
                  {c.status === 'pending' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMut.mutate(c.id)}
                    >
                      <Trash2 size={14} /> Revoke
                    </Button>
                  ) : (
                    <span className="text-label-caps text-on-surface-variant">{c.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Join sheet */}
      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a pairing">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            joinMut.mutate();
          }}
        >
          <Input
            label="Pairing code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="ABC123"
            required
            className="text-center font-mono text-xl uppercase tracking-widest"
          />
          <Button type="submit" disabled={joinMut.isPending}>
            {joinMut.isPending ? 'Joining…' : 'Join'}
          </Button>
        </form>
      </Sheet>

      {/* Create sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New pairing code">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <Select label="Relationship type" value={relType} onChange={(e) => setRelType(e.target.value)}>
            <option value="partner">Partner</option>
            <option value="friend">Friend</option>
            <option value="family">Family</option>
          </Select>
          <Button type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? 'Creating…' : 'Create code'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
