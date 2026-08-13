import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import { createHash } from 'crypto';
import {
  contactEvents,
  listingPhotoReviews,
  listingViews,
  listings,
  users,
  type ContactEventAction,
  type Listing,
  type ListingPhotoReviewStatus,
  type NewListing,
} from '@transescort/db';
import { slugify } from './slug.util';

export interface ListingWithOwner extends Listing {
  ownerLogin: string | null;
  ownerFullName: string | null;
  ownerTelegramUsername: string | null;
  ownerTelegramLinked: boolean;
}

export interface PhotoReview {
  url: string;
  status: ListingPhotoReviewStatus;
  note: string | null;
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

  /**
   * Public anketa page — only if it's actually published. Includes the owner's login (to start a
   * platform chat) and whether they've linked Telegram (gates the "Написать в Telegram" option).
   */
  async findPublishedBySlug(
    slug: string,
  ): Promise<(Listing & { ownerLogin: string | null; ownerTelegramLinked: boolean }) | null> {
    const rows = await this.db
      .select({ listing: listings, ownerLogin: users.login, ownerTelegramId: users.telegramId })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.slug, slug), eq(listings.status, 'published')))
      .limit(1);
    if (!rows[0]) return null;
    return { ...rows[0].listing, ownerLogin: rows[0].ownerLogin, ownerTelegramLinked: Boolean(rows[0].ownerTelegramId) };
  }

  private static hashViewer(ip: string): string {
    return createHash('sha256').update(ip || 'unknown').digest('hex');
  }

  /**
   * Public: records one (listing, visitor, day) view. Idempotent by design — the unique index on
   * (listingId, viewerHash, viewDate) means repeated page loads from the same visitor on the same day
   * insert nothing further. Best-effort: view tracking must never break the page load.
   */
  async recordView(listingId: string, ip: string): Promise<void> {
    try {
      const viewerHash = ListingsService.hashViewer(ip);
      const viewDate = new Date().toISOString().slice(0, 10);
      await this.db.insert(listingViews).values({ listingId, viewerHash, viewDate }).onConflictDoNothing();
    } catch {
      // best-effort — swallow and move on
    }
  }

  /** Performer: view counts for their own anketa — total, rolling 7/30-day windows, and a daily breakdown for the last 30 days (zero-filled, for charting). */
  async getViewStats(
    userId: string,
  ): Promise<{ totalViews: number; last7Days: number; last30Days: number; daily: { date: string; count: number }[] }> {
    const existing = await this.requireByUserId(userId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [totalRow, last7Row, last30Row, dailyRows] = await Promise.all([
      this.db.select({ value: count() }).from(listingViews).where(eq(listingViews.listingId, existing.id)),
      this.db
        .select({ value: count() })
        .from(listingViews)
        .where(and(eq(listingViews.listingId, existing.id), gte(listingViews.viewDate, sevenDaysAgo))),
      this.db
        .select({ value: count() })
        .from(listingViews)
        .where(and(eq(listingViews.listingId, existing.id), gte(listingViews.viewDate, thirtyDaysAgo))),
      this.db
        .select({ date: listingViews.viewDate, value: count() })
        .from(listingViews)
        .where(and(eq(listingViews.listingId, existing.id), gte(listingViews.viewDate, thirtyDaysAgo)))
        .groupBy(listingViews.viewDate),
    ]);

    const countByDate = new Map<string, number>(
      dailyRows.map((r: { date: string; value: number }) => [r.date, Number(r.value)]),
    );
    const daily: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      daily.push({ date, count: countByDate.get(date) ?? 0 });
    }

    return {
      totalViews: Number(totalRow[0]?.value ?? 0),
      last7Days: Number(last7Row[0]?.value ?? 0),
      last30Days: Number(last30Row[0]?.value ?? 0),
      daily,
    };
  }

  /**
   * Public: logs one "Связаться" action — `click` when the contact modal opens, `platform`/`telegram`
   * when a channel is picked. Never deduped (see schema comment) and best-effort, like `recordView`.
   */
  async recordContactEvent(listingId: string, action: ContactEventAction): Promise<void> {
    try {
      await this.db.insert(contactEvents).values({ listingId, action });
    } catch {
      // best-effort — swallow and move on
    }
  }

  /** Performer: "Связаться" activity for their own anketa — total clicks, rolling windows, and channel breakdown. */
  async getContactStats(
    userId: string,
  ): Promise<{ totalClicks: number; last7Days: number; last30Days: number; platformSelected: number; telegramSelected: number }> {
    const existing = await this.requireByUserId(userId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalRow, last7Row, last30Row, platformRow, telegramRow] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(contactEvents)
        .where(and(eq(contactEvents.listingId, existing.id), eq(contactEvents.action, 'click'))),
      this.db
        .select({ value: count() })
        .from(contactEvents)
        .where(
          and(eq(contactEvents.listingId, existing.id), eq(contactEvents.action, 'click'), gte(contactEvents.createdAt, sevenDaysAgo)),
        ),
      this.db
        .select({ value: count() })
        .from(contactEvents)
        .where(
          and(eq(contactEvents.listingId, existing.id), eq(contactEvents.action, 'click'), gte(contactEvents.createdAt, thirtyDaysAgo)),
        ),
      this.db
        .select({ value: count() })
        .from(contactEvents)
        .where(and(eq(contactEvents.listingId, existing.id), eq(contactEvents.action, 'platform'))),
      this.db
        .select({ value: count() })
        .from(contactEvents)
        .where(and(eq(contactEvents.listingId, existing.id), eq(contactEvents.action, 'telegram'))),
    ]);

    return {
      totalClicks: Number(totalRow[0]?.value ?? 0),
      last7Days: Number(last7Row[0]?.value ?? 0),
      last30Days: Number(last30Row[0]?.value ?? 0),
      platformSelected: Number(platformRow[0]?.value ?? 0),
      telegramSelected: Number(telegramRow[0]?.value ?? 0),
    };
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

  /**
   * Adding photos changes what's shown — a newly added photo has no review yet (implicitly
   * "pending"), so the anketa's overall "photos verified" mark naturally drops until it's checked.
   * Already-confirmed existing photos keep their individual status; only the new one needs review.
   * Clears `photosSubmittedAt` — the changed set needs a fresh explicit submission before it can
   * reappear in the admin moderation queue.
   */
  async addPhotos(userId: string, urls: string[]): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    const photos = [...(existing.photos ?? []), ...urls];
    await this.db
      .update(listings)
      .set({ photos, photosSubmittedAt: null, updatedAt: new Date() })
      .where(eq(listings.userId, userId));
    return this.recomputePhotosVerified(existing.id);
  }

  /** Removing a photo drops its review record; the overall mark is recomputed from whatever remains. */
  async removePhoto(userId: string, url: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    const photos = (existing.photos ?? []).filter((p) => p !== url);
    await this.db
      .update(listings)
      .set({ photos, photosSubmittedAt: null, updatedAt: new Date() })
      .where(eq(listings.userId, userId));
    await this.db
      .delete(listingPhotoReviews)
      .where(and(eq(listingPhotoReviews.listingId, existing.id), eq(listingPhotoReviews.url, url)));
    return this.recomputePhotosVerified(existing.id);
  }

  /**
   * Performer: explicitly submit the current photo set for admin review — requires at least
   * MIN_PHOTOS_FOR_REVIEW. Any photo previously rejected is reset back to "pending" — clicking this
   * button is how the performer asks for a fresh look, whether or not they've replaced the photo.
   */
  async submitPhotosForReview(userId: string): Promise<Listing> {
    const existing = await this.requireByUserId(userId);
    if ((existing.photos ?? []).length < MIN_PHOTOS_FOR_REVIEW) {
      throw new BadRequestException(`Добавьте не менее ${MIN_PHOTOS_FOR_REVIEW} фото перед отправкой на проверку`);
    }

    await this.db
      .update(listingPhotoReviews)
      .set({ status: 'pending', note: null, reviewedAt: null, updatedAt: new Date() })
      .where(and(eq(listingPhotoReviews.listingId, existing.id), eq(listingPhotoReviews.status, 'rejected')));

    const updated = await this.db
      .update(listings)
      .set({ photosSubmittedAt: new Date(), updatedAt: new Date() })
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

  private static readonly ADMIN_OWNER_SELECT = {
    listing: listings,
    ownerLogin: users.login,
    ownerFullName: users.fullName,
    ownerTelegramUsername: users.telegramUsername,
    ownerTelegramLinkedAt: users.telegramLinkedAt,
  };

  private static toListingWithOwner(row: {
    listing: Listing;
    ownerLogin: string | null;
    ownerFullName: string | null;
    ownerTelegramUsername: string | null;
    ownerTelegramLinkedAt: Date | null;
  }): ListingWithOwner {
    return {
      ...row.listing,
      ownerLogin: row.ownerLogin,
      ownerFullName: row.ownerFullName,
      ownerTelegramUsername: row.ownerTelegramUsername,
      ownerTelegramLinked: Boolean(row.ownerTelegramLinkedAt),
    };
  }

  /** Admin: every anketa regardless of status, with the owner's login and Telegram connection for display. */
  async listAllForAdmin(): Promise<ListingWithOwner[]> {
    const rows = await this.db
      .select(ListingsService.ADMIN_OWNER_SELECT)
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .orderBy(desc(listings.updatedAt));

    return rows.map(ListingsService.toListingWithOwner);
  }

  async findByIdForAdmin(id: string): Promise<ListingWithOwner | null> {
    const rows = await this.db
      .select(ListingsService.ADMIN_OWNER_SELECT)
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return ListingsService.toListingWithOwner(rows[0]);
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

  /** Per-photo review state for every photo currently on the anketa — a photo with no row is implicitly "pending". */
  async getPhotoReviews(id: string): Promise<PhotoReview[]> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    return this.loadPhotoReviews(id, existing.photos ?? []);
  }

  /** Performer: per-photo review state for their own anketa — so a rejected photo's reason is visible to them. */
  async getPhotoReviewsForUser(userId: string): Promise<PhotoReview[]> {
    const existing = await this.requireByUserId(userId);
    return this.loadPhotoReviews(existing.id, existing.photos ?? []);
  }

  /**
   * Admin: confirm or reject one specific photo — a reason is required when rejecting, shown to the
   * performer. A rejection also clears `photosSubmittedAt`, so the performer's "Отправить фото на
   * проверку" button re-enables — that click is what sends a rejected photo back for re-verification.
   */
  async reviewPhoto(id: string, url: string, decision: 'confirmed' | 'rejected', note?: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    if (!(existing.photos ?? []).includes(url)) {
      throw new BadRequestException('Это фото не относится к анкете');
    }
    if (decision === 'rejected' && !note?.trim()) {
      throw new BadRequestException('Укажите причину отклонения');
    }

    await this.upsertPhotoReview(id, url, decision, decision === 'rejected' ? note!.trim() : null);
    if (decision === 'rejected') {
      await this.db.update(listings).set({ photosSubmittedAt: null }).where(eq(listings.id, id));
    }
    return this.recomputePhotosVerified(id);
  }

  /**
   * Admin: bulk confirm/reject — only touches photos not already confirmed, so a bulk "reject all" can
   * never undo an earlier per-photo confirmation. Same `photosSubmittedAt` reset as `reviewPhoto` when
   * rejecting.
   */
  async reviewAllPhotos(id: string, decision: 'confirmed' | 'rejected', note?: string): Promise<Listing> {
    const existing = await this.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');
    const photos = existing.photos ?? [];
    if (photos.length === 0) throw new BadRequestException('У анкеты нет фото');
    if (decision === 'rejected' && !note?.trim()) {
      throw new BadRequestException('Укажите причину отклонения');
    }

    const reviews = await this.loadPhotoReviews(id, photos);
    const targets = reviews.filter((r) => r.status !== 'confirmed').map((r) => r.url);

    const trimmedNote = decision === 'rejected' ? note!.trim() : null;
    for (const url of targets) {
      await this.upsertPhotoReview(id, url, decision, trimmedNote);
    }
    if (decision === 'rejected' && targets.length > 0) {
      await this.db.update(listings).set({ photosSubmittedAt: null }).where(eq(listings.id, id));
    }
    return this.recomputePhotosVerified(id);
  }

  private async upsertPhotoReview(
    listingId: string,
    url: string,
    status: ListingPhotoReviewStatus,
    note: string | null,
  ): Promise<void> {
    await this.db
      .insert(listingPhotoReviews)
      .values({ listingId, url, status, note, reviewedAt: new Date() })
      .onConflictDoUpdate({
        target: [listingPhotoReviews.listingId, listingPhotoReviews.url],
        set: { status, note, reviewedAt: new Date(), updatedAt: new Date() },
      });
  }

  private async loadPhotoReviews(listingId: string, photos: string[]): Promise<PhotoReview[]> {
    if (photos.length === 0) return [];
    const rows = await this.db
      .select({ url: listingPhotoReviews.url, status: listingPhotoReviews.status, note: listingPhotoReviews.note })
      .from(listingPhotoReviews)
      .where(and(eq(listingPhotoReviews.listingId, listingId), inArray(listingPhotoReviews.url, photos)));
    const byUrl = new Map<string, { url: string; status: ListingPhotoReviewStatus; note: string | null }>(
      rows.map((r: { url: string; status: ListingPhotoReviewStatus; note: string | null }) => [r.url, r]),
    );

    return photos.map((url) => {
      const row = byUrl.get(url);
      return { url, status: row?.status ?? 'pending', note: row?.note ?? null };
    });
  }

  /** Recomputes and persists the cached `photosVerified` flag: true only when every current photo is individually confirmed. */
  private async recomputePhotosVerified(listingId: string): Promise<Listing> {
    const rows = await this.db.select({ photos: listings.photos }).from(listings).where(eq(listings.id, listingId)).limit(1);
    const photos: string[] = rows[0]?.photos ?? [];
    const reviews = await this.loadPhotoReviews(listingId, photos);
    const allConfirmed = photos.length > 0 && reviews.every((r) => r.status === 'confirmed');
    return this.updateById(listingId, { photosVerified: allConfirmed });
  }

  /**
   * Admin: every anketa with at least one photo, no "photos verified" mark, and an explicit performer
   * submission (`photosSubmittedAt` set), regardless of `status` — covers both a fresh submission and
   * photos added/changed on an already-published anketa (which stays live in the catalog; this is
   * purely a worklist for the photo check, not a publish gate). A draft with unsubmitted photos never
   * appears here — see `submitPhotosForReview`. Includes each anketa's per-photo review state so the
   * moderation queue can render individual confirm/reject actions without a separate request per card.
   */
  async listUnverifiedPhotos(): Promise<(ListingWithOwner & { photoReviews: PhotoReview[] })[]> {
    const rows = await this.db
      .select(ListingsService.ADMIN_OWNER_SELECT)
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.photosVerified, false), isNotNull(listings.photosSubmittedAt)))
      .orderBy(desc(listings.updatedAt));

    const withOwner = rows.map(ListingsService.toListingWithOwner).filter((l: ListingWithOwner) => l.photos.length > 0);
    if (withOwner.length === 0) return [];

    const listingIds = withOwner.map((l: ListingWithOwner) => l.id);
    const reviewRows = await this.db
      .select({
        listingId: listingPhotoReviews.listingId,
        url: listingPhotoReviews.url,
        status: listingPhotoReviews.status,
        note: listingPhotoReviews.note,
      })
      .from(listingPhotoReviews)
      .where(inArray(listingPhotoReviews.listingId, listingIds));

    const byListing = new Map<string, Map<string, { status: ListingPhotoReviewStatus; note: string | null }>>();
    for (const r of reviewRows as { listingId: string; url: string; status: ListingPhotoReviewStatus; note: string | null }[]) {
      if (!byListing.has(r.listingId)) byListing.set(r.listingId, new Map());
      byListing.get(r.listingId)!.set(r.url, { status: r.status, note: r.note });
    }

    return withOwner.map((l: ListingWithOwner) => ({
      ...l,
      photoReviews: l.photos.map((url) => {
        const row = byListing.get(l.id)?.get(url);
        return { url, status: row?.status ?? 'pending', note: row?.note ?? null };
      }),
    }));
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
