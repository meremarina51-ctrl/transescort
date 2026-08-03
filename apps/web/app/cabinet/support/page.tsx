'use client';

import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Поддержка</h1>

      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <LifeBuoy className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Раздел в разработке</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Здесь появится обращение в поддержку и ответы на частые вопросы.
        </p>
      </div>
    </>
  );
}
