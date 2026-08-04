'use client';

import { Image as ImageIcon } from 'lucide-react';

export default function PhotosPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Фото и видео</h1>

      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <ImageIcon className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Раздел в разработке</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Пока фото и видео анкеты загружаются на странице «Моя анкета» — здесь появится отдельная медиатека.
        </p>
      </div>
    </>
  );
}
