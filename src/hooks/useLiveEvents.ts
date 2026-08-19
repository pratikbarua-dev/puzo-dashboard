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

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
/** A connection that survived this long is treated as healthy, so the next
 *  drop starts backing off from scratch instead of inheriting old attempts. */
const STABLE_CONNECTION_MS = 15_000;

function parseData(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Subscribes to the BFF SSE feed (`/api/events`). Supabase Realtime events are
 * forwarded from the server; a `ping` keeps the connection alive.
 *
 * Reconnects are driven here rather than by `EventSource`, whose built-in retry
 * is a fixed ~3s with no ceiling — a restarting backend would otherwise get
 * hammered by every open dashboard at once.
 */
export function useLiveEvents({ onChange, onUnavailable }: Options = {}) {
  const [connected, setConnected] = useState(false);
  const onChangeRef = useRef(onChange);
  const onUnavailableRef = useRef(onUnavailable);
  onChangeRef.current = onChange;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let openedAt = 0;
    let disposed = false;

    const scheduleReconnect = () => {
      if (disposed) return;
      const backoff = Math.min(RECONNECT_BASE_MS * 2 ** attempts, RECONNECT_MAX_MS);
      attempts += 1;
      // Jitter keeps many tabs/clients from retrying in lockstep.
      timer = setTimeout(connect, backoff + Math.random() * 500);
    };

    function connect() {
      if (disposed) return;

      const es = new EventSource('/api/events');
      source = es;

      es.onopen = () => {
        openedAt = Date.now();
        setConnected(true);
      };

      es.onerror = () => {
        setConnected(false);
        if (openedAt && Date.now() - openedAt > STABLE_CONNECTION_MS) attempts = 0;
        // Take over the retry so it backs off; EventSource would loop at ~3s.
        es.close();
        if (source === es) source = null;
        scheduleReconnect();
      };

      const handlers: Record<string, (e: MessageEvent) => void> = {
        change: (e) => {
          const data = parseData(e.data);
          if (data) onChangeRef.current?.({ event: 'change', data });
        },
        connected: () => setConnected(true),
        channel_status: (e) => {
          const data = parseData(e.data);
          if (data?.status === 'SUBSCRIBED') setConnected(true);
        },
        unavailable: () => {
          setConnected(false);
          onUnavailableRef.current?.();
        },
        ping: () => setConnected(true),
      };

      for (const [name, fn] of Object.entries(handlers)) {
        es.addEventListener(name, fn);
      }
    }

    connect();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      source?.close();
      source = null;
    };
  }, []);

  return { connected };
}
