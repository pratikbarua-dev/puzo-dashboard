import { create } from 'zustand';
import type { Interaction } from './types';

/**
 * Holds the single incoming-interaction moment that's currently surfacing to
 * the recipient. RealtimeWatcher pushes onto here instead of firing a flat
 * toast; the IncomingInteractionMoment overlay reads it and renders a rich
 * bottom-sheet reveal.
 *
 * Only one moment is shown at a time — new arrivals replace the current so
 * the emotional beat stays singular and unhurried.
 */
interface IncomingMomentState {
  /** The incoming interaction, or null when none is showing. */
  current: Interaction | null;
  /** Show an incoming interaction as the moment. */
  show: (interaction: Interaction) => void;
  /** Dismiss the current moment (used by timeout, manual close, or after react). */
  dismiss: () => void;
}

export const useIncomingMoment = create<IncomingMomentState>((set) => ({
  current: null,
  show: (interaction) => set({ current: interaction }),
  dismiss: () => set({ current: null }),
}));
