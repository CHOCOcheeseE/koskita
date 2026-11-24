import { Module } from '@nestjs/common';
import { PrismaHealthChecker } from './data/prisma-health.checker';
import { HEALTH_CHECKER } from './domain/health-checker';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
  providers: [{ provide: HEALTH_CHECKER, useClass: PrismaHealthChecker }],
})
export class HealthModule {}
