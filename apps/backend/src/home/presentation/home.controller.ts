import { Controller, Get } from '@nestjs/common';
import type { components } from '../../contract/schema';
import { CurrentUser } from '../../common/presentation/auth';
import { toScheduleResponse, toTaskResponse } from '../../study/presentation/study.mapper';
import { toBudgetStatusResponse } from '../../wallet/presentation/wallet.mapper';
import { HomeUseCases } from '../domain/home.use-cases';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeUseCases) {}

  @Get('today')
  async getHomeToday(@CurrentUser() userId: string): Promise<components['schemas']['HomeSummary']> {
    const s = await this.home.today(userId);
    return {
      date: s.date,
      budget: s.budget ? toBudgetStatusResponse(s.budget) : null,
      split: { hasGroups: s.split.hasGroups, totalIOwe: s.split.totalIOwe, totalOwedToMe: s.split.totalOwedToMe },
      classesToday: s.classesToday.map(toScheduleResponse),
      upcomingTasks: s.upcomingTasks.map(toTaskResponse),
    };
  }
}
