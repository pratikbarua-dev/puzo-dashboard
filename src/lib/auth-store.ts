import { create } from 'zustand';
import type { Entitlements, Profile, Subscription } from './types';

interface AuthState {
  profile: Profile | null;
  entitlements: Entitlements | null;
  subscription: Subscription | null;
  loaded: boolean;
  setIdentity: (data: {
    profile: Profile;
    entitlements: Entitlements;
    subscription: Subscription | null;
  }) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  profile: null,
  entitlements: null,
  subscription: null,
  loaded: false,
  setIdentity: ({ profile, entitlements, subscription }) =>
    set({ profile, entitlements, subscription, loaded: true }),
  clear: () =>
    set({ profile: null, entitlements: null, subscription: null, loaded: true }),
}));

export const isAdmin = (role?: string | null) =>
  role === 'admin' || role === 'super_admin';
