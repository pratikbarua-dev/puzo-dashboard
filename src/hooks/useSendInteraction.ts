'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendInteraction, myDevices, myRelationships } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';
import type { Device, Interaction, Relationship } from '@/lib/types';

/**
 * Shared couple-experience hook. Two responsibilities, pulled out of the
 * three pages that were each re-implementing them (overview, interactions,
 * schedules):
 *
 *   1. Resolve the partner's PUZO device — "the device on my active
 *      relationship that is not mine." Previously each page recomputed this
 *      by subtracting myDevices from relationship.devices by hand.
 *   2. Send an interaction with OPTIMISTIC UI — the tap registers "Sent"
 *      instantly (no spinner round-trip), the server reconciles, and the
 *      later sent->delivered->acknowledged transitions arrive over realtime
 *      (see RealtimeWatcher) to drive the InteractionStatus progression.
 *
 * The feeling the brief asks for — "I am interacting with my partner," not
 * "managing a database record" — starts here, with the instant beat.
 */
export function useSendInteraction() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Resolve partner device once, shared across callers.
  const partnerQuery = usePartnerDevice();

  const send = useMutation({
    mutationFn: (input: {
      type: string;
      payload: Record<string, unknown>;
      target_device_id: string;
      source_device_id?: string;
      relationship_id?: string;
    }) => sendInteraction(input),

    // Optimistic: drop a temporary interaction at the top of the list the
    // moment the user taps, marked "sent". The InteractionStatus renders
    // "Sending" while the request is in-flight and the optimistic item sits
    // alone, then the server interaction replaces it on settle.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['interactions'] });
      const prev = queryClient.getQueryData<Interaction[]>(['interactions']);

      const optimisticId = `optimistic:${input.type}:${Date.now()}`;
      const optimistic: Interaction = {
        id: optimisticId,
        // The local placeholder is written then reconciled by the server
        // record on success — so transient non-nullable fields use '' until
        // the authoritative row lands.
        sender_id: profile?.id ?? '',
        recipient_id: '',
        relationship_id: input.relationship_id ?? null,
        type: input.type as Interaction['type'],
        payload: input.payload,
        source_device_id: input.source_device_id ?? null,
        target_device_id: input.target_device_id ?? null,
        status: 'sent',
        created_at: new Date().toISOString(),
        // sent_at is "now"; the server stamps the real one on reconcile.
        sent_at: new Date().toISOString(),
      };

      // Only insert once; guard against duplicate optimistic entries.
      const existing = prev?.some((i) => i.id === optimisticId);
      if (prev && !existing) {
        queryClient.setQueryData<Interaction[]>(['interactions'], [optimistic, ...prev]);
      }

      return { prev, optimisticId };
    },

    onError: (err, _input, ctx) => {
      // Roll the optimistic item back and show a friendly error.
      if (ctx?.prev) queryClient.setQueryData<Interaction[]>(['interactions'], ctx.prev);
      toast.error(extractError(err).message);
    },

    onSuccess: (serverInteraction, _input, ctx) => {
      // Replace the optimistic placeholder with the authoritative record so
      // the (server-stamped) id can later be matched by realtime UPDATEs.
      queryClient.setQueryData<Interaction[]>(['interactions'], (prev) => {
        const withoutOptimistic = (prev ?? []).filter(
          (i) => i.id !== ctx?.optimisticId,
        );
        // De-dup by server id in case the list refetched first.
        const has = withoutOptimistic.some((i) => i.id === serverInteraction.id);
        return has ? withoutOptimistic : [serverInteraction, ...withoutOptimistic];
      });
      // Keep the cache fresh with the canonical server order too.
      void queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast.success('Sent'); // The brief's verb, kept consistent through the flow.
    },
  });

  return {
    /** The partner's PUZO device, or null if no active/linked partner. */
    partnerDevice: partnerQuery.data ?? null,
    isSending: send.isPending,
    /** Which preset is in-flight (for per-button loading state). */
    sendingKey: send.variables ? String(send.variables.payload?.emotion ?? send.variables.type) : null,
    send,
  };
}

/**
 * Resolve the partner's PUZO: the device attached to an active relationship
 * that is not one of mine. Friendlier wording lives here so pages stop
 * subtracting device ids inline. Not sent to the toast layer; UI-only.
 */
export function usePartnerDevice() {
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: myDevices });
  const { data: relationships } = useQuery({ queryKey: ['relationships'], queryFn: myRelationships });

  const partnerDevice = useMemo(() => {
    return (
      (relationships ?? [])
        .filter((r: Relationship) => r.status === 'active')
        .flatMap((r: Relationship) => r.devices ?? [])
        // My device ids vs theirs.
        .find((d) => !devices?.some((mine: Device) => mine.device_id === d.device_id)) ?? null
    );
  }, [relationships, devices]);

  return { data: partnerDevice };
}
