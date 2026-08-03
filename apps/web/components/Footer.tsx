import Link from 'next/link';
import Logo from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <Logo className="text-xl" />
            <p className="mt-1 font-body text-xs text-white/30">Платформа проверенных анкет</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 font-body text-xs text-white/40">
            <Link href="/#about" className="transition-colors hover:text-accent">О нас</Link>
            <Link href="/catalog" className="transition-colors hover:text-accent">Каталог</Link>
            <Link href="/#pricing" className="transition-colors hover:text-accent">Тарифы</Link>
          </nav>

          <p className="font-body text-xs text-white/20">&copy; {new Date().getFullYear()} TransEscort</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-6 font-body text-[11px] text-white/25">
          <Link href="/legal/oferta" className="transition-colors hover:text-accent">Публичная оферта</Link>
          <Link href="/legal/privacy-policy" className="transition-colors hover:text-accent">
            Политика обработки персональных данных
          </Link>
          <Link href="/legal/pd-consent" className="transition-colors hover:text-accent">
            Согласие на обработку персональных данных
          </Link>
        </div>
      </div>
    </footer>
  );
}
