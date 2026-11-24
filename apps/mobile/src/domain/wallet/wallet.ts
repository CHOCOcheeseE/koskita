import type { Clock } from '../shared/clock';
import type { Page } from '../shared/page';
import { monthWib, todayWib } from '../shared/wib';

export type TransactionType = 'income' | 'expense';
export type Category =
  | 'food'
  | 'transport'
  | 'housing_bills'
  | 'study'
  | 'leisure'
  | 'other_expense'
  | 'allowance'
  | 'side_job'
  | 'scholarship'
  | 'other_income';

export type CategoryInfo = { code: Category; type: TransactionType; label: string };

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  note?: string | null;
};

export type CategoryTotal = { category: Category; label: string; amount: number; percent: number };

export type MonthSummary = {
  month: string;
  totalIncome: number;
  totalExpense: number;
  expenseByCategory: CategoryTotal[];
};

export type DailyAllowance = {
  date: string;
  daysLeftIncludingToday: number;
  spentBeforeToday: number;
  spentToday: number;
  dailyAllowance: number;
  remainingToday: number;
  overTodayAmount: number;
};

export type BudgetStatus = {
  month: string;
  amount: number;
  totalExpense: number;
  remainingBudget: number;
  overBudgetAmount: number;
  today: DailyAllowance | null;
};

export interface WalletRepository {
  listCategories(): Promise<CategoryInfo[]>;
  listTransactions(month: string, cursor?: string | null): Promise<Page<Transaction>>;
  getTransaction(id: string): Promise<Transaction>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, patch: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  getMonthSummary(month: string): Promise<MonthSummary>;
  /** `null` jika backend membalas 404 `BUDGET_NOT_FOUND`. */
  getBudgetStatus(month: string): Promise<BudgetStatus | null>;
  setBudget(month: string, amount: number): Promise<BudgetStatus>;
}

export function createWalletUseCases(repo: WalletRepository, clock: Clock) {
  const normalizeNote = (note: string | null | undefined) => {
    const trimmed = note?.trim() ?? '';
    return trimmed === '' ? null : trimmed;
  };
  return {
    currentMonth: () => monthWib(clock.now()),
    today: () => todayWib(clock.now()),
    listCategories: () => repo.listCategories(),
    listTransactions: (month: string, cursor?: string | null) => repo.listTransactions(month, cursor),
    getTransaction: (id: string) => repo.getTransaction(id),
    createTransaction: (input: TransactionInput) =>
      repo.createTransaction({ ...input, note: normalizeNote(input.note) }),
    updateTransaction: (id: string, input: TransactionInput) =>
      repo.updateTransaction(id, { ...input, note: normalizeNote(input.note) }),
    deleteTransaction: (id: string) => repo.deleteTransaction(id),
    getMonthSummary: (month: string) => repo.getMonthSummary(month),
    getBudgetStatus: (month: string) => repo.getBudgetStatus(month),
    /** Anggaran hanya bisa diatur untuk bulan berjalan (aturan `MONTH_NOT_EDITABLE`). */
    setBudget: (amount: number) => repo.setBudget(monthWib(clock.now()), amount),
    isCurrentMonth: (month: string) => month === monthWib(clock.now()),
  };
}

export type WalletUseCases = ReturnType<typeof createWalletUseCases>;

/** Kategori yang cocok dengan tipe transaksi, urutan sama dengan daftar dari API. */
export function categoriesFor(type: TransactionType, all: CategoryInfo[]): CategoryInfo[] {
  return all.filter((c) => c.type === type);
}

/** Kelompokkan transaksi per tanggal, urutan tetap seperti dari API (terbaru di atas). */
export function groupByDate(items: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups;
}

/** Porsi bilah anggaran 0..1 untuk tampilan (bukan rumus jatah harian). */
export function budgetUsageRatio(status: Pick<BudgetStatus, 'amount' | 'totalExpense'>): number {
  if (status.amount <= 0) return 0;
  return Math.min(1, status.totalExpense / status.amount);
}
