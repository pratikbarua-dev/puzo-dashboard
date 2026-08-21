/**
 * Command definitions mirroring the backend command registry
 * (src/modules/commands/command.registry.js) for schema-driven forms.
 */

import type { HapticIntensity, HapticPattern } from './types';

export interface CommandField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  min?: number;
  max?: number;
  default?: number | string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}

export interface CommandDef {
  command: string;
  label: string;
  interactionType?: string;
  fields: CommandField[];
  /**
   * Reshapes the form draft into the payload the backend expects, for the
   * commands whose wire schema is not a flat mirror of their fields.
   */
  buildPayload?: (draft: Record<string, unknown>) => Record<string, unknown>;
}

/** Vibration patterns the firmware implements, in rough order of intensity. */
export const HAPTIC_PATTERNS: { value: HapticPattern; label: string }[] = [
  { value: 'short', label: 'Short tap' },
  { value: 'double', label: 'Double tap' },
  { value: 'triple', label: 'Triple tap' },
  { value: 'long', label: 'Long buzz' },
  { value: 'heartbeat', label: 'Heartbeat' },
  { value: 'love', label: 'Love' },
  { value: 'notification', label: 'Notification' },
];

export const HAPTIC_INTENSITIES: { value: HapticIntensity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/**
 * Melodies compiled into the firmware, so they play with no pack installed. A
 * pack's sound of the same name takes precedence on the device, which is why
 * this list needs no pack qualifier.
 */
const BUILTIN_SOUNDS = [
  'happy',
  'love',
  'sad',
  'sleepy',
  'success',
  'error',
  'startup',
  'notification',
  'wake',
  'touch',
  'charging',
  'partner_reaction',
];

/**
 * `set_config` keys the firmware actually accepts, with the type each value must
 * be coerced to. The backend schema is strict, so a key that is not here is
 * rejected outright rather than ignored.
 */
const CONFIG_KEYS: {
  value: string;
  label: string;
  kind: 'number' | 'boolean' | 'string';
  options?: string[];
}[] = [
  { value: 'sleep_timeout_min', label: 'Auto-sleep timeout (min)', kind: 'number' },
  { value: 'focus_duration_min', label: 'Focus duration (min)', kind: 'number' },
  { value: 'timezone_offset_min', label: 'Timezone offset (min)', kind: 'number' },
  { value: 'volume', label: 'Volume (0–100)', kind: 'number' },
  { value: 'haptic_intensity', label: 'Haptic intensity', kind: 'string', options: ['low', 'medium', 'high'] },
  { value: 'wake_sound_enabled', label: 'Wake sound enabled', kind: 'boolean' },
  { value: 'wake_vibration_enabled', label: 'Wake vibration enabled', kind: 'boolean' },
  { value: 'quiet_mode_enabled', label: 'Quiet mode enabled', kind: 'boolean' },
  { value: 'eye_pack', label: 'OLED eye style', kind: 'string', options: ['classic', 'iris_oled'] },
  { value: 'weather_cache', label: 'Weather cache', kind: 'string' },
];

export const COMMAND_DEFINITIONS: CommandDef[] = [
  {
    command: 'expression',
    label: 'Expression',
    interactionType: 'expression',
    fields: [{ name: 'expression', label: 'Expression name', type: 'text', max: 50 }],
  },
  {
    command: 'display',
    label: 'Display message',
    interactionType: 'message',
    fields: [{ name: 'text', label: 'Message', type: 'text', max: 120 }],
  },
  {
    command: 'emotion',
    label: 'Emotion',
    interactionType: 'emotion',
    fields: [
      { name: 'emotion', label: 'Emotion name', type: 'text', max: 50 },
      { name: 'message', label: 'Message (optional)', type: 'text', max: 120 },
    ],
  },
  {
    command: 'animation',
    label: 'Animation',
    interactionType: 'animation',
    fields: [{ name: 'animation', label: 'Animation name', type: 'text', max: 80 }],
  },
  {
    command: 'vibration',
    label: 'Vibration',
    interactionType: 'vibration',
    // Pattern and intensity, not milliseconds and duty cycle. The backend still
    // accepts the raw form for older clients, but there is no reason to ask a
    // person for a 0–255 motor strength.
    fields: [
      {
        name: 'pattern',
        label: 'Pattern',
        type: 'select',
        default: 'double',
        options: HAPTIC_PATTERNS,
      },
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'select',
        default: 'medium',
        options: HAPTIC_INTENSITIES,
        hint: 'Quiet mode on the device overrides this and stays silent.',
      },
    ],
  },
  {
    command: 'sound',
    label: 'Sound',
    interactionType: 'sound',
    fields: [
      {
        name: 'sound',
        label: 'Sound',
        type: 'select',
        default: 'happy',
        options: BUILTIN_SOUNDS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
        hint: 'Plays the active pack’s version of this sound when one is installed.',
      },
    ],
  },
  {
    command: 'restart',
    label: 'Restart',
    interactionType: undefined,
    fields: [],
  },
  {
    command: 'wifi_reset_warning',
    label: 'Request Wi-Fi reset',
    interactionType: undefined,
    fields: [],
  },
  {
    command: 'set_config',
    label: 'Set config',
    interactionType: undefined,
    fields: [
      {
        name: 'config',
        label: 'Config key',
        type: 'select',
        default: 'volume',
        options: CONFIG_KEYS.map((k) => ({ value: k.value, label: k.label })),
      },
      { name: 'value', label: 'Value', type: 'text', placeholder: 'e.g. 70, true, classic' },
    ],
    // The wire schema is a partial settings object (`{volume: 70}`), not the
    // `{config, value}` pair the form collects — and it is strict, so sending
    // the pair fails validation outright.
    buildPayload: (draft) => {
      const key = String(draft.config ?? '');
      const spec = CONFIG_KEYS.find((k) => k.value === key);
      if (!spec) return {};
      const raw = String(draft.value ?? '').trim();
      if (spec.kind === 'boolean') return { [key]: raw === 'true' || raw === '1' };
      if (spec.kind === 'number') {
        const n = Number(raw);
        return Number.isFinite(n) ? { [key]: n } : {};
      }
      return { [key]: raw };
    },
  },
];

export function commandDef(command: string): CommandDef | undefined {
  return COMMAND_DEFINITIONS.find((c) => c.command === command);
}

/**
 * The command behind an interaction type. The names line up except for
 * `message`, which the firmware and backend registry call `display`.
 */
export function commandForInteractionType(type: string): string {
  return type === 'message' ? 'display' : type;
}

/** Interaction types allowed when sending to a partner (targets their device). */
export const INTERACTION_TYPES = COMMAND_DEFINITIONS.filter((c) => c.interactionType).map(
  (c) => c.interactionType as string,
);

export function defaultPayload(command: string): Record<string, unknown> {
  const def = commandDef(command);
  const payload: Record<string, unknown> = {};
  if (!def) return payload;
  for (const f of def.fields) {
    if (f.default !== undefined) payload[f.name] = f.default;
  }
  return payload;
}

/** The payload to actually send for a command, given what the form collected. */
export function buildPayload(
  command: string,
  draft: Record<string, unknown>,
): Record<string, unknown> {
  const def = commandDef(command);
  if (def?.buildPayload) return def.buildPayload(draft);
  // Empty optional text fields would fail the backend's minimum-length checks,
  // so a field the user left blank is treated as unset rather than as ''.
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (typeof value === 'string' && value.trim() === '') continue;
    payload[key] = value;
  }
  return payload;
}
