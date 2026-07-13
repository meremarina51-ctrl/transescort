import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users, type User } from '@transescort/db';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async createUser(
    email: string,
    password: string,
    fullName: string,
    role: 'client' | 'performer' = 'client',
  ): Promise<{ user: User; verificationToken: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { token, tokenHash, expiresAt } = this.generateVerificationToken();

    const inserted = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        fullName,
        role,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      })
      .returning();

    return { user: inserted[0], verificationToken: token };
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
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

  async updateFullName(id: string, fullName: string): Promise<void> {
    await this.db.update(users).set({ fullName, updatedAt: new Date() }).where(eq(users.id, id));
  }

  private generateVerificationToken() {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    return { token, tokenHash, expiresAt };
  }

  /** Regenerates a fresh token for an unverified user (resend flow). */
  async issueVerificationToken(userId: string): Promise<string> {
    const { token, tokenHash, expiresAt } = this.generateVerificationToken();
    await this.db
      .update(users)
      .set({ emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: expiresAt })
      .where(eq(users.id, userId));
    return token;
  }

  /** Marks a user verified without a token — used when SMTP isn't configured and verification is skipped. */
  async markEmailVerified(userId: string): Promise<User> {
    const updated = await this.db
      .update(users)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  /** Consumes a verification token: marks the user verified and clears the token. Returns null if invalid/expired. */
  async verifyEmailByToken(token: string): Promise<User | null> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const found = await this.db
      .select()
      .from(users)
      .where(eq(users.emailVerificationTokenHash, tokenHash))
      .limit(1);
    const user = found[0] as User | undefined;

    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return null;
    }

    const updated = await this.db
      .update(users)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updated[0];
  }
}
