'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { listNotifications, markNotificationRead } from '@/lib/api';
import type { NotificationRecord } from '@/lib/types';
import { enablePushNotifications, isFcmConfigured, listenForForegroundMessages } from '@/lib/fcm';
import { toast } from './Toast';

export function NotificationCenter() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const refresh = async () => {
    try {
      const result = await listNotifications();
      setItems(result.notifications);
      setUnread(result.unread_count);
    } catch {}
  };

  useEffect(() => {
    void refresh();
    let unsubscribe: (() => void) | undefined;
    void listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || 'PUZO';
      const body = payload.notification?.body || 'PUZO has something to tell you.';
      toast.info(`${title}: ${body}`);
      void refresh();
    }).then((fn) => {
      unsubscribe = fn;
    });
    return () => unsubscribe?.();
  }, []);

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-full text-[#1E232B]/80 hover:bg-black/5 transition-colors cursor-pointer"
        onClick={() => {
          setOpen(!open);
          if (!open) void refresh();
        }}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF5A5F] ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-[#EBF0F5] bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-2">
            <p className="font-extrabold text-sm text-[#1E232B]">Companion Messages</p>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E232B] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {isFcmConfigured && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <button
              className="mb-3 w-full rounded-2xl bg-[#FFEBEF] p-3 text-left text-xs font-bold text-[#FF5A5F] hover:bg-[#FFDDE4] transition-colors cursor-pointer"
              onClick={async () => {
                try {
                  await enablePushNotifications();
                  toast.success('Push notifications enabled');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Could not enable notifications');
                }
              }}
            >
              Enable push notifications
            </button>
          )}

          {items.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#94A3B8]">Nothing new yet.</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full gap-3 rounded-2xl border border-[#E2E8F0]/60 bg-[#F8FAFC] p-3 text-left hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                  onClick={async () => {
                    if (!item.read_at) {
                      await markNotificationRead(item.id);
                      setUnread(Math.max(0, unread - 1));
                      setItems(
                        items.map((x) =>
                          x.id === item.id ? { ...x, read_at: new Date().toISOString() } : x,
                        ),
                      );
                    }
                  }}
                >
                  <span className="mt-0.5 text-[#FF5A5F]">
                    {item.read_at ? <Check size={14} /> : <Bell size={14} />}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-[#1E232B] truncate">{item.title}</span>
                    <span className="block text-[11px] text-[#64748B] line-clamp-2 mt-0.5">{item.body}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

