import { AppError, notFound } from '../../common/domain/app-error';
import { Clock } from '../../common/domain/clock';
import { decodeCursor, Page, toPage } from '../../common/pagination/cursor';
import { daysLeftInMonthWib, monthDateRange, monthWib, previousDate, todayWib } from '../../common/time/wib';
import { CATEGORIES, Category, categoryInfo, CategoryInfo, TransactionType } from './categories';
import { MonthTotals, summarizeMonth } from './category-summary';
import { budgetRemaining, calculateDailyAllowance } from './daily-allowance';
import { BudgetRepository, Transaction, TransactionCursor, TransactionRepository } from './ports';

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  note?: string | null;
}

export type TransactionPatch = Partial<TransactionInput>;

export interface DailyAllowanceStatus {
  date: string;
  daysLeftIncludingToday: number;
  spentBeforeToday: number;
  spentToday: number;
  dailyAllowance: number;
  remainingToday: number;
  overTodayAmount: number;
}

export interface BudgetStatus {
  month: string;
  amount: number;
  totalExpense: number;
  remainingBudget: number;
  overBudgetAmount: number;
  today: DailyAllowanceStatus | null;
}

export interface MonthSummary extends MonthTotals {
  month: string;
}

export class WalletUseCases {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly budgets: BudgetRepository,
    private readonly clock: Clock,
  ) {}

  listCategories(): readonly CategoryInfo[] {
    return CATEGORIES;
  }

  async createTransaction(userId: string, input: TransactionInput): Promise<Transaction> {
    const valid = this.validateTransaction(input);
    return this.transactions.create({ userId, ...valid });
  }

  async getTransaction(userId: string, id: string): Promise<Transaction> {
    const found = await this.transactions.findOwned(userId, id);
    if (!found) throw notFound('Transaksi tidak ditemukan');
    return found;
  }

  async updateTransaction(userId: string, id: string, patch: TransactionPatch): Promise<Transaction> {
    const current = await this.getTransaction(userId, id);
    const merged: TransactionInput = {
      type: patch.type ?? categoryInfo(current.category).type,
      amount: patch.amount ?? current.amount,
      category: patch.category ?? current.category,
      date: patch.date ?? current.date,
      note: patch.note !== undefined ? patch.note : current.note,
    };
    return this.transactions.update(id, this.validateTransaction(merged));
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    await this.getTransaction(userId, id);
    await this.transactions.delete(id);
  }

  async listTransactions(userId: string, month: string, cursor: string | undefined, limit: number): Promise<Page<Transaction>> {
    this.assertNotFutureMonth(month);
    const decoded = decodeCursor(cursor);
    const after = decoded ? parseTransactionCursor(decoded.v, decoded.i) : null;
    const { first, last } = monthDateRange(month);
    const rows = await this.transactions.listInRange(userId, first, last, after, limit + 1);
    return toPage(rows, limit, (t) => ({ v: `${t.date}|${t.createdAt.toISOString()}`, i: t.id }));
  }

  async getMonthSummary(userId: string, month: string): Promise<MonthSummary> {
    this.assertNotFutureMonth(month);
    const { first, last } = monthDateRange(month);
    const rows = await this.transactions.sumByCategory(userId, first, last);
    return { month, ...summarizeMonth(rows) };
  }

  async getBudgetStatus(userId: string, month: string): Promise<BudgetStatus> {
    const status = await this.findBudgetStatus(userId, month);
    if (!status) {
      throw new AppError(404, 'BUDGET_NOT_FOUND', 'Belum ada anggaran untuk bulan ini');
    }
    return status;
  }

  /** Status anggaran bulan berjalan, `null` jika belum diatur (dipakai Beranda). */
  currentBudgetStatus(userId: string): Promise<BudgetStatus | null> {
    return this.findBudgetStatus(userId, monthWib(this.clock.now()));
  }

  async setBudget(userId: string, month: string, amount: number): Promise<BudgetStatus> {
    if (month !== monthWib(this.clock.now())) {
      throw new AppError(422, 'MONTH_NOT_EDITABLE', 'Anggaran hanya bisa diatur untuk bulan berjalan');
    }
    await this.budgets.upsert(userId, month, amount);
    return this.getBudgetStatus(userId, month);
  }

  private async findBudgetStatus(userId: string, month: string): Promise<BudgetStatus | null> {
    const budget = await this.budgets.find(userId, month);
    if (!budget) return null;

    const { first, last } = monthDateRange(month);
    const totalExpense = summarizeMonth(await this.transactions.sumByCategory(userId, first, last)).totalExpense;
    const now = this.clock.now();
    let today: DailyAllowanceStatus | null = null;

    if (month === monthWib(now)) {
      const date = todayWib(now);
      const spentBeforeToday =
        date === first ? 0 : summarizeMonth(await this.transactions.sumByCategory(userId, first, previousDate(date))).totalExpense;
      const spentToday = summarizeMonth(await this.transactions.sumByCategory(userId, date, date)).totalExpense;
      const daysLeftIncludingToday = daysLeftInMonthWib(now);
      today = {
        date,
        daysLeftIncludingToday,
        spentBeforeToday,
        spentToday,
        ...calculateDailyAllowance({ budget: budget.amount, spentBeforeToday, spentToday, daysLeftIncludingToday }),
      };
    }

    return { month, amount: budget.amount, totalExpense, ...budgetRemaining(budget.amount, totalExpense), today };
  }

  private validateTransaction(input: TransactionInput): { category: Category; amount: number; date: string; note: string | null } {
    if (categoryInfo(input.category).type !== input.type) {
      throw new AppError(422, 'CATEGORY_TYPE_MISMATCH', 'Kategori tidak cocok dengan jenis transaksi');
    }
    if (input.date > todayWib(this.clock.now())) {
      throw new AppError(422, 'DATE_IN_FUTURE', 'Tanggal transaksi tidak boleh setelah hari ini');
    }
    const note = input.note?.trim() ? input.note.trim() : null;
    return { category: input.category, amount: input.amount, date: input.date, note };
  }

  private assertNotFutureMonth(month: string): void {
    if (month > monthWib(this.clock.now())) {
      throw new AppError(422, 'MONTH_IN_FUTURE', 'Bulan ini belum berjalan');
    }
  }
}

function parseTransactionCursor(v: string, id: string): TransactionCursor {
  const [date, createdAt] = v.split('|');
  const created = new Date(createdAt ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || Number.isNaN(created.getTime())) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Kursor halaman tidak valid', { cursor: 'Kursor halaman tidak valid' });
  }
  return { date, createdAt: created, id };
}
