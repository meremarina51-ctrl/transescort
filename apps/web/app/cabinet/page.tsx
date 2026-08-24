'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { PERFORMER_OVERVIEW_TILES, CLIENT_OVERVIEW_TILES, DEFAULT_OVERVIEW_TILES } from './cabinet.constants';
import { Role } from '@/lib/enums';

export default function CabinetOverviewPage() {
  const { user } = useAuth();
  const tiles =
    user?.role === Role.Performer ? PERFORMER_OVERVIEW_TILES : user?.role === Role.Client ? CLIENT_OVERVIEW_TILES : DEFAULT_OVERVIEW_TILES;

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">Привет, {user?.fullName || user?.login}!</h1>
      <p className="mb-6 font-body text-white/40">Здесь собраны все разделы личного кабинета.</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="card group p-6">
            <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
            <h3 className="font-display text-base font-bold transition-colors group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
