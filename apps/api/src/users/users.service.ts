import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { users, type User } from '@transescort/db';
import * as bcrypt from 'bcrypt';
import { generateRecoveryCode, normalizeRecoveryCode } from './recovery-code.util';

export type PublicUser = Omit<User, 'passwordHash'>;

function toPublicUser({ passwordHash: _passwordHash, ...rest }: User): PublicUser {
  return rest;
}

interface CreateUserExtra {
  phone?: string;
  contactMethod?: 'telegram' | 'email' | 'phone' | 'whatsapp';
  contactValue?: string;
}

@Injectable()
export class UsersService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async createUser(
    login: string,
    password: string,
    fullName: string,
    role: 'client' | 'performer' = 'client',
    extra: CreateUserExtra = {},
  ): Promise<User> {
    const normalizedLogin = login.toLowerCase().trim();

    const existing = await this.findByLogin(normalizedLogin);
    if (existing) {
      throw new ConflictException('User with this login already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await this.db
      .insert(users)
      .values({
        login: normalizedLogin,
        passwordHash,
        fullName,
        role,
        phone: extra.phone,
        contactMethod: extra.contactMethod,
        contactValue: extra.contactValue,
      })
      .returning();

    return inserted[0];
  }

  async findByLogin(login: string): Promise<User | null> {
    const found = await this.db
      .select()
      .from(users)
      .where(eq(users.login, login.toLowerCase().trim()))
      .limit(1);
    return found[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return found[0] || null;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async updateProfile(
    id: string,
    data: { fullName?: string; email?: string; phone?: string },
  ): Promise<void> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.fullName !== undefined && data.fullName !== '') patch.fullName = data.fullName;
    if (data.email !== undefined) patch.email = data.email || null;
    if (data.phone !== undefined) patch.phone = data.phone || null;

    await this.db.update(users).set(patch).where(eq(users.id, id));
  }

  async listAll(): Promise<PublicUser[]> {
    const rows: User[] = await this.db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map(toPublicUser);
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.findById(id);
    return user ? toPublicUser(user) : null;
  }

  async setStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    await this.db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id));
  }

  /** Narrower than `setStatus('suspended')` — the account stays fully usable, only chat sending is blocked. */
  async setMessagingRestriction(id: string, restricted: boolean): Promise<void> {
    await this.db
      .update(users)
      .set({ messagingRestrictedAt: restricted ? new Date() : null, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
  }

  /** Generates and stores a fresh backup code, returning the plaintext — only ever available this once. */
  async setRecoveryCode(id: string): Promise<string> {
    const code = generateRecoveryCode();
    const recoveryCodeHash = await bcrypt.hash(code, 10);
    await this.db.update(users).set({ recoveryCodeHash, updatedAt: new Date() }).where(eq(users.id, id));
    return code;
  }

  async verifyRecoveryCode(user: User, code: string): Promise<boolean> {
    if (!user.recoveryCodeHash) return false;
    return bcrypt.compare(normalizeRecoveryCode(code), user.recoveryCodeHash);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
