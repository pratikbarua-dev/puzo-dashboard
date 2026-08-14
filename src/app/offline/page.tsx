'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-base p-6 text-center text-on-surface">
      <Card className="flex max-w-sm flex-col items-center gap-4 p-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-container-high text-primary-container">
          <WifiOff size={32} />
        </div>
        <h1 className="text-headline-md font-extrabold">You are offline</h1>
        <p className="text-body-base text-on-surface-variant">
          Internet connection lost. PUZO hardware gestures and cached pages continue working, but live updates require a network connection.
        </p>
        <Button onClick={() => window.location.reload()} className="w-full">
          <RefreshCw size={18} />
          Retry connection
        </Button>
      </Card>
    </div>
  );
}
