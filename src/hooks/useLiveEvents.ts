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
 */
export function useLiveEvents({ onChange, onUnavailable }: Options = {}) {
  const [connected, setConnected] = useState(false);
  const onChangeRef = useRef(onChange);
  const onUnavailableRef = useRef(onUnavailable);
  onChangeRef.current = onChange;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
    };

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

    for (const [name, fn] of Object.entries(handlers)) {
      es.addEventListener(name, fn);
    }

    return () => {
      for (const [name, fn] of Object.entries(handlers)) {
        es.removeEventListener(name, fn);
      }
      es.close();
    };
  }, []);

  return { connected };
}
