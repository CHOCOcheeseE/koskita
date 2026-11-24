import type { components } from '../../contract/schema';
import type { AuthSession, AuthTokens } from '../domain/auth.use-cases';
import type { User } from '../domain/ports';

type Schemas = components['schemas'];

export function toUserResponse(user: User): Schemas['User'] {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    campus: user.campus,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toTokensResponse(tokens: AuthTokens): Schemas['AuthTokens'] {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
  };
}

export function toSessionResponse(session: AuthSession): Schemas['AuthSession'] {
  return { user: toUserResponse(session.user), tokens: toTokensResponse(session.tokens) };
}
