import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { listings, users, type Listing, type NewListing } from '@transescort/db';
import { slugify } from './slug.util';

export interface ListingWithOwner extends Listing {
  ownerLogin: string | null;
  ownerFullName: string | null;
}

/** Minimum photos required before a performer can send the anketa for admin review. */
export const MIN_PHOTOS_FOR_REVIEW = 3;

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

  /** Public anketa page — only if it's actually published. Includes the owner's login so the client can start a chat. */
  async findPublishedBySlug(slug: string): Promise<(Listing & { ownerLogin: string | null }) | null> {
    const rows = await this.db
      .select({ listing: listings, ownerLogin: users.login })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.slug, slug), eq(listings.status, 'published')))
      .limit(1);
    if (!rows[0]) return null;
    return { ...rows[0].listing, ownerLogin: rows[0].ownerLogin };
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

  /**
   * Persists a performer-chosen photo order — index 0 is the implicit "main photo" used everywhere
   * (catalog cards, gallery, favorites). `orderedUrls` must be an exact permutation of the existing
   * `photos` array; this never touches verificationStatus since the photo content itself is unchanged.
   */
  async reorderPhotos(userId: string, orderedUrls: string[]): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    const current = existing.photos ?? [];
    const isPermutation =
      orderedUrls.length === current.length &&
      new Set(orderedUrls).size === current.length &&
      current.every((url) => orderedUrls.includes(url));

    if (!isPermutation) {
      throw new BadRequestException('Список фото должен содержать те же фото анкеты без изменений содержимого');
    }

    const updated = await this.db
      .update(listings)
      .set({ photos: orderedUrls, updatedAt: new Date() })
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

  /** Admin: every anketa regardless of status, with the owner's login for display. */
  async listAllForAdmin(): Promise<ListingWithOwner[]> {
    const rows = await this.db
      .select({ listing: listings, ownerLogin: users.login, ownerFullName: users.fullName })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .orderBy(desc(listings.updatedAt));

    return rows.map((r: { listing: Listing; ownerLogin: string | null; ownerFullName: string | null }) => ({
      ...r.listing,
      ownerLogin: r.ownerLogin,
      ownerFullName: r.ownerFullName,
    }));
  }

  async findByIdForAdmin(id: string): Promise<ListingWithOwner | null> {
    const rows = await this.db
      .select({ listing: listings, ownerLogin: users.login, ownerFullName: users.fullName })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return { ...rows[0].listing, ownerLogin: rows[0].ownerLogin, ownerFullName: rows[0].ownerFullName };
  }

  async updateById(id: string, data: Partial<NewListing>): Promise<Listing> {
    const updated = await this.db
      .update(listings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated[0];
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(listings).where(eq(listings.id, id));
  }

  /** Performer: submit the anketa for admin verification — does not publish it by itself. */
  async submitForReview(userId: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    if (existing.status !== 'draft' && existing.status !== 'changes_requested') {
      throw new BadRequestException(
        'Отправить на проверку можно только черновик или анкету с запрошенными исправлениями',
      );
    }
    if ((existing.photos ?? []).length < MIN_PHOTOS_FOR_REVIEW) {
      throw new BadRequestException(`Добавьте не менее ${MIN_PHOTOS_FOR_REVIEW} фото перед отправкой на проверку`);
    }

    const updated = await this.db
      .update(listings)
      .set({ status: 'pending', submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  /** Performer: pulls their own published anketa out of the catalog — keeps its approval, no re-review to restore. */
  async hide(userId: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    if (existing.status !== 'published') {
      throw new BadRequestException('Скрыть можно только опубликованную анкету');
    }
    const updated = await this.db
      .update(listings)
      .set({ status: 'hidden', updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  /** Performer: restores their own hidden anketa back to the catalog. */
  async unhide(userId: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    if (existing.status !== 'hidden') {
      throw new BadRequestException('Анкета не скрыта');
    }
    const updated = await this.db
      .update(listings)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(listings.userId, userId))
      .returning();
    return updated[0];
  }

  /** Admin: same as `hide`, but by listing id. */
  async adminHide(id: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    if (existing.status !== 'published') {
      throw new BadRequestException('Скрыть можно только опубликованную анкету');
    }
    return this.updateById(id, { status: 'hidden' });
  }

  /** Admin: same as `unhide`, but by listing id. */
  async adminUnhide(id: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    if (existing.status !== 'hidden') {
      throw new BadRequestException('Анкета не скрыта');
    }
    return this.updateById(id, { status: 'published' });
  }

  /** Admin: blocks an anketa for a policy violation — a reason is always required and shown to the performer. */
  async block(id: string, note: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    if (existing.status === 'blocked') {
      throw new BadRequestException('Анкета уже заблокирована');
    }
    return this.updateById(id, { status: 'blocked', verificationNote: note });
  }

  /** Admin: lifts a block — sends the anketa back to draft, so the performer must resubmit for a fresh review. */
  async unblock(id: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    if (existing.status !== 'blocked') {
      throw new BadRequestException('Анкета не заблокирована');
    }
    return this.updateById(id, { status: 'draft', verificationNote: null });
  }

  /** Admin: anketas awaiting a verification decision, oldest submission first. */
  async listModerationQueue(): Promise<ListingWithOwner[]> {
    const rows = await this.db
      .select({ listing: listings, ownerLogin: users.login, ownerFullName: users.fullName })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.status, 'pending'))
      .orderBy(listings.submittedAt);

    return rows.map((r: { listing: Listing; ownerLogin: string | null; ownerFullName: string | null }) => ({
      ...r.listing,
      ownerLogin: r.ownerLogin,
      ownerFullName: r.ownerFullName,
    }));
  }

  /**
   * Admin decision on a pending anketa:
   * - approved — publishes it (and marks it as having ever been published).
   * - changes_requested — sends it back to the performer with a required note.
   */
  async verify(id: string, decision: 'approved' | 'changes_requested', note?: string): Promise<Listing> {
    const patch: Partial<NewListing> =
      decision === 'approved'
        ? { status: 'published', everPublished: true, verificationNote: null }
        : { status: 'changes_requested', verificationNote: note ?? null };

    const updated = await this.db
      .update(listings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated[0];
  }
}
