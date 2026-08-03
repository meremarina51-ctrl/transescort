import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users, type User } from '@transescort/db';
import * as bcrypt from 'bcrypt';

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
}
