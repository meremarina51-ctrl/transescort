'use client';

import Link from 'next/link';
import { User, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const TILES = [
  {
    href: '/cabinet/profile',
    icon: User,
    title: 'Профиль',
    description: 'Имя, email и данные аккаунта',
  },
  {
    href: '/cabinet/settings',
    icon: Settings,
    title: 'Настройки',
    description: 'Сессия и выход из аккаунта',
  },
] as const;

export default function CabinetOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">Привет, {user?.fullName || user?.email}!</h1>
      <p className="mb-6 font-body text-white/40">Это личный кабинет — добавляйте сюда свои разделы.</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TILES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="card group p-6">
            <Icon className="mb-4 h-9 w-9 text-crimson" strokeWidth={1.4} />
            <h3 className="font-display text-base font-bold transition-colors group-hover:text-crimson">
              {title}
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
