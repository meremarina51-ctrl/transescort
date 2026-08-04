import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { favorites, listings, type Listing } from '@transescort/db';

@Injectable()
export class FavoritesService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async listIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ listingId: favorites.listingId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return rows.map((r: { listingId: string }) => r.listingId);
  }

  async listListings(userId: string): Promise<Listing[]> {
    const rows = await this.db
      .select({ listing: listings })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return rows.map((r: { listing: Listing }) => r.listing);
  }

  async add(userId: string, listingId: string): Promise<void> {
    const found = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!found[0]) throw new NotFoundException('Анкета не найдена');

    await this.db.insert(favorites).values({ userId, listingId }).onConflictDoNothing();
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
  }
}
