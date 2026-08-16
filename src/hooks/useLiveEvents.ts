'use client';

import { useEffect, useRef, useState } from 'react';

export interface LiveEvent {
  event: string;
  data: Record<string, unknown>;
}

interface Options {
  onChange?: (event: LiveEvent) => void;
  onUnavailable?: () => void;
}

/**
 * Subscribes to the BFF SSE feed (`/api/events`). Supabase Realtime events are
 * forwarded from the server; a `ping` keeps the connection alive.
 *
 * Self-heals: on a dropped connection we reconnect with exponential backoff
 * (capped at ~30s), paused while the tab is hidden — live delivery
 * confirmation depends on this feed staying up, so a broken pipe must
 * recover without a reload.
 */
export function useLiveEvents({ onChange, onUnavailable }: Options = {}) {
  const [connected, setConnected] = useState(false);
  const onChangeRef = useRef(onChange);
  const onUnavailableRef = useRef(onUnavailable);
  onChangeRef.current = onChange;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const handlers: Record<string, (e: MessageEvent) => void> = {
      change: (e) => onChangeRef.current?.({ event: 'change', data: JSON.parse(e.data) }),
      connected: () => setConnected(true),
      channel_status: (e) => {
        const { status } = JSON.parse(e.data) as { status: string };
        if (status === 'SUBSCRIBED') setConnected(true);
      },
      unavailable: (e) => {
        setConnected(false);
        onUnavailableRef.current?.();
        void e;
      },
      ping: () => setConnected(true),
    };

    let es: EventSource | null = null;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource('/api/events');
      es.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        es = null;
        scheduleReconnect();
      };

      for (const [name, fn] of Object.entries(handlers)) {
        es.addEventListener(name, fn);
      }
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      clearReconnect();
      // Pause while the tab is hidden — no point streaming into an unseen page.
      if (typeof document !== 'undefined' && document.hidden) return;
      // Exponential backoff capped at 30s: 1s, 2s, 4s, 8s, 16s, 30s, 30s, ...
      const delay = Math.min(30_000, 1_000 * 2 ** attempt);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    // When the tab comes back into view, reconnect promptly if we're down.
    const onVisibility = () => {
      if (!document.hidden && !es && !stopped) {
        attempt = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    connect();

    return () => {
      stopped = true;
      clearReconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (es) {
        for (const [name, fn] of Object.entries(handlers)) {
          es.removeEventListener(name, fn);
        }
        es.close();
      }
    };
  }, []);

  return { connected };
}
