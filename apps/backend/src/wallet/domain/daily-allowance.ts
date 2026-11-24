export interface DailyAllowanceInput {
  budget: number;
  spentBeforeToday: number;
  spentToday: number;
  daysLeftIncludingToday: number;
}

export interface DailyAllowanceResult {
  dailyAllowance: number;
  remainingToday: number;
  overTodayAmount: number;
}

/**
 * dailyAllowance = max(0, floor((budget - spentBeforeToday) / daysLeftIncludingToday))
 * remainingToday = max(0, dailyAllowance - spentToday)
 * overTodayAmount = max(0, spentToday - dailyAllowance)
 */
export function calculateDailyAllowance(input: DailyAllowanceInput): DailyAllowanceResult {
  const days = Math.max(1, input.daysLeftIncludingToday);
  const dailyAllowance = Math.max(0, Math.floor((input.budget - input.spentBeforeToday) / days));
  return {
    dailyAllowance,
    remainingToday: Math.max(0, dailyAllowance - input.spentToday),
    overTodayAmount: Math.max(0, input.spentToday - dailyAllowance),
  };
}

export function budgetRemaining(amount: number, totalExpense: number): { remainingBudget: number; overBudgetAmount: number } {
  return {
    remainingBudget: Math.max(0, amount - totalExpense),
    overBudgetAmount: Math.max(0, totalExpense - amount),
  };
}
