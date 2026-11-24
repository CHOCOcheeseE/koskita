import { summarizeByCategory, summarizeMonth } from './category-summary';
import { budgetRemaining, calculateDailyAllowance } from './daily-allowance';

describe('calculateDailyAllowance', () => {
  it('contoh kontrak: 1.500.000, sisa 10 hari, terpakai 1.000.000, hari ini 20.000', () => {
    expect(
      calculateDailyAllowance({ budget: 1_500_000, spentBeforeToday: 1_000_000, spentToday: 20_000, daysLeftIncludingToday: 10 }),
    ).toEqual({ dailyAllowance: 50_000, remainingToday: 30_000, overTodayAmount: 0 });
  });

  it('anggaran terlampaui: jatah 0', () => {
    const r = calculateDailyAllowance({ budget: 1_000_000, spentBeforeToday: 1_200_000, spentToday: 10_000, daysLeftIncludingToday: 5 });
    expect(r).toEqual({ dailyAllowance: 0, remainingToday: 0, overTodayAmount: 10_000 });
    expect(budgetRemaining(1_000_000, 1_210_000)).toEqual({ remainingBudget: 0, overBudgetAmount: 210_000 });
  });

  it('hari terakhir bulan: jatah = sisa anggaran penuh, tidak bagi nol', () => {
    expect(
      calculateDailyAllowance({ budget: 1_000_000, spentBeforeToday: 700_000, spentToday: 0, daysLeftIncludingToday: 1 }).dailyAllowance,
    ).toBe(300_000);
  });

  it('jatah dibulatkan ke bawah dan lewat jatah dihitung', () => {
    const r = calculateDailyAllowance({ budget: 100_000, spentBeforeToday: 0, spentToday: 40_000, daysLeftIncludingToday: 3 });
    expect(r).toEqual({ dailyAllowance: 33_333, remainingToday: 0, overTodayAmount: 6_667 });
  });
});

describe('summarizeByCategory', () => {
  it('buang pemasukan dan nol, urut terbesar, persen Math.round', () => {
    const r = summarizeByCategory([
      { category: 'food', amount: 50_000 },
      { category: 'transport', amount: 25_000 },
      { category: 'leisure', amount: 0 },
      { category: 'allowance', amount: 2_000_000 },
      { category: 'food', amount: 25_000 },
    ]);
    expect(r).toEqual([
      { category: 'food', label: 'Makan', amount: 75_000, percent: 75 },
      { category: 'transport', label: 'Transport', amount: 25_000, percent: 25 },
    ]);
  });

  it('agregat boleh di atas 100.000.000', () => {
    const r = summarizeMonth([
      { category: 'food', amount: 60_000_000 },
      { category: 'food', amount: 60_000_000 },
    ]);
    expect(r.totalExpense).toBe(120_000_000);
    expect(r.expenseByCategory[0].amount).toBe(120_000_000);
  });

  it('kosong jika tidak ada pengeluaran', () => {
    expect(summarizeByCategory([])).toEqual([]);
  });
});
