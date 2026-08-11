import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { listings, reviews, users, type NewReview, type Review } from '@transescort/db';

export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  createdAt: Date;
}

export interface ListingReviewsSummary {
  items: PublicReview[];
  count: number;
  averageRating: number;
}

export interface OwnReview extends Review {
  listingName: string | null;
  listingSlug: string | null;
}

export interface AdminReview extends Review {
  authorLogin: string | null;
  authorFullName: string | null;
  listingName: string | null;
  listingSlug: string | null;
}

function toPublicReview(row: { review: Review }): PublicReview {
  return {
    id: row.review.id,
    rating: row.review.rating,
    text: row.review.text,
    authorName: 'Клиент',
    createdAt: row.review.createdAt,
  };
}

@Injectable()
export class ReviewsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /** Client: leave a review — always starts `pending`, invisible publicly until an admin approves it. */
  async create(authorId: string, listingId: string, rating: number, text: string): Promise<Review> {
    const listingRows = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listingRows[0]) throw new NotFoundException('Анкета не найдена');

    const existing = await this.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.authorId, authorId), eq(reviews.listingId, listingId)))
      .limit(1);
    if (existing[0]) {
      throw new ConflictException('Вы уже оставляли отзыв на эту анкету — удалите его в «Моих отзывах», чтобы оставить новый');
    }

    const value: NewReview = { listingId, authorId, rating, text, status: 'pending' };
    const inserted = await this.db.insert(reviews).values(value).returning();
    return inserted[0];
  }

  /** Public anketa page — published reviews only, newest first, plus the aggregate rating. Author identity is never exposed. */
  async listPublishedForListing(listingId: string): Promise<ListingReviewsSummary> {
    const rows = await this.db
      .select({ review: reviews })
      .from(reviews)
      .where(and(eq(reviews.listingId, listingId), eq(reviews.status, 'published')))
      .orderBy(desc(reviews.createdAt));

    const items = rows.map(toPublicReview);
    const count = items.length;
    const averageRating = count ? items.reduce((sum: number, r: PublicReview) => sum + r.rating, 0) / count : 0;
    return { items, count, averageRating };
  }

  /** Client: their own reviews across every anketa, any status — for "Мои отзывы". */
  async listMine(authorId: string): Promise<OwnReview[]> {
    const rows = await this.db
      .select({ review: reviews, listingName: listings.name, listingSlug: listings.slug })
      .from(reviews)
      .leftJoin(listings, eq(reviews.listingId, listings.id))
      .where(eq(reviews.authorId, authorId))
      .orderBy(desc(reviews.createdAt));

    return rows.map((r: { review: Review; listingName: string | null; listingSlug: string | null }) => ({
      ...r.review,
      listingName: r.listingName,
      listingSlug: r.listingSlug,
    }));
  }

  /** Performer: published reviews left on their own anketa — read-only, no moderation actions here. */
  async listPublishedForOwner(listingId: string): Promise<ListingReviewsSummary> {
    return this.listPublishedForListing(listingId);
  }

  async removeOwn(authorId: string, id: string): Promise<void> {
    const rows = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    const review = rows[0];
    if (!review) throw new NotFoundException('Отзыв не найден');
    if (review.authorId !== authorId) throw new ForbiddenException('Это не ваш отзыв');

    await this.db.delete(reviews).where(eq(reviews.id, id));
  }

  /** Admin: every review regardless of status, with author + anketa context for display. */
  async listAllForAdmin(): Promise<AdminReview[]> {
    const rows = await this.db
      .select({
        review: reviews,
        authorLogin: users.login,
        authorFullName: users.fullName,
        listingName: listings.name,
        listingSlug: listings.slug,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.authorId, users.id))
      .leftJoin(listings, eq(reviews.listingId, listings.id))
      .orderBy(desc(reviews.createdAt));

    return rows.map(
      (r: {
        review: Review;
        authorLogin: string | null;
        authorFullName: string | null;
        listingName: string | null;
        listingSlug: string | null;
      }) => ({
        ...r.review,
        authorLogin: r.authorLogin,
        authorFullName: r.authorFullName,
        listingName: r.listingName,
        listingSlug: r.listingSlug,
      }),
    );
  }

  private async requireById(id: string): Promise<Review> {
    const rows = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException('Отзыв не найден');
    return rows[0];
  }

  /** Admin decision on a pending review: publishes it, or sends it back rejected with a required reason. */
  async verify(id: string, decision: 'approved' | 'rejected', note?: string): Promise<Review> {
    const existing = await this.requireById(id);
    if (existing.status !== 'pending') {
      throw new BadRequestException('Решение можно принять только по отзыву на модерации');
    }

    const patch =
      decision === 'approved'
        ? { status: 'published' as const, moderatorNote: null }
        : { status: 'rejected' as const, moderatorNote: note ?? null };

    const updated = await this.db.update(reviews).set({ ...patch, updatedAt: new Date() }).where(eq(reviews.id, id)).returning();
    return updated[0];
  }

  /** Admin: pulls an already-published review off the anketa page (policy violation etc). */
  async hide(id: string): Promise<Review> {
    const existing = await this.requireById(id);
    if (existing.status !== 'published') {
      throw new BadRequestException('Скрыть можно только опубликованный отзыв');
    }
    const updated = await this.db
      .update(reviews)
      .set({ status: 'hidden', updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated[0];
  }

  async unhide(id: string): Promise<Review> {
    const existing = await this.requireById(id);
    if (existing.status !== 'hidden') {
      throw new BadRequestException('Отзыв не скрыт');
    }
    const updated = await this.db
      .update(reviews)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated[0];
  }

  async adminDelete(id: string): Promise<void> {
    await this.requireById(id);
    await this.db.delete(reviews).where(eq(reviews.id, id));
  }
}
