'use client';

import { useEffect, useRef, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface IProps {
  /** Shown image, already resolved — the viewer only navigates within this list. */
  photos: string[];
  /** Index of the image to show; the parent owns it so the clicked slide can stay in sync. */
  index: number;
  alt?: string;
  labels: { close: string; prev: string; next: string };
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Horizontal drag distance that counts as a swipe-to-navigate on touch devices. */
const SWIPE_MIN_PX = 50;

/**
 * Fullscreen photo viewer: darkened blurred backdrop, click-to-close, desktop arrows and
 * keyboard navigation (Esc / ← / →), swipe on touch. Renders nothing for an empty list.
 */
export function Lightbox({ photos, index, alt = '', labels, onIndexChange, onClose }: IProps) {
  const total = photos.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goPrev = () => onIndexChange((index - 1 + total) % total);
  const goNext = () => onIndexChange((index + 1) % total);

  // The viewer covers the page, so freeze background scrolling while it is mounted.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (total > 1 && e.key === 'ArrowLeft') {
        onIndexChange((index - 1 + total) % total);
      } else if (total > 1 && e.key === 'ArrowRight') {
        onIndexChange((index + 1) % total);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, total, onClose, onIndexChange]);

  // Move focus into the dialog so Tab doesn't reach the page hidden behind it.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || total < 2) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Ignore vertical/ambiguous gestures so pinching and page-level scrolling still feel native.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    onIndexChange(dx < 0 ? (index + 1) % total : (index - 1 + total) % total);
  };

  const current = photos[index];
  if (!current) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={current}
        alt={alt}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[92vw] select-none object-contain"
      />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        {total > 1 ? (
          <div className="rounded-full bg-black/60 px-3 py-1 font-body text-xs text-white/70">
            {index + 1} / {total}
          </div>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={labels.close}
          title={labels.close}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label={labels.prev}
            title={labels.prev}
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/75 transition-colors hover:bg-black/85 hover:text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label={labels.next}
            title={labels.next}
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/75 transition-colors hover:bg-black/85 hover:text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}
    </div>
  );
}
