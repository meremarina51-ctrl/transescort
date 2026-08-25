import { CatalogListing } from "@/app/catalog/catalog.types";
import { apiUrl } from "@/lib/api-url";
import { ListingDetail } from "@/lib/listing.types";

export async function getListing(slug: string): Promise<ListingDetail | null> {
  try {
    const res = await fetch(apiUrl(`/catalog/${slug}`), { cache: 'no-store' });
    
    if (!res.ok) return null;
    
    return res.json();
  } catch {
    return null;
  }
};

export async function getLatestListings(): Promise<CatalogListing[]> {
  try {
    const res = await fetch(apiUrl('/catalog'), { cache: 'no-store' });
    
    if (!res.ok) return [];
    
    const listings: CatalogListing[] = await res.json();
    
    return listings.slice(0, 5);
  } catch {
    return [];
  }
};
