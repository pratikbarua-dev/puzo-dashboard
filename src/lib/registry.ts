/**
 * Command definitions mirroring the backend command registry
 * (src/modules/commands/command.registry.js) for schema-driven forms.
 */

export interface CommandField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  min?: number;
  max?: number;
  default?: number | string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface CommandDef {
  command: string;
  label: string;
  interactionType?: string;
  fields: CommandField[];
}

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
    command: 'rgb',
    label: 'RGB color',
    interactionType: 'rgb',
    fields: [
      { name: 'r', label: 'Red', type: 'number', min: 0, max: 255, default: 255 },
      { name: 'g', label: 'Green', type: 'number', min: 0, max: 255, default: 0 },
      { name: 'b', label: 'Blue', type: 'number', min: 0, max: 255, default: 0 },
    ],
  },
  {
    command: 'vibration',
    label: 'Vibration',
    interactionType: 'vibration',
    fields: [
      { name: 'duration', label: 'Duration (ms)', type: 'number', min: 0, max: 60000, default: 200 },
      { name: 'strength', label: 'Strength', type: 'number', min: 0, max: 255, default: 255 },
    ],
  },
  {
    command: 'sound',
    label: 'Sound',
    interactionType: 'sound',
    fields: [{ name: 'sound', label: 'Sound name', type: 'text', max: 50 }],
  },
  {
    command: 'restart',
    label: 'Restart',
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
        options: [
          { value: 'volume', label: 'Volume' },
          { value: 'brightness', label: 'Brightness' },
          { value: 'idle_timeout', label: 'Idle timeout (s)' },
        ],
      },
      { name: 'value', label: 'Value', type: 'text' },
    ],
  },
];

export function commandDef(command: string): CommandDef | undefined {
  return COMMAND_DEFINITIONS.find((c) => c.command === command);
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
