import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import {
  conversations,
  listings,
  messages,
  reports,
  reviews,
  users,
  type NewReport,
  type Report,
  type ReportCategory,
  type ReportTargetType,
} from '@transescort/db';

export interface AdminReportTarget {
  /** Short human-readable label for the admin queue — differs per `targetType`. */
  label: string;
  /** Deep link into the relevant admin screen, when one exists (null for messages — no dedicated chat admin view). */
  href: string | null;
  /** The user this report is ultimately "about" — set for `user` reports (the target itself) and `message` reports (the sender); null for listing/review. Lets the admin queue offer a "restrict messaging" action inline. */
  restrictableUserId: string | null;
  /** Current messaging-restriction status of `restrictableUserId`, when present. */
  messagingRestricted: boolean;
}

export interface AdminReport extends Report {
  reporterLogin: string | null;
  reporterFullName: string | null;
  target: AdminReportTarget;
}

export interface AdminConversationParticipant {
  id: string;
  login: string;
  fullName: string | null;
}

export interface AdminConversationMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

export interface AdminConversationView {
  conversationId: string;
  participants: AdminConversationParticipant[];
  messages: AdminConversationMessage[];
  /** The specific message the report is about — lets the UI highlight it in the thread. */
  reportedMessageId: string;
}

const MISSING_TARGET: AdminReportTarget = { label: 'Объект удалён', href: null, restrictableUserId: null, messagingRestricted: false };

