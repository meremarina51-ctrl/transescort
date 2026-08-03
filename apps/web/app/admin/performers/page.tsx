'use client';

import { Users } from 'lucide-react';

export default function AdminPerformersPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Исполнители</h1>

      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <Users className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Раздел в разработке</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Здесь появится список анкет исполнителей с управлением статусом и тарифом.
        </p>
      </div>
    </>
  );
}
