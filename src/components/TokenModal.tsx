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
    <Sheet open={open} onClose={onClose} title={deviceName ? `Provision ${deviceName}` : 'Device Token'}>
      <div className="mb-4 rounded-2xl bg-[#FEF3C7] p-3.5 text-xs text-[#92400E] leading-relaxed">
        <span className="font-extrabold">Store this token securely.</span>{' '}
        It is shown only once and cannot be recovered.
      </div>
      {deviceId && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">DEVICE ID</p>
          <p className="font-mono text-sm font-extrabold text-[#1E232B]">{deviceId}</p>
        </div>
      )}
      <div className="mb-4">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">TOKEN</p>
        <div className="flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <code className="flex-1 break-all font-mono text-xs text-[#FF5A5F]">
            {show ? token : '•'.repeat(Math.min(token.length, 32))}
          </code>
          <button
            onClick={() => setShow((s) => !s)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E232B] cursor-pointer"
            aria-label={show ? 'Hide token' : 'Show token'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={copy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E232B] cursor-pointer"
            aria-label="Copy token"
          >
            {copied ? <Check size={16} className="text-[#065A60]" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <Button className="w-full" onClick={onClose}>
        I&apos;ve stored it safely
      </Button>
    </Sheet>
  );
}
