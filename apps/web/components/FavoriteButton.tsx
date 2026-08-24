'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuthOrGuest } from '@/components/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';

/** Heart toggle. By default absolutely positioned top-right, expects a `relative` parent — pass `positionClassName` to override. */
export function FavoriteButton({
  listingId,
  onToggled,
  positionClassName = 'absolute right-3 top-3 z-10',
}: {
  listingId: string;
  /** Fires after a successful toggle — e.g. to drop the card from a local "Избранное" list right away. */
  onToggled?: (active: boolean) => void;
  positionClassName?: string;
}) {
  const router = useRouter();
  const { user } = useAuthOrGuest();
  const { isFavorite, toggle } = useFavorites();

  if (user && user.role !== Role.Client) return null;

  const active = user ? isFavorite(listingId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    await toggle(listingId);
    onToggled?.(!active);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Убрать из избранного' : 'Добавить в избранное'}
      title={active ? 'Убрать из избранного' : 'Добавить в избранное'}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60 ${positionClassName}`}
    >
      <Heart className={`h-5 w-5 transition-colors ${active ? 'fill-accent text-accent' : 'text-white/85'}`} strokeWidth={1.8} />
    </button>
  );
}
