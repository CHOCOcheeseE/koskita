import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/data/prisma.service';
import { HealthChecker } from '../domain/health-checker';

@Injectable()
export class PrismaHealthChecker implements HealthChecker {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseUp(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
