import type {
  AuthRepository,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  User,
} from '@/domain/auth/auth';

import type { ApiClient, Schemas } from '../api/client';

const toUser = (dto: Schemas['User']): User => dto;

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly api: ApiClient) {}

  private async startSession(session: Schemas['AuthSession']): Promise<User> {
    await this.api.tokens.save({
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
    });
    return toUser(session.user);
  }

  async register(input: RegisterInput): Promise<User> {
    const body: Schemas['RegisterRequest'] = input;
    const session = await this.api.request<Schemas['AuthSession']>('POST', '/v1/auth/register', { body, auth: false });
    return this.startSession(session);
  }

  async login(input: LoginInput): Promise<User> {
    const body: Schemas['LoginRequest'] = input;
    const session = await this.api.request<Schemas['AuthSession']>('POST', '/v1/auth/login', { body, auth: false });
    return this.startSession(session);
  }

  async logout(): Promise<void> {
    const tokens = await this.api.tokens.get();
    try {
      if (tokens) {
        const body: Schemas['RefreshRequest'] = { refreshToken: tokens.refreshToken };
        await this.api.request<void>('POST', '/v1/auth/logout', { body });
      }
    } finally {
      await this.api.tokens.clear();
    }
  }

  async hasSession(): Promise<boolean> {
    return (await this.api.tokens.get()) !== null;
  }

  async getProfile(): Promise<User> {
    return toUser(await this.api.request<Schemas['User']>('GET', '/v1/me'));
  }

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const body: Schemas['UpdateProfileRequest'] = input;
    return toUser(await this.api.request<Schemas['User']>('PATCH', '/v1/me', { body }));
  }
}
