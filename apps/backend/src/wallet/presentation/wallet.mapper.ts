import type { components } from '../../contract/schema';
import { categoryInfo } from '../domain/categories';
import type { Transaction } from '../domain/ports';
import type { BudgetStatus, MonthSummary } from '../domain/wallet.use-cases';

type Schemas = components['schemas'];

export function toTransactionResponse(t: Transaction): Schemas['Transaction'] {
  return {
    id: t.id,
    type: categoryInfo(t.category).type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function toMonthSummaryResponse(s: MonthSummary): Schemas['MonthSummary'] {
  return {
    month: s.month,
    totalIncome: s.totalIncome,
    totalExpense: s.totalExpense,
    expenseByCategory: s.expenseByCategory.map((c) => ({
      category: c.category,
      label: c.label,
      amount: c.amount,
      percent: c.percent,
    })),
  };
}

export function toBudgetStatusResponse(b: BudgetStatus): Schemas['BudgetStatus'] {
  return {
    month: b.month,
    amount: b.amount,
    totalExpense: b.totalExpense,
    remainingBudget: b.remainingBudget,
    overBudgetAmount: b.overBudgetAmount,
    today: b.today
      ? {
          date: b.today.date,
          daysLeftIncludingToday: b.today.daysLeftIncludingToday,
          spentBeforeToday: b.today.spentBeforeToday,
          spentToday: b.today.spentToday,
          dailyAllowance: b.today.dailyAllowance,
          remainingToday: b.today.remainingToday,
          overTodayAmount: b.today.overTodayAmount,
        }
      : null,
  };
}
