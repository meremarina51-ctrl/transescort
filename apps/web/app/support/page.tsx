'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { Role } from '@/lib/enums';

const SUPPORT_EMAIL = 'escortia@yandex.ru';

const PERFORMER_SECTION = {
  title: 'Анкета и фото',
  body: (
    <>
      Анкета редактируется в разделе{' '}
      <Link href="/cabinet/listing" className="text-accent underline-offset-2 hover:underline">
        Моя анкета
      </Link>
      . Чтобы анкета попала в каталог, нужно заполнить профиль и загрузить минимум 3 фото, затем нажать «Отправить на
      проверку» — анкету рассмотрит администратор. Фото проверяются отдельно от остальной анкеты: у каждого фото свой
      статус (Ожидает / Подтверждено / Отклонено), причина отклонения показывается прямо под фото. После отклонения нужно
      нажать «Отправить фото на проверку» ещё раз — тогда отклонённые фото уходят на повторную проверку.
    </>
  ),
};

export default function SupportPage() {
  const { user } = useAuth();
  const chatsHref = user?.role === Role.Performer ? '/cabinet/chats' : '/cabinet/messages';

  const commonSections = [
    {
      title: 'Каталог и поиск',
      body: (
        <>
          Все опубликованные анкеты доступны в{' '}
          <Link href="/catalog" className="text-accent underline-offset-2 hover:underline">
            каталоге
          </Link>{' '}
          — там можно фильтровать по городу, типажу и другим параметрам. В каталог попадают только анкеты, прошедшие
          проверку администратором.
        </>
      ),
    },
    {
      title: 'Аккаунт и личный кабинет',
      body: user ? (
        <>
          Профиль, чаты и остальные разделы доступны в{' '}
          <Link href="/cabinet" className="text-accent underline-offset-2 hover:underline">
            личном кабинете
          </Link>
          .
        </>
      ) : (
        <>
          Вход и регистрация — на странице{' '}
          <Link href="/login" className="text-accent underline-offset-2 hover:underline">
            входа
          </Link>
          . После входа профиль, чаты и остальные разделы доступны в личном кабинете.
        </>
      ),
    },
    {
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
    },
    {
      title: 'Отзывы и жалобы',
      body: (
        <>
          Клиенты могут оставить отзыв (оценка и текст) на странице анкеты — он публикуется после проверки модератором.
          Если отзыв, сообщение, анкета или пользователь нарушают правила — на них можно пожаловаться кнопкой
          «Пожаловаться», жалобу рассмотрит администратор.
        </>
      ),
    },
  ];

  const sections = user?.role === Role.Performer ? [PERFORMER_SECTION, ...commonSections] : commonSections;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-16 md:py-24">
        <div className="card p-6 md:p-10">
          <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-[0.2em] text-accent">Справка</p>
          <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">Как пользоваться платформой</h1>

          <ul className="space-y-8">
            {sections.map((s) => (
              <li key={s.title}>
                <h2 className="mb-2 font-display text-base font-semibold text-white">{s.title}</h2>
                <p className="font-body text-sm leading-relaxed text-white/55">{s.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-white/[0.06] pt-8">
            <h2 className="mb-2 font-display text-base font-semibold text-white">Связь с нами</h2>
            <p className="font-body text-sm leading-relaxed text-white/55">
              Если вопрос не удалось решить из справки выше — напишите нам, и мы ответим как можно скорее.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30"
            >
              <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
