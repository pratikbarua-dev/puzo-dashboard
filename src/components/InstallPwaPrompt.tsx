'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui';

export function InstallPwaPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone || sessionStorage.getItem('puzo-install-dismissed')) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !event) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-3xl border border-[#EBF0F5] bg-white p-5 shadow-2xl md:bottom-6">
      <button
        aria-label="Dismiss"
        className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E232B] transition-colors cursor-pointer"
        onClick={() => {
          sessionStorage.setItem('puzo-install-dismissed', '1');
          setVisible(false);
        }}
      >
        <X size={16} />
      </button>
      <div className="mb-4 flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFEBEF] text-[#FF5A5F]">
          <Download size={22} />
        </div>
        <div className="min-w-0 pr-6">
          <p className="text-sm font-extrabold text-[#1E232B]">Keep PUZO close</p>
          <p className="text-xs text-[#64748B] mt-0.5">Install the companion app for instant access and alerts.</p>
        </div>
      </div>
      <Button
        className="w-full"
        variant="primary"
        onClick={async () => {
          await event.prompt();
          setVisible(false);
        }}
      >
        Install PUZO App
      </Button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

