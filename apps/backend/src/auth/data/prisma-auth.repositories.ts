import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { isUniqueViolation, PrismaService } from '../../common/data/prisma.service';
import {
  AccessTokenSigner,
  PasswordHasher,
  RefreshTokenFactory,
  RefreshTokenRepository,
  User,
  UserRepository,
  UserWithPassword,
} from '../domain/ports';

const userSelect = { id: true, email: true, name: true, campus: true, createdAt: true } as const;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { email }, select: { ...userSelect, passwordHash: true } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  async create(input: { email: string; name: string; passwordHash: string }): Promise<User | null> {
    try {
      return await this.prisma.user.create({ data: input, select: userSelect });
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }

  update(id: string, input: { name?: string; campus?: string | null }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: input, select: userSelect });
  }
}

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prisma.refreshToken.create({ data: input });
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.revokedAt || row.expiresAt <= now) return null;
    // updateMany bersyarat supaya dua request bersamaan tidak sama-sama lolos (rotasi sekali pakai).
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: row.id, usedAt: null, revokedAt: null },
      data: { usedAt: now },
    });
    return count === 1 ? row.userId : null;
  }

  async revoke(tokenHash: string, userId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds: number;

  constructor(config: ConfigService) {
    // Default 10 (K5). Tes boleh menurunkan lewat BCRYPT_ROUNDS supaya cepat.
    this.rounds = Number(config.get('BCRYPT_ROUNDS') ?? 10);
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

@Injectable()
export class JwtAccessTokenSigner implements AccessTokenSigner {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sign(userId: string, now: Date): Promise<{ token: string; expiresAt: Date }> {
    const ttl = Number(this.config.get('ACCESS_TOKEN_TTL_SECONDS') ?? 900);
    const iat = Math.floor(now.getTime() / 1000);
    const token = await this.jwt.signAsync({ sub: userId, typ: 'access', iat, exp: iat + ttl });
    return { token, expiresAt: new Date((iat + ttl) * 1000) };
  }
}

export class CryptoRefreshTokenFactory implements RefreshTokenFactory {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
