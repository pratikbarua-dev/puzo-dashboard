'use client';

import { useEffect, useRef } from 'react';
import { Heart, X } from 'lucide-react';
import { useIncomingMoment } from '@/lib/incoming-moment-store';
import { useSendInteraction } from '@/hooks/useSendInteraction';
import { useAuth } from '@/lib/auth-store';
import { describeInteraction, EMOTION_PRESETS } from '@/lib/interaction-display';
import { Button } from './ui';
import { toast } from './Toast';
import { cn } from '@/lib/utils';

/** The four one-tap reactions surfaced on an incoming moment (kept short). */
const QUICK_REACTIONS = EMOTION_PRESETS.filter((e) =>
  ['love', 'hug', 'thinking_of_you', 'heartbeat'].includes(e.key),
);

/**
 * Rich reveal for an interaction the partner sent me. Rides on top of the
 * (app) shell (mounted once in the layout) and lights up the moment a realtime
 * INSERT lands for me as recipient.
 *
 * Replaces the legacy flat toast: instead of "New interaction received
 * (emotion)" the recipient sees the partner's actual message with the emotion
 * glyph front and centre, and can react back in a single tap — closing the
 * emotional loop (my reaction fires useSendInteraction targeting the partner's
 * device, which steps THEIR pill to "Reacted" over the existing UPDATE path).
 */
export function IncomingInteractionMoment() {
  const { current, dismiss } = useIncomingMoment();
  const { send, partnerDevice } = useSendInteraction();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after a generous window, but never feels rushed: a touch
  // anywhere on the card cancels the countdown so a lingering reader isn't
  // cut off, and it restarts only if the user lets go.
  useEffect(() => {
    if (!current) return;
    timer.current = setTimeout(() => dismiss(), 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [current, dismiss]);

  if (!current) return null;

  const { text, icon } = describeInteraction(current);

  // To react back we target the partner's device. The incoming row carries
  // source_device_id (the device that sent it); fall back to the paired
  // partnerDevice if the row didn't carry one.
  const reactTarget = current.source_device_id ?? partnerDevice?.device_id;

  const react = (emotionKey: string, label: string) => {
    if (!reactTarget) {
      toast.error('No companion reachable to react to');
      return;
    }
    send.mutate({
      type: 'emotion',
      payload: { emotion: emotionKey, message: `${label} ❤️` },
      target_device_id: reactTarget,
    });
    dismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 transition-fast sm:items-center"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Incoming moment"
    >
      <div
        className={cn(
          'animate-moment-reveal w-full max-w-md rounded-t-2xl bg-surface-container-low p-lg shadow-puzo transition-fast sm:rounded-2xl',
        )}
        onClick={(e) => {
          // Holding the card cancels the auto-dismiss; release leaves it.
          e.stopPropagation();
          if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
          }
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-micro-label text-on-surface-variant">
            {current.type.toUpperCase()} · FROM YOUR PARTNER
          </span>
          <button
            onClick={dismiss}
            className="min-h-[44px] min-w-[44px] rounded-md text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
        </div>

        {/* Emotion glyph + message: the emotional centre of the card. */}
        <div className="flex flex-col items-center gap-3 py-md text-center">
          <span
            className="animate-moment-pulse text-5xl leading-none"
            aria-hidden="true"
          >
            {icon || '💬'}
          </span>
          <p className="text-headline-md font-extrabold text-on-surface">{text}</p>
          <p className="text-micro-label text-on-surface-variant">
            A moment from your partner
          </p>
        </div>

        {/* One-tap reaction row — closes the loop back to the sender. */}
        <div className="mt-4">
          <p className="text-micro-label mb-2 text-on-surface-variant">REACT BACK</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_REACTIONS.map(({ key, label, icon: ri }) => (
              <button
                key={key}
                onClick={() => react(key, label)}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg bg-surface-container-high transition-fast hover:bg-primary/20 active:scale-95"
                aria-label={`React ${label}`}
              >
                <span className="text-xl">{ri}</span>
                <span className="text-[10px] font-semibold text-on-surface-variant">{label}</span>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => {
              // "Reply" sends a soft hug back as a gentle acknowledgement.
              react('hug', 'Sending a warm hug');
            }}
          >
            <Heart size={16} className="text-primary" /> Send a hug back
          </Button>
        </div>
      </div>
    </div>
  );
}
