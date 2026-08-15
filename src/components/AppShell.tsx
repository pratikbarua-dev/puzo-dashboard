'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  Link2,
  HeartHandshake,
  Zap,
  CalendarClock,
  CreditCard,
  Settings,
  Shield,
  FolderCog,
  UploadCloud,
  Users,
  ScrollText,
  Sparkles,
  MoreHorizontal,
  LogOut,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, isAdmin } from '@/lib/auth-store';
import { Button, Sheet } from './ui';
import { PuzoLogo } from './PuzoLogo';
import { authClient } from '@/lib/auth-client';
import { toast } from './Toast';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  adminOnly?: boolean;
}

const USER_NAV: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices', icon: Cpu },
  { href: '/pairing', label: 'Pairing', icon: Link2 },
  { href: '/relationships', label: 'Relationships', icon: HeartHandshake },
  { href: '/interactions', label: 'Interactions', icon: Zap },
  { href: '/schedules', label: 'Schedules', icon: CalendarClock },
  { href: '/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, adminOnly: true },
  { href: '/admin/devices', label: 'Devices', icon: Cpu, adminOnly: true },
  { href: '/admin/firmware', label: 'Firmware', icon: FolderCog, adminOnly: true },
  { href: '/admin/ota', label: 'OTA jobs', icon: UploadCloud, adminOnly: true },
  { href: '/admin/content', label: 'Content', icon: Sparkles, adminOnly: true },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, adminOnly: true },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const admin = isAdmin(profile?.role);

  const allNav = [...USER_NAV, ...ADMIN_NAV.filter((n) => !n.adminOnly || admin)];

  const signOut = async () => {
    await authClient.signOut();
    toast.info('Signed out');
    router.push('/login');
    router.refresh();
  };

  const renderItem = (item: NavItem) => {
    const active =
      item.href === '/admin'
        ? pathname === '/admin'
        : pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMoreOpen(false)}
        className={cn(
          'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-body-base transition-fast',
          active
            ? 'bg-primary-container font-extrabold text-white'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        )}
      >
        <item.icon size={18} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-dvh bg-background-base">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest p-4 md:flex">
          <Link href="/overview" className="mb-6 flex items-center gap-2">
            <PuzoLogo size={36} />
            <span className="text-headline-md font-extrabold">PUZO</span>
          </Link>

          <nav className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-micro-label text-on-surface-variant">MENU</p>
            {USER_NAV.map(renderItem)}
            {admin && (
              <>
                <p className="px-3 pb-1 pt-4 text-micro-label text-on-surface-variant">
                  ADMIN
                </p>
                {ADMIN_NAV.filter((n) => !n.adminOnly || admin).map(renderItem)}
              </>
            )}
          </nav>

          <div className="mt-auto">
            <div className="mb-3 rounded-md bg-surface-container p-3">
              <p className="text-label-caps">{profile?.display_name || profile?.username || 'User'}</p>
              <p className="text-micro-label text-on-surface-variant">
                {profile?.role}
                {profile?.username ? ` · @${profile.username}` : ''}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-on-surface-variant hover:bg-surface-container-high"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest/90 px-4 py-2 pt-safe backdrop-blur md:hidden">
            <Link href="/overview" className="flex items-center gap-2">
              <PuzoLogo size={32} />
              <span className="text-headline-md font-extrabold">PUZO</span>
            </Link>
            <button
              onClick={() => setMoreOpen(true)}
              className="min-h-[44px] min-w-[44px] rounded-md text-on-surface-variant"
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:px-6 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-outline-variant bg-surface-container-lowest/95 pb-safe backdrop-blur md:hidden">
        {USER_NAV.slice(0, 4).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1',
                active ? 'text-white' : 'text-on-surface-variant',
              )}
            >
              <item.icon size={20} />
              <span className="text-micro-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-on-surface-variant"
        >
          <MoreHorizontal size={20} />
          <span className="text-micro-label">More</span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="flex flex-col gap-1">
          {allNav.map(renderItem)}
          <button
            onClick={signOut}
            className="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-error"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </Sheet>
    </div>
  );
}
