'use client';

import Link from 'next/link';
import { ShieldCheck, Users, UserCog, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { ROUTES } from '@/lib/routes';

const OVERVIEW_TILES: { href: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    href: ROUTES.ADMIN_MODERATION,
    icon: ShieldCheck,
    title: 'Модерация',
    description: 'Анкеты, фото, отзывы и жалобы на рассмотрении',
  },
  {
    href: ROUTES.ADMIN_PERFORMERS,
    icon: Users,
    title: 'Исполнители',
    description: 'Список анкет и их статусы',
  },
  {
    href: ROUTES.ADMIN_USERS,
    icon: UserCog,
    title: 'Пользователи',
    description: 'Аккаунты, доступ и Telegram-бот',
  },
];

export default function AdminOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">Админ-панель, {user?.fullName || user?.login}!</h1>
      <p className="mb-6 font-body text-white/40">Модерация анкет, управление исполнителями и пользователями платформы.</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {OVERVIEW_TILES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="card group p-6">
            <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
            <h3 className="font-display text-base font-bold transition-colors group-hover:text-accent">{title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
