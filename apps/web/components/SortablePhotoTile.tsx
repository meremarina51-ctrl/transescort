'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, X } from 'lucide-react';

interface IProps {
  url: string;
  isMain: boolean;
  onRemove: () => void;
  onSetMain: () => void;
}

export function SortablePhotoTile({ url, isMain, onRemove, onSetMain }: IProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-lg border ${
        isMain ? 'border-accent/50' : 'border-white/[0.08]'
      } ${isDragging ? 'z-10 opacity-60' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />

      {isMain ? (
        <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-body text-[10px] font-semibold text-white">
          <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
          Главное
        </span>
      ) : (
        <button
          type="button"
          onClick={onSetMain}
          title="Сделать главным фото"
          className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        >
          <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label="Удалить фото"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div
        {...attributes}
        {...listeners}
        title="Перетащите, чтобы изменить порядок"
        className="absolute bottom-1 right-1 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
