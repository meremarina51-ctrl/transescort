import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { listings, type Listing, type NewListing } from '@transescort/db';
import { slugify } from './slug.util';

@Injectable()
export class ListingsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async findByUserId(userId: string): Promise<Listing | null> {
    const found = await this.db.select().from(listings).where(eq(listings.userId, userId)).limit(1);
    return found[0] || null;
  }

  /** Public catalog feed — published anketas only, newest first. */
  async listPublished(): Promise<Listing[]> {
    return this.db
      .select()
      .from(listings)
      .where(eq(listings.status, 'published'))
      .orderBy(desc(listings.updatedAt));
  }

  /** Public anketa page — only if it's actually published. */
  async findPublishedBySlug(slug: string): Promise<Listing | null> {
    const found = await this.db
      .select()
      .from(listings)
      .where(and(eq(listings.slug, slug), eq(listings.status, 'published')))
      .limit(1);
    return found[0] || null;
  }

  async upsert(userId: string, data: Partial<NewListing>): Promise<Listing> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      const patch: Partial<NewListing> = { ...data, updatedAt: new Date() };
      // Backfills a missing slug (e.g. rows created before this feature) without ever overwriting one already set.
      if (!existing.slug) {
        patch.slug = await this.generateUniqueSlug(data.name ?? existing.name);
      }
      const updated = await this.db
        .update(listings)
        .set(patch)
        .where(eq(listings.userId, userId))
        .returning();
      return updated[0];
    }

    const slug = await this.generateUniqueSlug(data.name);
    const inserted = await this.db
      .insert(listings)
      .values({ userId, slug, ...data })
      .returning();
    return inserted[0];
  }

  /** Slug is derived from the name once, at creation — it stays stable even if the name changes later. */
  private async generateUniqueSlug(name?: string | null): Promise<string> {
    const base = slugify(name) || 'anketa';
    let candidate = base;
    let suffix = 1;

    while (await this.slugTaken(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  private async slugTaken(slug: string): Promise<boolean> {
    const found = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.slug, slug)).limit(1);
    return found.length > 0;
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
