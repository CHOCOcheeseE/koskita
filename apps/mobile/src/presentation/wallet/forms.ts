import { z } from 'zod';

export const MAX_RUPIAH = 100_000_000;

/** Nominal `PositiveRupiah`: integer 1 sampai 100.000.000. */
export const rupiahField = z
  .number({ error: 'Nominal harus angka rupiah lebih dari 0' })
  .int({ error: 'Nominal harus angka rupiah lebih dari 0' })
  .min(1, { error: 'Nominal harus angka rupiah lebih dari 0' })
  .max(MAX_RUPIAH, { error: 'Maksimal Rp100.000.000' })
  .nullable()
  .refine((v) => v !== null, { error: 'Nominal harus angka rupiah lebih dari 0' });

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: rupiahField,
  category: z
    .enum([
      'food',
      'transport',
      'housing_bills',
      'study',
      'leisure',
      'other_expense',
      'allowance',
      'side_job',
      'scholarship',
      'other_income',
    ])
    .nullable()
    .refine((v) => v !== null, { error: 'Pilih satu kategori' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(100, { error: 'Catatan maksimal 100 karakter' }),
});
export type TransactionForm = z.input<typeof transactionSchema>;

export const budgetSchema = z.object({ amount: rupiahField });
export type BudgetForm = z.input<typeof budgetSchema>;
