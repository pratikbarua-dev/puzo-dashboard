import { cn } from '@/lib/utils';
import type { Interaction } from '@/lib/types';

/**
 * Stpped status for an interaction, voiced from the user's side and kept
 * consistent through the whole flow: Sending -> Sent -> Delivered -> Reacted.
 * (Driven by Interaction.status: queued|sent|delivered|acknowledged|completed|failed.)
 *
 * The lifecycle on the wire uses backend enums; this surfaces them with
 * language a person uses, so the timeline reads emotionally, not as a log.
 */
export function InteractionStatus({
  interaction,
  optimistic,
  className,
}: {
  interaction: Pick<Interaction, 'status'>;
  /** true while we're optimistically showing the beat before the server confirms "sent" */
  optimistic?: boolean;
  className?: string;
}) {
  const { label, tone } = describe(interaction.status, optimistic);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro-label',
        tone,
        className,
      )}
      data-status={optimistic ? 'sending' : interaction.status}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass(interaction.status, optimistic))} />
      {label}
    </span>
  );
}

function describe(
  status: Interaction['status'],
  optimistic?: boolean,
): { label: string; tone: string } {
  if (optimistic || status === 'queued') {
    // Pre-flight: the tap registered, server hasn't confirmed yet.
    return {
      label: 'Sending',
      tone: 'bg-surface-container-highest text-on-surface-variant',
    };
  }
  switch (status) {
    case 'sent':
      return { label: 'Sent', tone: 'bg-primary/20 text-primary' };
    case 'delivered':
      // Partner's PUZO received it.
      return { label: 'Delivered', tone: 'bg-primary-container text-white' };
    case 'acknowledged':
      // Partner PUZO reacted — the emotional payoff beat.
      return { label: 'Reacted', tone: 'bg-secondary text-on-secondary' };
    case 'completed':
      return { label: 'Done', tone: 'bg-primary-container text-white' };
    case 'failed':
      return { label: 'Failed', tone: 'bg-error-container text-on-error-container' };
    default:
      return { label: 'Sent', tone: 'bg-primary/20 text-primary' };
  }
}

function dotClass(status: Interaction['status'], optimistic?: boolean): string {
  if (optimistic || status === 'queued') return 'bg-on-surface/50 animate-pulse';
  switch (status) {
    case 'sent':
      return 'bg-primary';
    case 'delivered':
    case 'completed':
      return 'bg-white';
    case 'acknowledged':
      return 'bg-on-secondary animate-pulse';
    case 'failed':
      return 'bg-on-error-container';
    default:
      return 'bg-primary';
  }
}
