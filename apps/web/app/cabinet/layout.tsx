'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Globe,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';

const SIDEBAR_COLLAPSED_KEY = 'cabinet-sidebar-collapsed';

const BASE_NAV = [{ href: '/cabinet', label: 'Обзор', icon: Home }] as const;

const PERFORMER_NAV = [
  { href: '/cabinet/listing', label: 'Моя анкета', icon: FileText },
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/stats', label: 'Статистика', icon: BarChart3 },
  { href: '/cabinet/tariff', label: 'Тариф', icon: CreditCard },
] as const;

const DEFAULT_NAV = [{ href: '/cabinet/profile', label: 'Профиль', icon: User }] as const;

const TAIL_NAV = [{ href: '/cabinet/settings', label: 'Настройки', icon: Settings }] as const;

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Nav links + bottom actions, shared between the desktop rail and the mobile overlay. */
function SidebarNav({
  nav,
  pathname,
  linkClass,
  logout,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string | null;
  linkClass: (active: boolean) => string;
  logout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = item.href === '/cabinet' ? pathname === '/cabinet' : (pathname ?? '').startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)} onClick={onNavigate}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2">
        <Link href="/" className={linkClass(false)} onClick={onNavigate}>
          <Globe className="h-5 w-5 flex-shrink-0" />
          На сайт
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-crimson px-4 py-3 font-body text-base font-semibold text-black transition-all hover:shadow-lg hover:shadow-crimson/30"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Выйти
        </button>
      </div>
    </>
  );
}

function CabinetShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const nav: NavItem[] = [
    ...BASE_NAV,
    ...(user?.role === 'performer' ? PERFORMER_NAV : DEFAULT_NAV),
    ...TAIL_NAV,
  ];

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 font-body text-base font-medium transition-colors ${
      active ? 'bg-crimson/10 text-crimson' : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="relative hidden flex-shrink-0 lg:block">
        <aside
          className={`flex h-full flex-col overflow-hidden border-r border-white/[0.06] py-6 transition-[width,padding] duration-200 ${
            collapsed ? 'w-0 px-0' : 'w-60 px-4'
          }`}
        >
          <Link href="/" className="mb-8 block whitespace-nowrap text-lg">
            <Logo />
          </Link>
          <SidebarNav nav={nav} pathname={pathname} linkClass={linkClass} logout={logout} />
        </aside>

        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Показать сайдбар' : 'Скрыть сайдбар'}
          className="absolute -right-4 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a] text-white/50 transition-colors hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
              className="text-white/60 transition-colors hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo className="text-lg" />
          </div>
          <button onClick={logout} className="font-body text-sm text-white/50">
            Выйти
          </button>
        </header>
        <header className="hidden h-16 items-center justify-end border-b border-white/[0.06] px-6 lg:flex">
          <span className="font-body text-sm text-white/50">{user?.fullName ?? user?.email}</span>
        </header>
        <main className="p-6">{children}</main>
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`relative flex h-full w-72 max-w-[80%] flex-col overflow-y-auto border-r border-white/[0.06] bg-[#0a0a0a] px-4 py-6 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="block text-lg" onClick={() => setMobileOpen(false)}>
              <Logo />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Закрыть меню"
              className="text-white/50 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav
            nav={nav}
            pathname={pathname}
            linkClass={linkClass}
            logout={logout}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
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
