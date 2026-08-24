'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';
import { PERFORMER_SECTION, CATALOG_SECTION, REVIEWS_SECTION } from '@/components/support/constants';
import { FaqList } from '@/components/support/FaqList';
import { ContactBlock } from '@/components/support/ContactBlock';

export default function SupportPage() {
  const { user } = useAuth();
  const chatsHref = user?.role === Role.Performer ? ROUTES.CABINET_CHATS : ROUTES.CABINET_MESSAGES;

  const accountSection = {
    title: 'Аккаунт и личный кабинет',
    body: user ? (
      <>
        Профиль, чаты и остальные разделы доступны в{' '}
        <Link href={ROUTES.CABINET} className="text-accent underline-offset-2 hover:underline">
          личном кабинете
        </Link>
        .
      </>
    ) : (
      <>
        Вход и регистрация — на странице{' '}
        <Link href={ROUTES.LOGIN} className="text-accent underline-offset-2 hover:underline">
          входа
        </Link>
        . После входа профиль, чаты и остальные разделы доступны в личном кабинете.
      </>
    ),
  };

  const chatsSection = {
    title: 'Чаты',
    body: (
      <>
        Переписка с клиентами и исполнителями ведётся в разделе{' '}
        <Link href={chatsHref} className="text-accent underline-offset-2 hover:underline">
          Чаты
        </Link>
        . Если отправка сообщений ограничена администратором — об этом будет сказано в интерфейсе чата.
      </>
    ),
  };

  const commonSections = [CATALOG_SECTION, accountSection, chatsSection, REVIEWS_SECTION];
  const sections = user?.role === Role.Performer ? [PERFORMER_SECTION, ...commonSections] : commonSections;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-16 md:py-24">
        <div className="card p-6 md:p-10">
          <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-[0.2em] text-accent">Справка</p>
          <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">Как пользоваться платформой</h1>

          <FaqList sections={sections} />
          <ContactBlock />
        </div>
      </main>
      <Footer />
    </div>
  );
}
