'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Hand,
  Smile,
  Frown,
  Radio,
  Sparkles,
  Music,
  MessageCircle,
  Film,
  Send,
} from 'lucide-react';
import { myInteractions } from '@/lib/api';
import type { Interaction } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { usePartner } from '@/lib/usePartner';
import { Loading, EmptyState, Button } from '@/components/ui';

/** Visual treatment per interaction — keyed off type first, then payload emotion. */
const EMOTION_STYLES: Record<
  string,
  { icon: React.ReactNode; bg: string; fg: string; label: string }
> = {
  love: { icon: <Heart size={20} className="fill-current" />, bg: 'bg-[#3D2227]', fg: 'text-[#FF5A5F]', label: 'Love' },
  happy: { icon: <Smile size={20} />, bg: 'bg-[#35331E]', fg: 'text-[#FFD166]', label: 'Happy' },
  excited: { icon: <Sparkles size={20} />, bg: 'bg-[#35331E]', fg: 'text-[#FFD166]', label: 'Excited' },
  sad: { icon: <Frown size={20} />, bg: 'bg-[#27223A]', fg: 'text-[#A06CD5]', label: 'Sad' },
  angry: { icon: <Frown size={20} />, bg: 'bg-[#3D2227]', fg: 'text-[#FF7A5F]', label: 'Angry' },
  sleepy: { icon: <Smile size={20} />, bg: 'bg-[#22293A]', fg: 'text-[#7DA2E8]', label: 'Sleepy' },
  calm: { icon: <Smile size={20} />, bg: 'bg-[#183537]', fg: 'text-[#2EC4B6]', label: 'Calm' },
  curious: { icon: <Sparkles size={20} />, bg: 'bg-[#183537]', fg: 'text-[#2EC4B6]', label: 'Curious' },
  playful: { icon: <Sparkles size={20} />, bg: 'bg-[#35331E]', fg: 'text-[#FFD166]', label: 'Playful' },
};

const TYPE_STYLES: Record<
  string,
  { icon: React.ReactNode; bg: string; fg: string; label: string; verb: string }
> = {
  emotion: { icon: <Heart size={20} className="fill-current" />, bg: 'bg-[#3D2227]', fg: 'text-[#FF5A5F]', label: 'Emotion', verb: 'sent' },
  expression: { icon: <Smile size={20} />, bg: 'bg-[#35331E]', fg: 'text-[#FFD166]', label: 'Expression', verb: 'sent' },
  vibration: { icon: <Hand size={20} />, bg: 'bg-[#183537]', fg: 'text-[#2EC4B6]', label: 'Nudge', verb: 'sent' },
  sound: { icon: <Music size={20} />, bg: 'bg-[#22293A]', fg: 'text-[#7DA2E8]', label: 'Sound', verb: 'played' },
  message: { icon: <MessageCircle size={20} />, bg: 'bg-[#1A332B]', fg: 'text-[#10B981]', label: 'Message', verb: 'sent' },
  animation: { icon: <Film size={20} />, bg: 'bg-[#27223A]', fg: 'text-[#A06CD5]', label: 'Animation', verb: 'sent' },
  animation_pack: { icon: <Film size={20} />, bg: 'bg-[#27223A]', fg: 'text-[#A06CD5]', label: 'Animation pack', verb: 'sent' },
};

const FALLBACK = {
  icon: <Radio size={20} />,
  bg: 'bg-[#1A332B]',
  fg: 'text-[#10B981]',
  label: 'Interaction',
  verb: 'sent',
};

function styleFor(item: Interaction) {
  const emotion = typeof item.payload?.emotion === 'string' ? item.payload.emotion : null;
  const base = TYPE_STYLES[item.type] ?? FALLBACK;
  if (emotion && EMOTION_STYLES[emotion]) {
    const e = EMOTION_STYLES[emotion];
    return { ...e, verb: base.verb };
  }
  return base;
}

/** Extra detail worth surfacing under the headline, when the payload has any. */
function detailFor(item: Interaction): string | null {
  const p = item.payload ?? {};
  for (const key of ['text', 'message', 'body', 'sound', 'animation', 'pack', 'expression']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 140);
  }
  return null;
}

/** Real calendar grouping: Today / Yesterday / an explicit date. */
function groupLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'EARLIER';
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  return d
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export default function HistoryPage() {
  const { profile } = useAuth();
  const partner = usePartner();

  const { data: interactions, isLoading } = useQuery({
    queryKey: ['interactions'],
    queryFn: myInteractions,
  });

  const groups = useMemo(() => {
    const rows = [...(interactions ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const out: { label: string; items: Interaction[] }[] = [];
    for (const item of rows) {
      const label = groupLabel(item.created_at);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [interactions]);

  if (isLoading) return <Loading label="Loading your history…" />;

  if (groups.length === 0) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={<Send size={26} />}
          title="No interactions yet"
          message={
            partner.name
              ? `Send ${partner.name} a mood, nudge or message and it will show up here.`
              : 'Pair with a partner, then every mood, nudge and message you exchange lands here.'
          }
          action={
            <Link href={partner.name ? '/interactions' : '/pairing'}>
              <Button>{partner.name ? 'Send an interaction' : 'Pair a partner'}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-[11px] font-mono font-bold tracking-widest text-[#94A3B8] uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-3">
            {group.items.map((item) => {
              const style = styleFor(item);
              const mine = !!profile?.id && item.sender_id === profile.id;
              const who = mine ? 'You' : partner.name ?? 'Your partner';
              const detail = detailFor(item);
              const time = new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl bg-[#23272C] p-4 border border-white/5 shadow-md"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.fg}`}
                  >
                    {style.icon}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-semibold text-white">
                      {who} {style.verb}{' '}
                      <span className={`font-bold ${style.fg}`}>{style.label}</span>
                    </p>
                    {detail && (
                      <p className="mt-0.5 truncate text-xs text-[#B9C4D2]">&ldquo;{detail}&rdquo;</p>
                    )}
                    <p className="mt-0.5 flex items-center gap-2 text-xs font-mono text-[#8E9CAE]">
                      <span>{time}</span>
                      <span className="text-[#4E5A6A]">·</span>
                      <span className="capitalize">{item.status}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
