import { Category, categoryInfo, EXPENSE_CATEGORIES } from './categories';

export interface CategoryTotal {
  category: Category;
  label: string;
  amount: number;
  percent: number;
}

export interface MonthTotals {
  totalIncome: number;
  totalExpense: number;
  expenseByCategory: CategoryTotal[];
}

/** Hanya kategori pengeluaran dengan nominal > 0, urut nominal terbesar, persen dibulatkan Math.round. */
export function summarizeByCategory(rows: { category: Category; amount: number }[]): CategoryTotal[] {
  const totals = new Map<Category, number>();
  for (const row of rows) {
    if (!EXPENSE_CATEGORIES.includes(row.category) || row.amount <= 0) continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount);
  }
  const totalExpense = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || EXPENSE_CATEGORIES.indexOf(a[0]) - EXPENSE_CATEGORIES.indexOf(b[0]))
    .map(([category, amount]) => ({
      category,
      label: categoryInfo(category).label,
      amount,
      percent: Math.round((amount / totalExpense) * 100),
    }));
}

export function summarizeMonth(rows: { category: Category; amount: number }[]): MonthTotals {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of rows) {
    if (categoryInfo(row.category).type === 'income') totalIncome += row.amount;
    else totalExpense += row.amount;
  }
  return { totalIncome, totalExpense, expenseByCategory: summarizeByCategory(rows) };
}
