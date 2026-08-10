'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Sheet, Button } from './ui';
import { toast } from './Toast';

export function TokenModal({
  open,
  onClose,
  deviceName,
  deviceId,
  token,
}: {
  open: boolean;
  onClose: () => void;
  deviceName?: string;
  deviceId?: string;
  token: string;
}) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy token');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={deviceName ? `Provision ${deviceName}` : 'Device token'}>
      <div className="mb-4 rounded-lg bg-secondary/10 p-3 text-sm text-on-surface-variant">
        <span className="font-extrabold text-secondary">Store this token securely.</span>{' '}
        It is shown only once and cannot be recovered.
      </div>
      {deviceId && (
        <div className="mb-3">
          <p className="mb-1 text-micro-label text-on-surface-variant">DEVICE ID</p>
          <p className="font-mono text-sm text-primary">{deviceId}</p>
        </div>
      )}
      <div className="mb-4">
        <p className="mb-1 text-micro-label text-on-surface-variant">TOKEN</p>
        <div className="flex items-center gap-2 rounded-md bg-surface-container-high p-3">
          <code className="flex-1 break-all font-mono text-xs text-primary-container">
            {show ? token : '•'.repeat(Math.min(token.length, 32))}
          </code>
          <button
            onClick={() => setShow((s) => !s)}
            className="min-h-[44px] min-w-[44px] text-on-surface-variant"
            aria-label={show ? 'Hide token' : 'Show token'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={copy}
            className="min-h-[44px] min-w-[44px] text-on-surface-variant"
            aria-label="Copy token"
          >
            {copied ? <Check size={18} className="text-secondary" /> : <Copy size={18} />}
          </button>
        </div>
      </div>
      <Button className="w-full" onClick={onClose}>
        I&apos;ve stored it
      </Button>
    </Sheet>
  );
}
