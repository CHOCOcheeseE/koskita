import {
  canDeleteBill,
  computeNetBalances,
  createInviteCode,
  nextShareStatus,
  splitEqually,
  summarizeForUser,
} from './rules';

describe('splitEqually', () => {
  it('100.000 / 3 = 33.334, 33.333, 33.333', () => {
    expect(splitEqually(100_000, ['a', 'b', 'c']).map((s) => s.amount)).toEqual([33_334, 33_333, 33_333]);
  });

  it('sisa ke yang paling awal bergabung; Rp1 ke 3 orang', () => {
    expect(splitEqually(1, ['a', 'b', 'c'])).toEqual([
      { userId: 'a', amount: 1 },
      { userId: 'b', amount: 0 },
      { userId: 'c', amount: 0 },
    ]);
    expect(splitEqually(10, ['a', 'b', 'c', 'd']).map((s) => s.amount)).toEqual([3, 3, 2, 2]);
  });
});

describe('computeNetBalances', () => {
  it('A->B 70.000 dan B->A 20.000 jadi satu entri A->B 50.000', () => {
    expect(
      computeNetBalances([
        { from: 'A', to: 'B', amount: 70_000 },
        { from: 'B', to: 'A', amount: 20_000 },
      ]),
    ).toEqual([{ from: 'A', to: 'B', amount: 50_000 }]);
  });

  it('saldo silang tidak dinettokan lintas pasangan', () => {
    const entries = computeNetBalances([
      { from: 'A', to: 'B', amount: 10_000 },
      { from: 'C', to: 'A', amount: 10_000 },
    ]);
    expect(entries).toHaveLength(2);
    expect(summarizeForUser(entries, 'A')).toEqual({ totalIOwe: 10_000, totalOwedToMe: 10_000, isSettledForUser: false });
    expect(summarizeForUser(entries, 'D')).toEqual({ totalIOwe: 0, totalOwedToMe: 0, isSettledForUser: true });
  });

  it('pasangan yang saling lunas hilang; agregat di atas 100.000.000 aman', () => {
    expect(computeNetBalances([{ from: 'A', to: 'B', amount: 5 }, { from: 'B', to: 'A', amount: 5 }])).toEqual([]);
    expect(
      computeNetBalances([
        { from: 'A', to: 'B', amount: 60_000_000 },
        { from: 'A', to: 'B', amount: 60_000_000 },
      ]),
    ).toEqual([{ from: 'A', to: 'B', amount: 120_000_000 }]);
  });
});

describe('canDeleteBill', () => {
  const bill = {
    createdBy: 'B',
    payerId: 'A',
    shares: [
      { userId: 'A', status: 'lunas' as const },
      { userId: 'C', status: 'menunggu_konfirmasi' as const },
    ],
  };

  it('bagian pembayar lunas tidak menghalangi pembuat', () => {
    expect(canDeleteBill(bill, 'B')).toBe(true);
    expect(canDeleteBill(bill, 'A')).toBe(false);
  });

  it('bagian peserta lain lunas menghalangi', () => {
    expect(canDeleteBill({ ...bill, shares: [...bill.shares, { userId: 'D', status: 'lunas' as const }] }, 'B')).toBe(false);
  });
});

describe('nextShareStatus', () => {
  it('transisi yang sah', () => {
    expect(nextShareStatus('belum_bayar', 'mark-paid', 'owner')).toBe('menunggu_konfirmasi');
    expect(nextShareStatus('menunggu_konfirmasi', 'confirm', 'payer')).toBe('lunas');
    expect(nextShareStatus('belum_bayar', 'confirm', 'payer')).toBe('lunas');
    expect(nextShareStatus('menunggu_konfirmasi', 'reject', 'payer')).toBe('belum_bayar');
  });

  it('transisi tidak sah melempar INVALID_SHARE_TRANSITION', () => {
    expect(() => nextShareStatus('lunas', 'mark-paid', 'owner')).toThrow(expect.objectContaining({ code: 'INVALID_SHARE_TRANSITION' }));
    expect(() => nextShareStatus('belum_bayar', 'reject', 'payer')).toThrow(expect.objectContaining({ status: 409 }));
  });
});

describe('createInviteCode', () => {
  it('6 karakter dari alfabet tanpa O, 0, I, 1', () => {
    let seed = 0.123;
    const code = createInviteCode(() => (seed = (seed * 9301 + 0.49297) % 1));
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(createInviteCode(() => 0.999999)).toBe('999999');
  });
});
