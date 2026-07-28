import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { listings, type Listing, type NewListing } from '@transescort/db';

@Injectable()
export class ListingsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async findByUserId(userId: string): Promise<Listing | null> {
    const found = await this.db.select().from(listings).where(eq(listings.userId, userId)).limit(1);
    return found[0] || null;
  }

  async upsert(userId: string, data: Partial<NewListing>): Promise<Listing> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      const updated = await this.db
        .update(listings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(listings.userId, userId))
        .returning();
      return updated[0];
    }

    const inserted = await this.db
      .insert(listings)
      .values({ userId, ...data })
      .returning();
    return inserted[0];
  }

  async addPhotos(userId: string, urls: string[]): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    const photos = [...(existing.photos ?? []), ...urls];
    const updated = await this.db
      .update(listings)
      .set({ photos, updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  async removePhoto(userId: string, url: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    const photos = (existing.photos ?? []).filter((p) => p !== url);
    const updated = await this.db
      .update(listings)
      .set({ photos, updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  async setVideo(userId: string, url: string | null): Promise<Listing> {
    await this.requireByUserId(userId);
    const updated = await this.db
      .update(listings)
      .set({ videoUrl: url, updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  private async requireByUserId(userId: string): Promise<Listing> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Сначала создайте анкету');
    }
    return existing;
  }
}
