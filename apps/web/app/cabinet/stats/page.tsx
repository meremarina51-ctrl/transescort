'use client';

import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Статистика</h1>

      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <BarChart3 className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Раздел в разработке</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Здесь появятся просмотры анкеты, покупки контактов и доход.
        </p>
      </div>
    </>
  );
}
