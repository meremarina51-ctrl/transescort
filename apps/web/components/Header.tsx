'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuthOrGuest } from './AuthProvider';
import { NAV_LINKS } from './Header.constants';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';

export function Header() {
  const { user, privateAreaHref, privateAreaLabel } = useAuthOrGuest();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const scrollToAnchor = (href: string) => {
    if (pathname !== ROUTES.HOME) return;
    const id = href.replace('/#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    if (href.startsWith('/#') && pathname === ROUTES.HOME) {
      e.preventDefault();
      scrollToAnchor(href);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10">
        <Link href={ROUTES.HOME} className="col-start-1 text-xl justify-self-start">
          <Logo />
        </Link>

        <nav className="col-start-2 flex items-center gap-8 max-[975px]:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="font-body text-sm text-white/60 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="col-start-3 flex items-center gap-4 justify-self-end max-[975px]:hidden">
          {user ? (
            <>
              <Link href={privateAreaHref} className="btn-secondary !px-6 !py-2.5">
                {privateAreaLabel}
              </Link>
              {user.role === Role.Admin ? (
                <Link href={ROUTES.ADMIN} className="btn-primary !px-6 !py-2.5">
                  Панель
                </Link>
              ) : null}
            </>
          ) : (
            <Link href={ROUTES.LOGIN} className="btn-primary !px-6 !py-2.5">
              Войти
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="col-start-3 hidden justify-self-end text-white/70 max-[975px]:block"
          aria-label={open ? 'Закрыть меню' : 'Меню'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </header>

    {open && (
      <div className="fixed inset-x-0 bottom-0 top-16 z-40 hidden flex-col bg-[#0a0a0a]/90 backdrop-blur-2xl max-[975px]:flex">
        <nav className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="font-display text-2xl font-semibold text-white/80 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href={privateAreaHref} className="btn-secondary mt-4" onClick={() => setOpen(false)}>
                {privateAreaLabel}
              </Link>
              {user.role === Role.Admin ? (
                <Link href={ROUTES.ADMIN} className="btn-primary" onClick={() => setOpen(false)}>
                  Панель
                </Link>
              ) : null}
            </>
          ) : (
            <Link href={ROUTES.LOGIN} className="btn-primary mt-4" onClick={() => setOpen(false)}>
              Войти
            </Link>
          )}
        </nav>
      </div>
    )}
    </>
  );
}
