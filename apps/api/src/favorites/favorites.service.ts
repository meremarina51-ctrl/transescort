import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte } from 'drizzle-orm';
import { favoriteEvents, favorites, listings, type Listing } from '@transescort/db';

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

  /** Logs an 'added' event only on a genuine new favorite — re-adding an already-favorited anketa is a no-op, not a second event. */
  async add(userId: string, listingId: string): Promise<void> {
    const found = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!found[0]) throw new NotFoundException('Анкета не найдена');

    const inserted = await this.db.insert(favorites).values({ userId, listingId }).onConflictDoNothing().returning();
    if (inserted.length > 0) {
      await this.db.insert(favoriteEvents).values({ userId, listingId, action: 'added' });
    }
  }

  /** Logs a 'removed' event only if it was actually favorited — no event for removing something that wasn't there. */
  async remove(userId: string, listingId: string): Promise<void> {
    const deleted = await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
      .returning();
    if (deleted.length > 0) {
      await this.db.insert(favoriteEvents).values({ userId, listingId, action: 'removed' });
    }
  }

  /** Performer: favorites analytics for their own anketa — current count plus add/remove activity over rolling windows. */
  async getStatsForListing(
    listingId: string,
  ): Promise<{ current: number; added7Days: number; added30Days: number; removed7Days: number; removed30Days: number }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [currentRow, added7Row, added30Row, removed7Row, removed30Row] = await Promise.all([
      this.db.select({ value: count() }).from(favorites).where(eq(favorites.listingId, listingId)),
      this.db
        .select({ value: count() })
        .from(favoriteEvents)
        .where(and(eq(favoriteEvents.listingId, listingId), eq(favoriteEvents.action, 'added'), gte(favoriteEvents.createdAt, sevenDaysAgo))),
      this.db
        .select({ value: count() })
        .from(favoriteEvents)
        .where(and(eq(favoriteEvents.listingId, listingId), eq(favoriteEvents.action, 'added'), gte(favoriteEvents.createdAt, thirtyDaysAgo))),
      this.db
        .select({ value: count() })
        .from(favoriteEvents)
        .where(and(eq(favoriteEvents.listingId, listingId), eq(favoriteEvents.action, 'removed'), gte(favoriteEvents.createdAt, sevenDaysAgo))),
      this.db
        .select({ value: count() })
        .from(favoriteEvents)
        .where(and(eq(favoriteEvents.listingId, listingId), eq(favoriteEvents.action, 'removed'), gte(favoriteEvents.createdAt, thirtyDaysAgo))),
    ]);

    return {
      current: Number(currentRow[0]?.value ?? 0),
      added7Days: Number(added7Row[0]?.value ?? 0),
      added30Days: Number(added30Row[0]?.value ?? 0),
      removed7Days: Number(removed7Row[0]?.value ?? 0),
      removed30Days: Number(removed30Row[0]?.value ?? 0),
    };
  }
}
