'use client';

import { useState } from 'react';
import { commandDef, defaultPayload } from '@/lib/registry';
import { Button, Input, Select } from './ui';

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

  const setField = (name: string, value: string) => {
    const field = def?.fields.find((f) => f.name === name);
    const parsed = field?.type === 'number' ? Number(value) : value;
    setPayload((p) => ({ ...p, [name]: parsed }));
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(command, payload);
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

      {def?.fields.map((f) => (
        <Input
          key={f.name}
          label={f.label}
          name={f.name}
          type={f.type === 'number' ? 'number' : 'text'}
          min={f.min}
          max={f.max}
          value={String(payload[f.name] ?? '')}
          onChange={(e) => setField(f.name, e.target.value)}
          placeholder={f.placeholder}
        />
      ))}

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
