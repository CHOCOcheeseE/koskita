export interface User {
  id: string;
  email: string;
  name: string;
  campus: string | null;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<User | null>;
  /** `null` jika email sudah dipakai (unique constraint). */
  create(input: { email: string; name: string; passwordHash: string }): Promise<User | null>;
  update(id: string, input: { name?: string; campus?: string | null }): Promise<User>;
}

export interface RefreshTokenRepository {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  /**
   * Tandai token terpakai secara atomik. Balas `userId` jika token masih berlaku
   * (belum dipakai, belum dicabut, belum kedaluwarsa), selain itu `null`.
   */
  consume(tokenHash: string, now: Date): Promise<string | null>;
  /** Cabut token milik `userId`. Diam saja jika token tidak ada. */
  revoke(tokenHash: string, userId: string, now: Date): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface AccessTokenSigner {
  sign(userId: string, now: Date): Promise<{ token: string; expiresAt: Date }>;
}

export interface RefreshTokenFactory {
  generate(): string;
  hash(token: string): string;
}

export interface AuthSettings {
  refreshTokenTtlDays: number;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const ACCESS_TOKEN_SIGNER = Symbol('ACCESS_TOKEN_SIGNER');
export const REFRESH_TOKEN_FACTORY = Symbol('REFRESH_TOKEN_FACTORY');
export const AUTH_SETTINGS = Symbol('AUTH_SETTINGS');
