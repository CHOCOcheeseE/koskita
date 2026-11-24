import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLOCK, Clock } from '../common/domain/clock';
import {
  BcryptPasswordHasher,
  CryptoRefreshTokenFactory,
  JwtAccessTokenSigner,
  PrismaRefreshTokenRepository,
  PrismaUserRepository,
} from './data/prisma-auth.repositories';
import { AuthUseCases } from './domain/auth.use-cases';
import {
  ACCESS_TOKEN_SIGNER,
  AccessTokenSigner,
  AUTH_SETTINGS,
  AuthSettings,
  PASSWORD_HASHER,
  PasswordHasher,
  REFRESH_TOKEN_FACTORY,
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenFactory,
  RefreshTokenRepository,
  USER_REPOSITORY,
  UserRepository,
} from './domain/ports';
import { AuthController } from './presentation/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_SIGNER, useClass: JwtAccessTokenSigner },
    { provide: REFRESH_TOKEN_FACTORY, useClass: CryptoRefreshTokenFactory },
    {
      provide: AUTH_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): AuthSettings => ({
        refreshTokenTtlDays: Number(config.get('REFRESH_TOKEN_TTL_DAYS') ?? 30),
      }),
    },
    {
      provide: AuthUseCases,
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, PASSWORD_HASHER, ACCESS_TOKEN_SIGNER, REFRESH_TOKEN_FACTORY, CLOCK, AUTH_SETTINGS],
      useFactory: (
        users: UserRepository,
        tokens: RefreshTokenRepository,
        hasher: PasswordHasher,
        signer: AccessTokenSigner,
        factory: RefreshTokenFactory,
        clock: Clock,
        settings: AuthSettings,
      ) => new AuthUseCases(users, tokens, hasher, signer, factory, clock, settings),
    },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthModule {}
