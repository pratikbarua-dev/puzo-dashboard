'use client';

import { useState } from 'react';
import { buildPayload, commandDef, defaultPayload } from '@/lib/registry';
import type { CommandField } from '@/lib/registry';
import { Button, Input, Select } from './ui';

/**
 * Renders a command's payload fields. Shared so every surface that sends a
 * command offers the same pickers — a `select` field rendered as free text is how
 * a user ends up typing a pattern name the firmware has never heard of.
 */
export function CommandFields({
  fields,
  payload,
  onChange,
}: {
  fields: CommandField[];
  payload: Record<string, unknown>;
  onChange: (name: string, value: string | number) => void;
}) {
  return (
    <>
      {fields.map((f) =>
        f.type === 'select' && f.options && f.options.length > 0 ? (
          <div key={f.name}>
            <Select
              label={f.label}
              name={f.name}
              value={String(payload[f.name] ?? f.options[0].value)}
              onChange={(e) => onChange(f.name, e.target.value)}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            {f.hint && (
              <p className="mt-1.5 text-[11px] leading-snug text-on-surface-variant">{f.hint}</p>
            )}
          </div>
        ) : (
          <Input
            key={f.name}
            label={f.label}
            name={f.name}
            type={f.type === 'number' ? 'number' : 'text'}
            // `max` is a bound on a number and a length on text — the backend
            // rejects an over-long string, so stop it at the keyboard.
            min={f.type === 'number' ? f.min : undefined}
            max={f.type === 'number' ? f.max : undefined}
            maxLength={f.type === 'number' ? undefined : f.max}
            value={String(payload[f.name] ?? '')}
            onChange={(e) =>
              onChange(f.name, f.type === 'number' ? Number(e.target.value) : e.target.value)
            }
            placeholder={f.placeholder}
            hint={f.hint}
          />
        ),
      )}
    </>
  );
}

export function CommandForm({
  commands,
  submitLabel = 'Send',
  onSubmit,
  busy,
  extraField,
}: {
  commands: { command: string; label: string }[];
  submitLabel?: string;
  onSubmit: (command: string, payload: Record<string, unknown>) => void;
  busy?: boolean;
  extraField?: React.ReactNode;
}) {
  const [command, setCommand] = useState(commands[0]?.command || '');
  const [payload, setPayload] = useState<Record<string, unknown>>(
    defaultPayload(commands[0]?.command || ''),
  );

  const def = commandDef(command);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(command, buildPayload(command, payload));
      }}
    >
      <Select
        label="Command"
        value={command}
        onChange={(e) => {
          setCommand(e.target.value);
          setPayload(defaultPayload(e.target.value));
        }}
      >
        {commands.map((c) => (
          <option key={c.command} value={c.command}>
            {c.label}
          </option>
        ))}
      </Select>

      {extraField}

      <CommandFields
        fields={def?.fields ?? []}
        payload={payload}
        onChange={(name, value) => setPayload((p) => ({ ...p, [name]: value }))}
      />

      {payload.text !== undefined && (
        <p className="text-micro-label text-on-surface-variant">
          {String(payload.text).length}/120 characters
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? 'Sending…' : submitLabel}
      </Button>
    </form>
  );
}
