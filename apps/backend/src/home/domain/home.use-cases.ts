import { Clock } from '../../common/domain/clock';
import { todayWib } from '../../common/time/wib';
import type { SplitTotalsView } from '../../split-bill/domain/split-bill.use-cases';
import type { ScheduleView, TaskView } from '../../study/domain/study.use-cases';
import type { BudgetStatus } from '../../wallet/domain/wallet.use-cases';

/** Sumber data Beranda dari modul lain (diisi use case modul masing-masing). */
export interface HomeSources {
  currentBudgetStatus(userId: string): Promise<BudgetStatus | null>;
  splitTotals(userId: string): Promise<SplitTotalsView>;
  classesToday(userId: string): Promise<ScheduleView[]>;
  upcomingTasks(userId: string): Promise<TaskView[]>;
}

export interface HomeSummary {
  date: string;
  budget: BudgetStatus | null;
  split: SplitTotalsView;
  classesToday: ScheduleView[];
  upcomingTasks: TaskView[];
}

export class HomeUseCases {
  constructor(
    private readonly sources: HomeSources,
    private readonly clock: Clock,
  ) {}

  async today(userId: string): Promise<HomeSummary> {
    const date = todayWib(this.clock.now());
    const [budget, split, classesToday, upcomingTasks] = await Promise.all([
      this.sources.currentBudgetStatus(userId),
      this.sources.splitTotals(userId),
      this.sources.classesToday(userId),
      this.sources.upcomingTasks(userId),
    ]);
    return { date, budget, split, classesToday, upcomingTasks: upcomingTasks.slice(0, 3) };
  }
}
