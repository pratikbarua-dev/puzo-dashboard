'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  FolderCog,
  UploadCloud,
  Sparkles,
  Users,
  CreditCard,
  ScrollText,
  Shield,
  Menu,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet } from './ui';
import { authClient } from '@/lib/auth-client';
import { toast } from './Toast';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/devices', label: 'Devices', icon: Cpu },
  { href: '/admin/firmware', label: 'Firmware', icon: FolderCog },
  { href: '/admin/ota', label: 'OTA Jobs', icon: UploadCloud },
  { href: '/admin/content', label: 'Content', icon: Sparkles },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return !!pathname && pathname.startsWith(href);
  };

  const signOut = async () => {
    await authClient.signOut();
    toast.info('Signed out');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh bg-[#F3F6FA] text-[#1E232B]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#EBF0F5] bg-white p-5 lg:flex">
        <div>
          <span className="text-xl font-black tracking-wide text-[#D93845]">PUZO</span>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFEBEF] px-2.5 py-1">
            <Shield size={11} className="text-[#C82D35]" />
            <span className="text-[11px] font-extrabold tracking-wider text-[#64748B]">
              ADMIN CONSOLE
            </span>
          </span>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
                isActive(item.href)
                  ? 'bg-[#FFEBEF] text-[#C82D35]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E232B]',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="mb-3 border-t border-[#EBF0F5]" />
          <Link
            href="/overview"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E232B]"
          >
            <ArrowLeft size={18} />
            Back to app
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EBF0F5] bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-[#1E232B] hover:bg-[#F1F5F9]"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" className="text-xl font-black tracking-wide text-[#D93845]">
            PUZO
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title="Admin Console">
        <div className="flex flex-col gap-2 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setNavOpen(false)}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-xl px-4 text-sm font-bold',
                isActive(item.href)
                  ? 'bg-[#FFEBEF] text-[#C82D35]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E232B]',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <Link
            href="/overview"
            onClick={() => setNavOpen(false)}
            className="mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-4 text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E232B]"
          >
            <ArrowLeft size={18} />
            Back to app
          </Link>
          <button
            onClick={signOut}
            className="flex min-h-[44px] items-center gap-3 rounded-xl px-4 text-sm font-bold text-red-500 hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </Sheet>
    </div>
  );
}
