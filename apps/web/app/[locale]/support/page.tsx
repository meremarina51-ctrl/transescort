'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';
import { getPerformerSection, getCatalogSection, getReviewsSection } from '@/components/support/constants';
import { FaqList } from '@/components/support/FaqList';
import { ContactBlock } from '@/components/support/ContactBlock';

export default function SupportPage() {
  const { user } = useAuth();
  const t = useTranslations('support');
  const chatsHref = user?.role === Role.Performer ? ROUTES.CABINET_CHATS : ROUTES.CABINET_MESSAGES;

  const accountSection = {
    title: t('account.title'),
    body: user ? (
      t.rich('account.bodyLoggedIn', {
        link: (chunks) => (
          <Link href={ROUTES.CABINET} className="text-accent underline-offset-2 hover:underline">
            {chunks}
          </Link>
        ),
      })
    ) : (
      t.rich('account.bodyLoggedOut', {
        link: (chunks) => (
          <Link href={ROUTES.LOGIN} className="text-accent underline-offset-2 hover:underline">
            {chunks}
          </Link>
        ),
      })
    ),
  };

  const chatsSection = {
    title: t('chats.title'),
    body: t.rich('chats.body', {
      link: (chunks) => (
        <Link href={chatsHref} className="text-accent underline-offset-2 hover:underline">
          {chunks}
        </Link>
      ),
    }),
  };

  const commonSections = [getCatalogSection(t), accountSection, chatsSection, getReviewsSection(t)];
  const sections = user?.role === Role.Performer ? [getPerformerSection(t), ...commonSections] : commonSections;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-16 md:py-24">
        <div className="card p-6 md:p-10">
          <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-[0.2em] text-accent">{t('badge')}</p>
          <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">{t('heading')}</h1>

          <FaqList sections={sections} />
          <ContactBlock />
        </div>
      </main>
      <Footer />
    </div>
  );
};
