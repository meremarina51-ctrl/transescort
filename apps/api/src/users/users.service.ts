import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users, type User } from '@transescort/db';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async createUser(
    email: string,
    password: string,
    fullName: string,
    role: 'client' | 'performer' = 'client',
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        fullName,
        role,
      })
      .returning();

    return inserted[0];
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
}
