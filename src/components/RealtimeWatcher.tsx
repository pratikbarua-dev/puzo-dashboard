'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useAuth } from '@/lib/auth-store';
import { useIncomingMoment } from '@/lib/incoming-moment-store';
import { toast } from './Toast';
import type { Interaction, InteractionType } from '@/lib/types';

/**
 * Global realtime watcher.
 *
 * Two responsibilities:
 *   • INSERT  — surface an interaction I just received as a rich IncomingInteractionMoment
 *     (no more flat toast) and keep the live lists fresh.
 *   • UPDATE  — when an interaction's status transitions (sent→delivered→
 *     acknowledged→completed/failed), patch it in place in the interactions
 *     cache so the InteractionStatus pill steps live, without a refetch. The
 *     emotionally meaningful transitions also surface a toast.
 */
export function RealtimeWatcher() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const showIncoming = useIncomingMoment((s) => s.show);

  useLiveEvents({
    onChange: ({ data }) => {
      const table = data.table as string;
      const eventType = data.eventType as string;
      const row = data.new as Record<string, unknown> | undefined;

      if (table === 'interactions' && profile) {
        if (eventType === 'INSERT') {
          // Incoming interaction (I'm the recipient). Build a shaped Interaction
          // for the overlay; fall back to the legacy toast if the row is too
          // sparse to reveal (defensive — the realtime schema is fixed, but the
          // recipient reveal is the one place we want to never throw).
          if (row && row.recipient_id === profile.id) {
            const moment = rowToInteraction(row);
            if (moment) {
              showIncoming(moment);
            } else {
              toast.info('New interaction received');
            }
          }
        } else if (eventType === 'UPDATE') {
          // A status transition on an interaction I sent (or received).
          patchInteractionStatus(queryClient, row);
          if (row && row.sender_id === profile.id) {
            const next = row.status as Interaction['status'] | undefined;
            // Surface the emotional beats specifically, not every state churn.
            if (next === 'delivered') toast.success('Delivered to your partner');
            else if (next === 'acknowledged') toast.success('Your partner reacted');
            else if (next === 'failed') toast.error('Interaction failed to deliver');
          }
        }
      }

      const refreshable: Record<string, string[][]> = {
        devices: [['me'], ['devices'], ['admin', 'devices']],
        device_events: [['me'], ['devices']],
        ota_jobs: [['admin', 'ota']],
        firmware_releases: [['admin', 'firmware']],
        interactions: [['interactions']],
        schedules: [['schedules']],
      };

      const keys = refreshable[table];
      if (keys) {
        for (const k of keys) void queryClient.invalidateQueries({ queryKey: k });
      }
    },
    onUnavailable: () => {
      // Fallback: periodic refresh for the user-facing lists.
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });

  return null;
}

/**
 * Patch a single interaction's status (and timestamps) in the interactions
 * cache from a realtime UPDATE payload, in place — so the timeline pill
 * steps Sending -> Sent -> Delivered -> Reacted without a refetch round-trip.
 */
function patchInteractionStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  row: Record<string, unknown> | undefined,
): void {
  if (!row?.id || typeof row.id !== 'string') return;
  const id = row.id;
  queryClient.setQueryData<Interaction[]>(['interactions'], (prev) => {
    const list = prev ?? [];
    return list.map((i) =>
      i.id === id
        ? {
            ...i,
            status: (row.status as Interaction['status']) ?? i.status,
            sent_at: (row.sent_at as string | null) ?? i.sent_at,
            delivered_at: (row.delivered_at as string | null) ?? i.delivered_at,
            acknowledged_at: (row.acknowledged_at as string | null) ?? i.acknowledged_at,
            completed_at: (row.completed_at as string | null) ?? i.completed_at,
            failed_at: (row.failed_at as string | null) ?? i.failed_at,
          }
        : i,
    );
  });
}

/**
 * Coerce a raw realtime INSERT row into a shaped Interaction for the
 * incoming-moment overlay. Returns null when essential fields are missing or
 * the wrong type — the caller falls back to a plain toast in that case so the
 * recipient still gets *some* signal.
 */
function rowToInteraction(row: Record<string, unknown>): Interaction | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const sender_id = typeof row.sender_id === 'string' ? row.sender_id : null;
  const recipient_id = typeof row.recipient_id === 'string' ? row.recipient_id : null;
  const type = typeof row.type === 'string' ? (row.type as InteractionType) : null;
  if (!id || !sender_id || !recipient_id || !type) return null;

  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};

  return {
    id,
    sender_id,
    recipient_id,
    relationship_id: typeof row.relationship_id === 'string' ? row.relationship_id : null,
    type,
    payload,
    source_device_id: typeof row.source_device_id === 'string' ? row.source_device_id : null,
    target_device_id: typeof row.target_device_id === 'string' ? row.target_device_id : null,
    status: (row.status as Interaction['status']) ?? 'sent',
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    sent_at: typeof row.sent_at === 'string' ? row.sent_at : null,
    delivered_at: typeof row.delivered_at === 'string' ? row.delivered_at : null,
    acknowledged_at: typeof row.acknowledged_at === 'string' ? row.acknowledged_at : null,
    completed_at: typeof row.completed_at === 'string' ? row.completed_at : null,
    failed_at: typeof row.failed_at === 'string' ? row.failed_at : null,
  };
}
