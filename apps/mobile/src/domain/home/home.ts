import type { ClassSchedule, StudyTask } from '../study/study';
import type { BudgetStatus } from '../wallet/wallet';

export type SplitTotals = { hasGroups: boolean; totalIOwe: number; totalOwedToMe: number };

export type HomeSummary = {
  date: string;
  budget: BudgetStatus | null;
  split: SplitTotals;
  classesToday: ClassSchedule[];
  upcomingTasks: StudyTask[];
};

export interface HomeRepository {
  getToday(): Promise<HomeSummary>;
}

export function createHomeUseCases(repo: HomeRepository) {
  return { getToday: () => repo.getToday() };
}

export type HomeUseCases = ReturnType<typeof createHomeUseCases>;

export type SplitState = 'no-groups' | 'settled' | 'amounts';

export function splitState(split: SplitTotals): SplitState {
  if (!split.hasGroups) return 'no-groups';
  if (split.totalIOwe === 0 && split.totalOwedToMe === 0) return 'settled';
  return 'amounts';
}

/** Keadaan bagian jatah di Beranda (desain B1). */
export type AllowanceState =
  | { kind: 'no-budget' }
  | { kind: 'over-budget'; overBudgetAmount: number }
  | { kind: 'over-today'; overTodayAmount: number; dailyAllowance: number }
  | { kind: 'normal'; remainingToday: number; dailyAllowance: number };

export function allowanceState(budget: BudgetStatus | null): AllowanceState {
  if (!budget || !budget.today) return { kind: 'no-budget' };
  if (budget.overBudgetAmount > 0) return { kind: 'over-budget', overBudgetAmount: budget.overBudgetAmount };
  if (budget.today.overTodayAmount > 0) {
    return { kind: 'over-today', overTodayAmount: budget.today.overTodayAmount, dailyAllowance: budget.today.dailyAllowance };
  }
  return { kind: 'normal', remainingToday: budget.today.remainingToday, dailyAllowance: budget.today.dailyAllowance };
}
