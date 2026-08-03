'use client';

import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Сообщения</h1>

      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <MessageCircle className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Раздел в разработке</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Здесь появится переписка с исполнителями.
        </p>
      </div>
    </>
  );
}
