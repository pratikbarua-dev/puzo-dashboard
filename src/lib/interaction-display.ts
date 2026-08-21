import type { Interaction } from './types';

/**
 * Canonical emotion catalogue. Shared by the timeline (interactions page),
 * the composer presets, and the incoming-interaction moment so every surface
 * agrees on what a given emotion *means* and looks like.
 *
 * `label` is the short tap-target word; `icon` the emoji; `message` is the
 * human sentence sent as the interaction's payload.message — the recipient
 * sees this verbatim.
 */
export interface Emotion {
  key: string;
  label: string;
  icon: string;
  message: string;
}

export const EMOTION_PRESETS: Emotion[] = [
  { key: 'thinking_of_you', label: 'Thinking of you', icon: '❤️', message: 'Thinking of you ❤️' },
  { key: 'happy', label: 'Happy', icon: '😊', message: "I'm feeling happy 😊" },
  { key: 'miss_you', label: 'Miss you', icon: '🥺', message: 'I miss you 🥺' },
  { key: 'love', label: 'I love you', icon: '💕', message: 'I love you 💕' },
  { key: 'hug', label: 'Warm hug', icon: '🌸', message: 'Sending a warm hug 🌸' },
  { key: 'heartbeat', label: 'Heartbeat', icon: '⚡', message: 'Sending my heartbeat ⚡' },
];

const EMOTION_BY_KEY: Record<string, Emotion> = Object.fromEntries(
  EMOTION_PRESETS.map((e) => [e.key, e]),
);

/** Human message for an emotion key, falling back to the raw key. */
export function labelForEmotion(emotion: string): string {
  return EMOTION_BY_KEY[emotion]?.message ?? emotion;
}

/** Emoji for an emotion key, falling back to a neutral glyph. */
export function iconForEmotion(emotion: string): string {
  return EMOTION_BY_KEY[emotion]?.icon ?? '💬';
}

export interface InteractionDisplay {
  /** The headline text the user reads: the partner's message, or a label. */
  text: string;
  /** The decorative/leading emoji for the interaction. May be '' when none. */
  icon: string;
}

/**
 * Resolve any interaction into a { text, icon } pair for rendering. Pulls the
 * payload's message → text → emotion-label, mirroring the logic the timeline
 * used inline. Emotion interactions render their canonical icon; other types
 * fall back to a generic speech glyph so the UI is never blank.
 */
export function describeInteraction(i: Interaction): InteractionDisplay {
  const message = i.payload?.message;
  if (typeof message === 'string' && message) return { text: message, icon: emojiFor(i) };

  const text = i.payload?.text;
  if (typeof text === 'string' && text) return { text, icon: emojiFor(i) };

  const emotionKey = typeof i.payload?.emotion === 'string' ? i.payload.emotion : '';
  if (emotionKey) return { text: labelForEmotion(emotionKey), icon: iconForEmotion(emotionKey) };

  return { text: i.type, icon: '💬' };
}

function emojiFor(i: Interaction): string {
  const emotionKey = typeof i.payload?.emotion === 'string' ? i.payload.emotion : '';
  return emotionKey ? iconForEmotion(emotionKey) : '💬';
}
