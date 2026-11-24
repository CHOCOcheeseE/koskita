import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import { AppError } from '../../common/domain/app-error';
import { Public } from '../../common/presentation/auth';
import { HEALTH_CHECKER, HealthChecker } from '../domain/health-checker';

@Controller('health')
export class HealthController {
  constructor(@Inject(HEALTH_CHECKER) private readonly checker: HealthChecker) {}

  @Public()
  @Get()
  @HttpCode(200)
  async getHealth(): Promise<{ status: 'ok' }> {
    if (!(await this.checker.isDatabaseUp())) {
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database belum bisa dihubungi');
    }
    return { status: 'ok' };
  }
}
