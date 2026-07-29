'use client';

import { useState } from 'react';
import { ImageOff, Play } from 'lucide-react';

type Media = { type: 'photo' | 'video'; url: string };

interface Vital {
  label: string;
  value: string | number;
}

interface Props {
  name: string;
  photos: string[];
  videoUrl: string | null;
  vitals: Vital[];
  bio: string | null;
}

const PLACEHOLDER_COUNT = 6;

export function ListingGallery({ name, photos, videoUrl, vitals, bio }: Props) {
  const media: Media[] = [
    ...photos.map((url): Media => ({ type: 'photo', url })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl } as Media] : []),
  ];
  const [active, setActive] = useState(0);
  const total = media.length;
  const current = media[active];

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="relative h-[60vh] bg-black lg:h-[calc(100vh-4rem)] lg:flex-1">
        {current ? (
          current.type === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={current.url} src={current.url} alt={name} className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video key={current.url} src={current.url} controls className="h-full w-full object-contain" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
            <ImageOff className="h-12 w-12 text-white/15" strokeWidth={1.2} />
          </div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((p) => (p - 1 + total) % total)}
              aria-label="Предыдущее"
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((p) => (p + 1) % total)}
              aria-label="Следующее"
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            >
              ›
            </button>
            <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 font-body text-xs text-white/60">
              {active + 1} / {total}
            </div>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 pt-16">
          <h1 className="mb-1 font-display text-3xl font-extrabold text-white drop-shadow-sm">{name}</h1>
          {vitals.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-white/70">
              {vitals.map((v) => (
                <span key={v.label}>
                  {v.label}: <span className="text-white/90">{v.value}</span>
                </span>
              ))}
            </div>
          )}
          {bio && <p className="mt-2 max-w-lg whitespace-pre-line font-body text-sm text-white/70">{bio}</p>}
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-black p-3 lg:h-[calc(100vh-4rem)] lg:w-[26%] lg:border-l lg:border-t-0">
        <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border-[3px] border-crimson/40 bg-[#161616]">
          <div className="flex-shrink-0 px-4 pb-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-crimson/40 ring-offset-1 ring-offset-[#161616]">
                {photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[0]} alt={name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-bold text-white">{name}</div>
                <div className="font-body text-[11px] text-white/35">
                  {photos.length > 0 ? `${photos.length} фото` : 'Фото'}
                  {videoUrl ? ', 1 видео' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {total > 0 ? (
              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                {media.map((item, i) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`relative aspect-square overflow-hidden transition-opacity ${
                      active === i ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'photo' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-crimson">
                            <Play className="h-3 w-3 fill-current" strokeWidth={0} />
                          </span>
                        </div>
                      </>
                    )}
                    {active === i && <div className="pointer-events-none absolute inset-0 border-2 border-crimson" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center bg-[#161616]">
                    <ImageOff className="h-5 w-5 text-white/15" strokeWidth={1.2} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
