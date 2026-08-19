'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui';

export function InstallPwaPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone || sessionStorage.getItem('puzo-install-dismissed')) return;
    const handler = (e: Event) => { e.preventDefault(); setEvent(e as BeforeInstallPromptEvent); setVisible(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!visible || !event) return null;
  return <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-2xl border border-outline-variant bg-surface-container-highest p-5 shadow-puzo md:bottom-6">
    <button aria-label="Dismiss" className="absolute right-3 top-3 text-on-surface-variant" onClick={() => { sessionStorage.setItem('puzo-install-dismissed', '1'); setVisible(false); }}><X size={18} /></button>
    <div className="mb-3 flex items-center gap-3"><Download className="text-primary" size={22} /><div><p className="font-bold">Keep PUZO close</p><p className="text-sm text-on-surface-variant">Install the companion for faster access and notifications.</p></div></div>
    <Button className="w-full" onClick={async () => { await event.prompt(); setVisible(false); }}>Install PUZO</Button>
  </div>;
}
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
