'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useAuth } from '@/lib/auth-store';
import { toast } from './Toast';

/** Global realtime watcher: toasts received interactions and refreshes live data. */
export function RealtimeWatcher() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  useLiveEvents({
    onChange: ({ data }) => {
      const table = data.table as string;
      const eventType = data.eventType as string;
      const row = data.new as Record<string, unknown> | undefined;

      if (table === 'interactions' && eventType === 'INSERT' && profile) {
        if (row && row.recipient_id === profile.id) {
          toast.info(`New interaction received (${String(row.type)})`);
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
