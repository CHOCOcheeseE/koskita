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

export interface CategoryInfo {
  code: Category;
  type: TransactionType;
  label: string;
}

/** Sama dengan data acuan `wallet_categories` di migrasi dan enum `Category` di kontrak. */
export const CATEGORIES: readonly CategoryInfo[] = [
  { code: 'food', type: 'expense', label: 'Makan' },
  { code: 'transport', type: 'expense', label: 'Transport' },
  { code: 'housing_bills', type: 'expense', label: 'Kos & Tagihan' },
  { code: 'study', type: 'expense', label: 'Kuliah' },
  { code: 'leisure', type: 'expense', label: 'Jajan & Hiburan' },
  { code: 'other_expense', type: 'expense', label: 'Lainnya' },
  { code: 'allowance', type: 'income', label: 'Kiriman' },
  { code: 'side_job', type: 'income', label: 'Kerja Sampingan' },
  { code: 'scholarship', type: 'income', label: 'Beasiswa' },
  { code: 'other_income', type: 'income', label: 'Lainnya' },
];

export const CATEGORY_CODES = CATEGORIES.map((c) => c.code);
export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense').map((c) => c.code);

export function categoryInfo(code: Category): CategoryInfo {
  const found = CATEGORIES.find((c) => c.code === code);
  if (!found) throw new Error(`Kategori tidak dikenal: ${code}`);
  return found;
}
