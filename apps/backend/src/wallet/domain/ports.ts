import type { Category } from './categories';

export interface Transaction {
  id: string;
  userId: string;
  category: Category;
  amount: number;
  /** YYYY-MM-DD (WIB) */
  date: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCursor {
  date: string;
  createdAt: Date;
  id: string;
}

export interface TransactionRepository {
  create(input: { userId: string; category: Category; amount: number; date: string; note: string | null }): Promise<Transaction>;
  /** Hanya transaksi milik `userId`. */
  findOwned(userId: string, id: string): Promise<Transaction | null>;
  update(id: string, input: { category: Category; amount: number; date: string; note: string | null }): Promise<Transaction>;
  delete(id: string): Promise<void>;
  /** Urut date desc, createdAt desc, id desc; ambil maksimal `take` baris setelah `after`. */
  listInRange(userId: string, from: string, to: string, after: TransactionCursor | null, take: number): Promise<Transaction[]>;
  /** Jumlah nominal per kategori dalam rentang tanggal (inklusif). */
  sumByCategory(userId: string, from: string, to: string): Promise<{ category: Category; amount: number }[]>;
}

export interface BudgetRepository {
  find(userId: string, month: string): Promise<{ amount: number } | null>;
  upsert(userId: string, month: string, amount: number): Promise<{ amount: number }>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
export const BUDGET_REPOSITORY = Symbol('BUDGET_REPOSITORY');