@Injectable()
export class ReportsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /** Client/performer: file a complaint — validates the target exists and, for review/message, that the reporter has standing to report it. */
  async create(reporterId: string, targetType: ReportTargetType, targetId: string, category: ReportCategory, text: string): Promise<Report> {
    switch (targetType) {
      case 'listing': {
        const rows = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.id, targetId)).limit(1);
        if (!rows[0]) throw new NotFoundException('Анкета не найдена');
        break;
      }
      case 'review': {
        const rows = await this.db
          .select({ listingUserId: listings.userId })
          .from(reviews)
          .leftJoin(listings, eq(reviews.listingId, listings.id))
          .where(eq(reviews.id, targetId))
          .limit(1);
        if (!rows[0]) throw new NotFoundException('Отзыв не найден');
        if (rows[0].listingUserId !== reporterId) {
          throw new ForbiddenException('Пожаловаться на отзыв может только исполнитель, к чьей анкете он оставлен');
        }
        break;
      }
      case 'message': {
        const rows = await this.db
          .select({ userAId: conversations.userAId, userBId: conversations.userBId })
          .from(messages)
          .leftJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(eq(messages.id, targetId))
          .limit(1);
        if (!rows[0]) throw new NotFoundException('Сообщение не найдено');
        if (rows[0].userAId !== reporterId && rows[0].userBId !== reporterId) {
          throw new ForbiddenException('Вы не участник этого чата');
        }
        break;
      }
      case 'user': {
        if (targetId === reporterId) throw new BadRequestException('Нельзя пожаловаться на самого себя');
        const rows = await this.db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
        if (!rows[0]) throw new NotFoundException('Пользователь не найден');
        break;
      }
    }

    const value: NewReport = { reporterId, targetType, targetId, category, text, status: 'pending' };
    const inserted = await this.db.insert(reports).values(value).returning();
    return inserted[0];
  }

  /** Admin: every report regardless of status — the moderation queue filters to `pending` client-side. */
  async listAllForAdmin(): Promise<AdminReport[]> {
    const rows: Array<{ report: Report; reporterLogin: string | null; reporterFullName: string | null }> = await this.db
      .select({ report: reports, reporterLogin: users.login, reporterFullName: users.fullName })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt));

    const targets = await this.resolveTargets(rows.map((r) => r.report));

    return rows.map((r) => ({
      ...r.report,
      reporterLogin: r.reporterLogin,
      reporterFullName: r.reporterFullName,
      target: targets.get(r.report.targetId) ?? MISSING_TARGET,
    }));
  }

  private async requireById(id: string): Promise<Report> {
    const rows = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException('Жалоба не найдена');
    return rows[0];
  }

  /** Admin decision on a pending report — closes it either as actioned or as no-violation-found. */
  async verify(id: string, decision: 'resolved' | 'dismissed', note?: string): Promise<Report> {
    const existing = await this.requireById(id);
    if (existing.status !== 'pending') {
      throw new BadRequestException('Решение можно принять только по жалобе на рассмотрении');
    }

    const updated = await this.db
      .update(reports)
      .set({ status: decision, adminNote: note ?? null, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updated[0];
  }

  /**
   * Admin: the full conversation behind a *message* report — deliberately reachable only through an
   * existing report (there is no general "browse any chat" admin endpoint), so staff can't open a
   * user's private correspondence without a filed complaint to justify it.
   */
  async getConversationForReport(reportId: string): Promise<AdminConversationView> {
    const report = await this.requireById(reportId);
    if (report.targetType !== 'message') {
      throw new BadRequestException('Просмотр переписки доступен только для жалоб на сообщения');
    }

    const messageRows = await this.db
      .select({ conversationId: messages.conversationId })
      .from(messages)
      .where(eq(messages.id, report.targetId))
      .limit(1);
    if (!messageRows[0]) throw new NotFoundException('Сообщение удалено — переписка недоступна');
    const conversationId = messageRows[0].conversationId;

    const conversationRows = await this.db
      .select({ userAId: conversations.userAId, userBId: conversations.userBId })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conversationRows[0]) throw new NotFoundException('Диалог не найден');

    const participantRows = await this.db
      .select({ id: users.id, login: users.login, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, [conversationRows[0].userAId, conversationRows[0].userBId]));

    const threadRows = await this.db
      .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(200);

    return {
      conversationId,
      participants: participantRows,
      messages: threadRows,
      reportedMessageId: report.targetId,
    };
  }

  async adminDelete(id: string): Promise<void> {
    await this.requireById(id);
    await this.db.delete(reports).where(eq(reports.id, id));
  }

  /** Batches target lookups by type so the admin queue needs one query per type, not one per report. */
  private async resolveTargets(rows: Report[]): Promise<Map<string, AdminReportTarget>> {
    const result = new Map<string, AdminReportTarget>();
    const idsByType = new Map<ReportTargetType, string[]>();
    for (const r of rows) {
      idsByType.set(r.targetType, [...(idsByType.get(r.targetType) ?? []), r.targetId]);
    }

    const listingIds = idsByType.get('listing');
    if (listingIds?.length) {
      const found = await this.db
        .select({ id: listings.id, name: listings.name, slug: listings.slug })
        .from(listings)
        .where(inArray(listings.id, listingIds));
      for (const l of found) {
        result.set(l.id, {
          label: l.name || 'Анкета без имени',
          href: l.slug ? `/admin/performers/${l.id}` : null,
          restrictableUserId: null,
          messagingRestricted: false,
        });
      }
    }

    const reviewIds = idsByType.get('review');
    if (reviewIds?.length) {
      const found = await this.db
        .select({ id: reviews.id, text: reviews.text, listingName: listings.name })
        .from(reviews)
        .leftJoin(listings, eq(reviews.listingId, listings.id))
        .where(inArray(reviews.id, reviewIds));
      for (const r of found) {
        const preview = r.text.length > 60 ? `${r.text.slice(0, 60)}…` : r.text;
        result.set(r.id, {
          label: `Отзыв на «${r.listingName || 'анкету'}»: ${preview}`,
          href: null,
          restrictableUserId: null,
          messagingRestricted: false,
        });
      }
    }

    const messageIds = idsByType.get('message');
    if (messageIds?.length) {
      const found = await this.db
        .select({
          id: messages.id,
          body: messages.body,
          senderId: messages.senderId,
          senderLogin: users.login,
          senderMessagingRestrictedAt: users.messagingRestrictedAt,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(inArray(messages.id, messageIds));
      for (const m of found) {
        const preview = m.body.length > 60 ? `${m.body.slice(0, 60)}…` : m.body;
        result.set(m.id, {
          label: `Сообщение от @${m.senderLogin ?? '—'}: ${preview}`,
          href: null,
          restrictableUserId: m.senderId,
          messagingRestricted: Boolean(m.senderMessagingRestrictedAt),
        });
      }
    }

    const userIds = idsByType.get('user');
    if (userIds?.length) {
      const found = await this.db
        .select({ id: users.id, login: users.login, fullName: users.fullName, messagingRestrictedAt: users.messagingRestrictedAt })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const u of found) {
        result.set(u.id, {
          label: u.fullName ? `${u.fullName} (@${u.login})` : `@${u.login}`,
          href: null,
          restrictableUserId: u.id,
          messagingRestricted: Boolean(u.messagingRestrictedAt),
        });
      }
    }

    return result;
  }
}
