'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useAuth } from '@/lib/auth-store';
import { toast } from './Toast';
import type { Interaction } from '@/lib/types';

/**
 * Global realtime watcher.
 *
 * Two responsibilities:
 *   • INSERT  — toast received interactions + invalidate live lists (legacy).
 *   • UPDATE  — when an interaction's status transitions (sent→delivered→
 *     acknowledged→completed/failed), patch it in place in the interactions
 *     cache so the InteractionStatus pill steps live, without a refetch. The
 *     emotionally meaningful transitions also surface a toast.
 */
export function RealtimeWatcher() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  useLiveEvents({
    onChange: ({ data }) => {
      const table = data.table as string;
      const eventType = data.eventType as string;
      const row = data.new as Record<string, unknown> | undefined;

      if (table === 'interactions' && profile) {
        if (eventType === 'INSERT') {
          // Incoming interaction (I'm the recipient).
          if (row && row.recipient_id === profile.id) {
            toast.info(`New interaction received (${String(row.type)})`);
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
