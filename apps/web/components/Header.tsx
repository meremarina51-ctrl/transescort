'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuthOrGuest } from './AuthProvider';
import { NAV_LINKS } from './Header.constants';

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
    if (pathname !== '/') return;
    const id = href.replace('/#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault();
      scrollToAnchor(href);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10">
        <Link href="/" className="col-start-1 text-xl justify-self-start">
          <Logo />
        </Link>

        <nav className="col-start-2 hidden items-center gap-8 md:flex">
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

        <div className="col-start-3 hidden items-center gap-4 justify-self-end md:flex">
          {user ? (
            <Link href={privateAreaHref} className="btn-secondary !px-6 !py-2.5">
              {privateAreaLabel}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary !px-6 !py-2.5">
              Войти
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="col-start-3 justify-self-end text-white/70 md:hidden"
          aria-label={open ? 'Закрыть меню' : 'Меню'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </header>

    {open && (
      <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-[#0a0a0a]/90 backdrop-blur-2xl md:hidden">
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
            <Link href={privateAreaHref} className="btn-secondary mt-4" onClick={() => setOpen(false)}>
              {privateAreaLabel}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary mt-4" onClick={() => setOpen(false)}>
              Войти
            </Link>
          )}
        </nav>
      </div>
    )}
    </>
  );
}
