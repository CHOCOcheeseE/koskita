import { createAuthUseCases, initialsOf, type AuthRepository } from '../src/domain/auth/auth';
import { addDays, isoDayOfWeekWib, monthWib, shiftMonth, timeWibOf, todayWib, wibToUtcIso } from '../src/domain/shared/wib';
import {
  balanceSentences,
  counterpartiesOf,
  groupBalanceState,
  hasAmbiguousInviteChars,
  manualSplitGap,
  normalizeInviteCode,
  shareActionsFor,
  type Bill,
  type BillShare,
} from '../src/domain/split-bill/split-bill';
import { deadlineBadge, isTimeRangeValid } from '../src/domain/study/study';
import { budgetUsageRatio, groupByDate, type Transaction } from '../src/domain/wallet/wallet';

const A = { userId: 'a', name: 'Ayu' };
const B = { userId: 'b', name: 'Budi' };
const C = { userId: 'c', name: 'Cici' };

function share(user: { userId: string; name: string }, status: BillShare['status']): BillShare {
  return { id: `s-${user.userId}`, user, amount: 10_000, status, updatedAt: '2026-11-24T03:00:00Z' };
}

function billPaidBy(payer: { userId: string; name: string }, shares: BillShare[]): Bill {
  return {
    id: 'bill',
    groupId: 'g',
    title: 'Wifi',
    totalAmount: 30_000,
    splitMethod: 'equal',
    payer,
    createdBy: payer,
    status: 'open',
    shares,
    canDelete: true,
    createdAt: '2026-11-24T03:00:00Z',
  };
}

