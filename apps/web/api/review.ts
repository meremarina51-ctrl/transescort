import { apiUrl } from "@/lib/api-url";
import { ListingReviewsSummary } from "@/lib/listing.types";

const EMPTY_REVIEWS: ListingReviewsSummary = { items: [], count: 0, averageRating: 0 };

export async function getReviews(listingId: string): Promise<ListingReviewsSummary> {
  try {
    const res = await fetch(apiUrl(`/reviews/listing/${listingId}`), { cache: 'no-store' });
    
    if (!res.ok) return EMPTY_REVIEWS;
    
    return res.json();
  } catch {
    return EMPTY_REVIEWS;
  }
};
