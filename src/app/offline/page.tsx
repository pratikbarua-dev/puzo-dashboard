'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F3F6FA] p-6 text-center text-[#1E232B]">
      <Card className="flex max-w-sm flex-col items-center gap-4 p-6 rounded-[32px] border border-[#EBF0F5] shadow-lg">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FFEBEF] text-[#FF5A5F]">
          <WifiOff size={32} />
        </div>
        <h1 className="text-xl font-extrabold text-[#1E232B]">You are offline</h1>
        <p className="text-xs leading-relaxed text-[#64748B]">
          Internet connection lost. PUZO hardware gestures and cached pages continue working, but live companion moments require a network connection.
        </p>
        <Button onClick={() => window.location.reload()} className="w-full" variant="primary">
          <RefreshCw size={16} />
          Retry Connection
        </Button>
      </Card>
    </div>
  );
}
