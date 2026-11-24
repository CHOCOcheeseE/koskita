import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/presentation/auth';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { ProfileModule } from './profile/profile.module';
import { SplitBillModule } from './split-bill/split-bill.module';
import { StudyModule } from './study/study.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      // Dua batas terpisah: `default` untuk login/register, `join` untuk gabung grup lewat kode undangan.
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: Number(config.get('AUTH_THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(config.get('AUTH_THROTTLE_LIMIT') ?? 10),
        },
        {
          name: 'join',
          ttl: Number(config.get('JOIN_THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(config.get('JOIN_THROTTLE_LIMIT') ?? 10),
        },
      ],
    }),
    CommonModule,
    HealthModule,
    AuthModule,
    ProfileModule,
    WalletModule,
    SplitBillModule,
    StudyModule,
    HomeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
