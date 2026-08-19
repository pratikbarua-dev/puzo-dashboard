'use client';

import { useQuery } from '@tanstack/react-query';
import { myRelationships } from './api';
import { useAuth } from './auth-store';
import type { ProfileLite, Relationship } from './types';

export interface PartnerInfo {
  /** The active relationship, if any. */
  relationship: Relationship | null;
  /** The other member's profile, resolved from `relationship.members[]`. */
  profile: (ProfileLite & { timezone?: string }) | null;
  /** Best available display name, or null when there is no partner yet. */
  name: string | null;
  avatarUrl: string | null;
  /** ISO timestamp of when the pairing started. */
  since: string | null;
  /** Devices owned by any member of the relationship. */
  devices: NonNullable<Relationship['devices']>;
  isLoading: boolean;
}

/**
 * Resolves the signed-in user's active partner from the real relationships
 * payload. The backend enriches each relationship with `members[]`, so the
 * partner is simply the member whose profile id is not ours.
 */
export function usePartner(): PartnerInfo {
  const { profile: me } = useAuth();
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: myRelationships,
  });

  const relationship =
    (relationships ?? []).find((r) => r.status === 'active') ??
    (relationships ?? []).find((r) => r.status === 'paused') ??
    null;

  const partnerMember = relationship?.members?.find(
    (m) => m.profile_id !== me?.id && !m.left_at,
  );
  const partnerProfile = partnerMember?.profile ?? null;

  const name =
    partnerProfile?.display_name ||
    (partnerProfile?.username ? `@${partnerProfile.username}` : null) ||
    null;

  return {
    relationship,
    profile: partnerProfile,
    name,
    avatarUrl: partnerProfile?.avatar_url ?? null,
    since: partnerMember?.joined_at ?? relationship?.created_at ?? null,
    devices: relationship?.devices ?? [],
    isLoading,
  };
}