describe('wib', () => {
  it('batas hari WIB: 23:30 WIB 30 Nov masih November, 00:30 WIB 1 Des sudah Desember', () => {
    expect(todayWib(new Date('2026-11-30T16:30:00Z'))).toBe('2026-11-30');
    expect(monthWib(new Date('2026-11-30T17:30:00Z'))).toBe('2026-12');
  });

  it('wibToUtcIso: jam dinding WIB jadi UTC Z, termasuk lewat tengah malam', () => {
    expect(wibToUtcIso('2026-11-24', '23:59')).toBe('2026-11-24T16:59:00Z');
    expect(wibToUtcIso('2026-12-01', '05:00')).toBe('2026-11-30T22:00:00Z');
    expect(timeWibOf('2026-11-30T22:00:00Z')).toBe('05:00');
  });

  it('addDays dan shiftMonth lintas tahun dan tahun kabisat', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('hari ISO WIB: Minggu = 7', () => {
    expect(isoDayOfWeekWib(new Date('2026-11-29T03:00:00Z'))).toBe(7);
    expect(isoDayOfWeekWib(new Date('2026-11-29T17:30:00Z'))).toBe(1);
  });
});

describe('patungan', () => {
  it('aksi per peran (desain P6)', () => {
    const b = billPaidBy(A, [share(A, 'lunas'), share(B, 'belum_bayar'), share(C, 'menunggu_konfirmasi')]);
    expect(shareActionsFor(b, b.shares[1], 'b')).toEqual(['mark-paid']);
    expect(shareActionsFor(b, b.shares[1], 'a')).toEqual(['confirm']);
    expect(shareActionsFor(b, b.shares[2], 'a')).toEqual(['confirm', 'reject']);
    expect(shareActionsFor(b, b.shares[0], 'a')).toEqual([]);
    expect(shareActionsFor(b, b.shares[2], 'c')).toEqual([]);
    expect(shareActionsFor(b, b.shares[1], 'c')).toEqual([]);
  });

  it('kalimat saldo: entri yang melibatkan saya di atas', () => {
    const s = balanceSentences(
      [
        { from: B, to: C, amount: 5_000 },
        { from: A, to: B, amount: 3_000 },
        { from: C, to: A, amount: 1_000 },
      ],
      'a',
    );
    expect(s.map((x) => x.text)).toEqual(['Kamu utang ke Budi', 'Cici utang ke kamu', 'Budi utang ke Cici']);
    expect(counterpartiesOf([{ from: A, to: B, amount: 1 }, { from: C, to: A, amount: 1 }], 'a')).toEqual(['Budi', 'Cici']);
  });

  it('keadaan saldo grup, termasuk netto nol tapi belum lunas (silang)', () => {
    expect(groupBalanceState({ myNetBalance: 0, isSettledForMe: true })).toEqual({ kind: 'settled' });
    expect(groupBalanceState({ myNetBalance: -5, isSettledForMe: false })).toEqual({ kind: 'i-owe', amount: 5 });
    expect(groupBalanceState({ myNetBalance: 7, isSettledForMe: false })).toEqual({ kind: 'owed-to-me', amount: 7 });
    expect(groupBalanceState({ myNetBalance: 0, isSettledForMe: false })).toEqual({ kind: 'crossed' });
  });

  it('kode undangan: spasi dibuang, huruf kecil jadi besar, huruf ambigu terdeteksi', () => {
    expect(normalizeInviteCode(' ab c2 3d ')).toBe('ABC23D');
    expect(hasAmbiguousInviteChars('abc0de')).toBe(true);
    expect(hasAmbiguousInviteChars('ABC234')).toBe(false);
  });

  it('selisih bagi manual', () => {
    expect(manualSplitGap(50_000, [20_000, 20_000])).toBe(10_000);
    expect(manualSplitGap(50_000, [30_000, 30_000])).toBe(-10_000);
    expect(manualSplitGap(50_000, [25_000, 25_000])).toBe(0);
  });
});

describe('kuliah', () => {
  it('lencana deadline: Hari ini / Besok dari tanggal WIB, bukan tanggal UTC', () => {
    // 23:00 WIB 24 Nov = 16:00Z 24 Nov
    expect(deadlineBadge({ deadline: '2026-11-24T16:00:00Z', deadlineLabel: 'due_soon' }, '2026-11-24')).toBe('today');
    // 06:00 WIB 25 Nov = 23:00Z 24 Nov (tanggal UTC masih 24, harus tetap "Besok")
    expect(deadlineBadge({ deadline: '2026-11-24T23:00:00Z', deadlineLabel: 'due_soon' }, '2026-11-24')).toBe('tomorrow');
    expect(deadlineBadge({ deadline: '2026-11-20T00:00:00Z', deadlineLabel: 'overdue' }, '2026-11-24')).toBe('overdue');
    expect(deadlineBadge({ deadline: '2026-12-20T00:00:00Z', deadlineLabel: null }, '2026-11-24')).toBeNull();
  });

  it('rentang jam: selesai harus setelah mulai', () => {
    expect(isTimeRangeValid('08:00', '09:40')).toBe(true);
    expect(isTimeRangeValid('08:00', '08:00')).toBe(false);
    expect(isTimeRangeValid('10:00', '09:00')).toBe(false);
  });
});

describe('dompet', () => {
  it('kelompok per tanggal mengikuti urutan API', () => {
    const t = (id: string, date: string) => ({ id, date }) as Transaction;
    const groups = groupByDate([t('1', '2026-11-24'), t('2', '2026-11-24'), t('3', '2026-11-23')]);
    expect(groups.map((g) => [g.date, g.items.length])).toEqual([
      ['2026-11-24', 2],
      ['2026-11-23', 1],
    ]);
  });

  it('rasio bilah anggaran dibatasi 0..1', () => {
    expect(budgetUsageRatio({ amount: 100, totalExpense: 250 })).toBe(1);
    expect(budgetUsageRatio({ amount: 0, totalExpense: 10 })).toBe(0);
    expect(budgetUsageRatio({ amount: 200, totalExpense: 50 })).toBe(0.25);
  });
});

describe('auth', () => {
  it('inisial avatar', () => {
    expect(initialsOf('  ayu  lestari ')).toBe('AL');
    expect(initialsOf('rina')).toBe('RI');
    expect(initialsOf('   ')).toBe('?');
  });

  it('kampus kosong/spasi dikirim null, email dirapikan saat masuk', async () => {
    const calls: unknown[] = [];
    const repo = {
      updateProfile: async (input: unknown) => {
        calls.push(input);
        return {} as never;
      },
      login: async (input: unknown) => {
        calls.push(input);
        return {} as never;
      },
    } as unknown as AuthRepository;
    const uc = createAuthUseCases(repo);
    await uc.updateProfile({ campus: '   ' });
    await uc.login({ email: '  Rina@Kampus.AC.ID ', password: ' rahasia ' });
    expect(calls).toEqual([{ campus: null }, { email: 'rina@kampus.ac.id', password: ' rahasia ' }]);
  });

  it('keluar tetap berhasil walau server tidak bisa dihubungi', async () => {
    const repo = {
      logout: async () => {
        throw new Error('jaringan putus');
      },
    } as unknown as AuthRepository;
    await createAuthUseCases(repo).logout();
  });
});
