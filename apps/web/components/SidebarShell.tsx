'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight, Globe, Menu, X, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';
import { ROUTES } from '@/lib/routes';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

/** Nav links + bottom actions, shared between the desktop rail and the mobile overlay. */
function SidebarNav({
  nav,
  rootHref,
  pathname,
  linkClass,
  logout,
  hideSiteLink,
  onNavigate,
}: {
  nav: NavItem[];
  rootHref: string;
  pathname: string | null;
  linkClass: (active: boolean) => string;
  logout: () => void;
  hideSiteLink?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = item.href === rootHref ? pathname === rootHref : (pathname ?? '').startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)} onClick={onNavigate}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-accent px-1.5 font-body text-[10px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2">
        {hideSiteLink ? null : (
          <Link href={ROUTES.HOME} className={linkClass(false)} onClick={onNavigate}>
            <Globe className="h-5 w-5 flex-shrink-0" />
            На сайт
          </Link>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 py-3 font-body text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-accent/30"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Выйти
        </button>
      </div>
    </>
  );
}

interface IProps {
  nav: NavItem[];
  rootHref: string;
  storageKey: string;
  headerLinks?: NavItem[];
  children: ReactNode;
}

/** Sidebar shell (desktop rail + mobile overlay) shared by /cabinet and /admin. */
export function SidebarShell({
  nav,
  rootHref,
  storageKey,
  headerLinks,
  children,
}: IProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, next ? '1' : '0');
      return next;
    });
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 font-body text-base font-medium transition-colors ${
      active ? 'bg-accent/10 text-accent' : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
    }`;

  const hasHeaderLinks = Boolean(headerLinks && headerLinks.length > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="relative hidden flex-shrink-0 lg:block">
        <aside
          className={`flex h-full flex-col overflow-hidden border-r border-white/[0.06] py-6 transition-[width,padding] duration-200 ${
            collapsed ? 'w-0 px-0' : 'w-60 px-4'
          }`}
        >
          <Link href={ROUTES.HOME} className="mb-8 block whitespace-nowrap text-lg">
            <Logo />
          </Link>
          <SidebarNav
            nav={nav}
            rootHref={rootHref}
            pathname={pathname}
            linkClass={linkClass}
            logout={logout}
            hideSiteLink={hasHeaderLinks}
          />
        </aside>

        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Показать сайдбар' : 'Скрыть сайдбар'}
          className="absolute -right-4 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a] text-white/50 transition-colors hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-6 lg:hidden">
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
          <div className="flex items-center gap-2">
            {headerLinks?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent transition-colors hover:bg-accent/20"
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
            <button onClick={logout} className="ml-2 font-body text-sm text-white/50">
              Выйти
            </button>
          </div>
        </header>
        <header className="hidden h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-6 lg:flex">
          <div className="flex items-center gap-3">
            {headerLinks?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <span className="font-body text-sm text-white/50">{user?.fullName ?? user?.login}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`relative flex h-full w-72 max-w-[80%] flex-col overflow-y-auto border-r border-white/[0.06] bg-[#0a0a0a] px-4 py-6 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <Link href={ROUTES.HOME} className="block text-lg" onClick={() => setMobileOpen(false)}>
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
            rootHref={rootHref}
            pathname={pathname}
            linkClass={linkClass}
            logout={logout}
            hideSiteLink={hasHeaderLinks}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      </div>
    </div>
  );
}
