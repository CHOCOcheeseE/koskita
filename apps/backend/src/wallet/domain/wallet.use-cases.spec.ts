import { FixedClock } from '../../common/domain/clock';
import { MemoryBudgetRepository, MemoryDb, MemoryTransactionRepository } from '../../../test/support/in-memory';
import { WalletUseCases } from './wallet.use-cases';

function setup(now: string) {
  const db = new MemoryDb();
  const clock = new FixedClock(new Date(now));
  return { uc: new WalletUseCases(new MemoryTransactionRepository(db), new MemoryBudgetRepository(db), clock), clock };
}

describe('WalletUseCases', () => {
  it('hari terakhir bulan: daysLeftIncludingToday 1, jatah = sisa anggaran penuh', async () => {
    const { uc } = setup('2026-11-30T05:00:00Z');
    await uc.createTransaction('u1', { type: 'expense', amount: 400_000, category: 'food', date: '2026-11-10' });
    await uc.createTransaction('u1', { type: 'expense', amount: 5_000, category: 'transport', date: '2026-11-30' });
    const s = await uc.setBudget('u1', '2026-11', 1_000_000);
    expect(s.today).toEqual({
      date: '2026-11-30',
      daysLeftIncludingToday: 1,
      spentBeforeToday: 400_000,
      spentToday: 5_000,
      dailyAllowance: 600_000,
      remainingToday: 595_000,
      overTodayAmount: 0,
    });
  });

  it('bulan lalu: today null; pemasukan tidak dihitung sebagai pengeluaran', async () => {
    const { uc, clock } = setup('2026-11-15T05:00:00Z');
    await uc.setBudget('u1', '2026-11', 1_000_000);
    await uc.createTransaction('u1', { type: 'income', amount: 2_000_000, category: 'allowance', date: '2026-11-01' });
    clock.set(new Date('2026-12-02T05:00:00Z'));
    const s = await uc.getBudgetStatus('u1', '2026-11');
    expect(s).toMatchObject({ totalExpense: 0, remainingBudget: 1_000_000, today: null });
    expect(await uc.currentBudgetStatus('u1')).toBeNull();
  });

  it('catatan kosong disimpan null', async () => {
    const { uc } = setup('2026-11-15T05:00:00Z');
    const t = await uc.createTransaction('u1', { type: 'expense', amount: 1, category: 'food', date: '2026-11-15', note: '   ' });
    expect(t.note).toBeNull();
  });
});
