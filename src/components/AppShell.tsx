'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  History as HistoryIcon,
  Radio,
  User,
  Wifi,
  MoreHorizontal,
  LogOut,
  ArrowLeftRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, isAdmin } from '@/lib/auth-store';
import { Sheet } from './ui';
import { authClient } from '@/lib/auth-client';
import { toast } from './Toast';
import { NotificationCenter } from './NotificationCenter';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const PRIMARY_TABS: NavItem[] = [
  { href: '/overview', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: HistoryIcon },
  { href: '/devices', label: 'Devices', icon: Radio },
  { href: '/settings', label: 'Me', icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [adminSheetOpen, setAdminSheetOpen] = useState(false);
  const admin = isAdmin(profile?.role);
  const isAdminView = pathname === '/admin' || pathname.startsWith('/admin/');

  const isHistoryView = pathname === '/history' || pathname.startsWith('/history');

  const signOut = async () => {
    await authClient.signOut();
    toast.info('Signed out');
    router.push('/login');
    router.refresh();
  };

  const getTabActive = (href: string) => {
    if (href === '/overview') return pathname === '/overview' || pathname === '/';
    if (href === '/history') return pathname === '/history' || pathname.startsWith('/history');
    if (href === '/devices') return pathname === '/devices' || pathname.startsWith('/devices') || pathname === '/pairing';
    if (href === '/settings') return pathname === '/settings' || pathname === '/subscription' || pathname === '/relationships' || pathname === '/interactions' || pathname === '/schedules';
    return pathname === href;
  };

  return (
    <div
      className={cn(
        'min-h-dvh flex flex-col justify-between transition-colors duration-300 select-none',
        isHistoryView ? 'bg-[#191C21] text-white' : 'bg-[#F3F6FA] text-[#1E232B]',
      )}
    >
      {/* Top Bar matching screenshot */}
      <header
        className={cn(
          'sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 pt-safe transition-colors duration-300',
          isHistoryView
            ? 'bg-[#191C21]/95 border-b border-white/5'
            : 'bg-[#F3F6FA]/90 backdrop-blur-md',
        )}
      >
        {/* Left: User Avatar */}
        <Link href="/settings" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/60 shadow-sm bg-gradient-to-tr from-amber-200 to-rose-300">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs font-black text-[#A82835]">
                {(profile?.display_name || profile?.username || 'P')[0].toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Center: Coral PUZO Wordmark */}
        <Link href="/overview" className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-xl font-black tracking-wide',
              isHistoryView ? 'text-[#FF656A]' : 'text-[#D93845]',
            )}
          >
            PUZO
          </span>
        </Link>

        {/* Right: Realtime Beacon & Notification */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <div
            className={cn(
              'grid h-8 w-8 place-items-center rounded-full transition-colors',
              isHistoryView ? 'text-white/80 hover:bg-white/10' : 'text-[#1E232B]/80 hover:bg-black/5',
            )}
            title="PUZO Fleet Connected"
          >
            <Wifi size={19} className="text-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-2 pb-28 sm:px-6">
        {children}
      </main>

      {/* Fixed Bottom Navigation matching screenshots */}
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t pb-safe backdrop-blur-2xl transition-colors duration-300',
          isHistoryView
            ? 'bg-[#15171C]/95 border-white/10 text-white/70'
            : 'bg-white/95 border-[#EAEFF5] text-[#64748B] shadow-lg shadow-slate-900/5',
        )}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {PRIMARY_TABS.map((item) => {
            const active = getTabActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 transition-all group py-1',
                  active
                    ? isHistoryView
                      ? 'text-[#FF656A] font-bold'
                      : 'text-[#D93845] font-bold'
                    : isHistoryView
                    ? 'text-white/60 hover:text-white'
                    : 'text-[#64748B] hover:text-[#1E232B]',
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    'transition-transform duration-200',
                    active ? 'scale-110' : 'group-hover:scale-105',
                  )}
                />
                <span className="text-[11px] font-mono tracking-tight">{item.label}</span>
                {active && (
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full -mt-0.5',
                      isHistoryView ? 'bg-[#FF656A]' : 'bg-[#D93845]',
                    )}
                  />
                )}
              </Link>
            );
          })}

          {admin && (
            <button
              onClick={() => setAdminSheetOpen(true)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-all py-1',
                isAdminView
                  ? 'text-[#FF656A] font-bold'
                  : isHistoryView
                  ? 'text-white/60 hover:text-white'
                  : 'text-[#64748B] hover:text-[#1E232B]',
              )}
              title="Admin Menu"
            >
              <Shield size={18} />
              <span className="text-[11px] font-mono tracking-tight">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Admin Operations Modal */}
      {admin && (
        <Sheet open={adminSheetOpen} onClose={() => setAdminSheetOpen(false)} title="Admin Fleet Console">
          <div className="flex flex-col gap-2 py-2">
            <Link
              href="/admin"
              onClick={() => setAdminSheetOpen(false)}
              className="flex min-h-[44px] items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 text-sm font-bold text-[#1E232B] hover:bg-[#F1F5F9]"
            >
              <span>Overview & Fleet Metrics</span>
              <ArrowLeftRight size={16} />
            </Link>
            <Link
              href="/admin/firmware"
              onClick={() => setAdminSheetOpen(false)}
              className="flex min-h-[44px] items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 text-sm font-bold text-[#1E232B] hover:bg-[#F1F5F9]"
            >
              <span>Firmware Binaries & OTA Jobs</span>
              <ArrowLeftRight size={16} />
            </Link>
            <Link
              href="/admin/users"
              onClick={() => setAdminSheetOpen(false)}
              className="flex min-h-[44px] items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 text-sm font-bold text-[#1E232B] hover:bg-[#F1F5F9]"
            >
              <span>User Accounts & RBAC Roles</span>
              <ArrowLeftRight size={16} />
            </Link>
            <button
              onClick={signOut}
              className="flex min-h-[44px] items-center gap-3 rounded-2xl px-4 text-sm font-bold text-red-500 hover:bg-red-50 mt-3"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
