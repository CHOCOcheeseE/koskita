import { AppError } from '../../common/domain/app-error';
import { Clock } from '../../common/domain/clock';
import {
  AccessTokenSigner,
  AuthSettings,
  PasswordHasher,
  RefreshTokenFactory,
  RefreshTokenRepository,
  User,
  UserRepository,
} from './ports';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class AuthUseCases {
  // Hash tiruan agar waktu respons login sama walau email tidak terdaftar.
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly hasher: PasswordHasher,
    private readonly signer: AccessTokenSigner,
    private readonly tokenFactory: RefreshTokenFactory,
    private readonly clock: Clock,
    private readonly settings: AuthSettings,
  ) {}

  async register(input: { email: string; password: string; name: string }): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const emailTaken = new AppError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar, silakan masuk');
    if (await this.users.findByEmail(email)) throw emailTaken;

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({ email, name: input.name.trim(), passwordHash });
    if (!user) throw emailTaken;
    return { user, tokens: await this.issueTokens(user.id) };
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const found = await this.users.findByEmail(input.email.trim().toLowerCase());
    this.dummyHash ??= this.hasher.hash('akun-tidak-ada');
    const ok = await this.hasher.compare(input.password, found?.passwordHash ?? (await this.dummyHash));
    if (!found || !ok) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah');
    }
    const { passwordHash: _hidden, ...user } = found;
    void _hidden;
    return { user, tokens: await this.issueTokens(user.id) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const userId = await this.refreshTokens.consume(this.tokenFactory.hash(refreshToken), this.clock.now());
    if (!userId) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Sesi berakhir, silakan masuk lagi');
    }
    return this.issueTokens(userId);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(this.tokenFactory.hash(refreshToken), userId, this.clock.now());
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const now = this.clock.now();
    const access = await this.signer.sign(userId, now);
    const refreshToken = this.tokenFactory.generate();
    await this.refreshTokens.create({
      userId,
      tokenHash: this.tokenFactory.hash(refreshToken),
      expiresAt: new Date(now.getTime() + this.settings.refreshTokenTtlDays * DAY_MS),
    });
    return { accessToken: access.token, refreshToken, accessTokenExpiresAt: access.expiresAt };
  }
}
