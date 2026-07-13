'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Settings, LogOut, FileText, BarChart3, CreditCard } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';

const BASE_NAV = [{ href: '/cabinet', label: 'Обзор', icon: Home }] as const;

const PERFORMER_NAV = [
  { href: '/cabinet/listing', label: 'Моя анкета', icon: FileText },
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/stats', label: 'Статистика', icon: BarChart3 },
  { href: '/cabinet/tariff', label: 'Тариф', icon: CreditCard },
] as const;

const DEFAULT_NAV = [{ href: '/cabinet/profile', label: 'Профиль', icon: User }] as const;

const TAIL_NAV = [{ href: '/cabinet/settings', label: 'Настройки', icon: Settings }] as const;

function CabinetShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const nav = [
    ...BASE_NAV,
    ...(user?.role === 'performer' ? PERFORMER_NAV : DEFAULT_NAV),
    ...TAIL_NAV,
  ];

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 font-body text-sm font-medium transition-colors ${
      active ? 'bg-crimson/10 text-crimson' : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <aside className="hidden w-60 flex-shrink-0 border-r border-white/[0.06] px-4 py-6 lg:block">
        <Link href="/" className="mb-8 block text-lg">
          <Logo />
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = item.href === '/cabinet' ? pathname === '/cabinet' : (pathname ?? '').startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button onClick={logout} className={linkClass(false) + ' w-full'}>
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6 lg:hidden">
          <Logo className="text-lg" />
          <button onClick={logout} className="font-body text-sm text-white/50">
            Выйти
          </button>
        </header>
        <header className="hidden h-16 items-center justify-end border-b border-white/[0.06] px-6 lg:flex">
          <span className="font-body text-sm text-white/50">{user?.fullName ?? user?.email}</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CabinetShell>{children}</CabinetShell>
    </ProtectedRoute>
  );
}
