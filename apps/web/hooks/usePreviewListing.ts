import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { parseBody } from '@/lib/parse-body';
import type { ListingReviewsSummary, PreviewListing } from '@/lib/listing.types';

const EMPTY_REVIEWS: ListingReviewsSummary = { items: [], count: 0, averageRating: 0 };

/** Loads the performer's own listing + its reviews for the /preview page. errorMessage is 'no-listing' when the performer hasn't created one yet. */
export function usePreviewListing() {
  const [listing, setListing] = useState<PreviewListing | null>(null);
  const [reviews, setReviews] = useState<ListingReviewsSummary>(EMPTY_REVIEWS);
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/listings/me');
        const data = res.ok ? await parseBody(res) : null;

        if (!data) {
          setErrorMessage('no-listing');
          return;
        }

        setListing(data);

        const reviewsRes = await authFetch(`/reviews/listing/${data.id}`);
        if (reviewsRes.ok) {
          setReviews((await parseBody(reviewsRes)) ?? EMPTY_REVIEWS);
        }
      } catch {
        setErrorMessage('Не удалось загрузить анкету');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { listing, reviews, isLoading, errorMessage };
}
