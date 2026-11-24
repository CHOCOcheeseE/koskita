import { randomUUID } from 'node:crypto';
import { MemoryBillRepository, MemoryDb, MemoryGroupRepository } from '../../../test/support/in-memory';
import { SplitBillUseCases } from './split-bill.use-cases';

function setup() {
  const db = new MemoryDb();
  const user = (name: string) => {
    const id = randomUUID();
    db.users.set(id, { id, email: `${id}@x.id`, name, campus: null, createdAt: new Date(), passwordHash: 'x' });
    return id;
  };
  let seed = 0.1;
  const uc = new SplitBillUseCases(new MemoryGroupRepository(db), new MemoryBillRepository(db), () => (seed = (seed * 7.13 + 0.31) % 1));
  return { db, user, uc };
}

describe('SplitBillUseCases', () => {
  it('lintas grup: utang 10.000 di grup 1 dan piutang 5.000 di grup 2 tidak dinettokan', async () => {
    const { user, uc } = setup();
    const a = user('Ana');
    const b = user('Budi');
    const c = user('Cici');
    const g1 = await uc.createGroup(b, 'Grup Satu');
    await uc.joinGroup(a, g1.inviteCode);
    await uc.createBill(b, g1.id, { title: 'Listrik', totalAmount: 20_000, splitMethod: 'equal' });
    const g2 = await uc.createGroup(a, 'Grup Dua');
    await uc.joinGroup(c, g2.inviteCode.toLowerCase());
    await uc.createBill(a, g2.id, { title: 'Air', totalAmount: 10_000, splitMethod: 'equal' });

    expect(await uc.splitTotals(a)).toEqual({ hasGroups: true, totalIOwe: 10_000, totalOwedToMe: 5_000 });
    const groups = await uc.listMyGroups(a);
    expect(groups.map((g) => g.myNetBalance)).toEqual([5_000, -10_000]);
  });

  it('kode undangan bentrok dicoba ulang', async () => {
    const { user, db } = setup();
    const a = user('Ana');
    const codes = ['AAAAAA', 'AAAAAA', 'BBBBBB'];
    // random dibuat supaya createInviteCode menghasilkan kode berurutan di atas
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const chars = codes.join('').split('');
    const uc = new SplitBillUseCases(new MemoryGroupRepository(db), new MemoryBillRepository(db), () => {
      const ch = chars.shift() ?? 'C';
      return (alphabet.indexOf(ch) + 0.5) / alphabet.length;
    });
    const g1 = await uc.createGroup(a, 'Grup Satu');
    const g2 = await uc.createGroup(a, 'Grup Dua');
    expect(g1.inviteCode).toBe('AAAAAA');
    expect(g2.inviteCode).toBe('BBBBBB');
  });

  it('manual: bagian diurutkan menurut joinedAt dan peserta dobel ditolak 400', async () => {
    const { user, uc } = setup();
    const a = user('Ana');
    const b = user('Budi');
    const g = await uc.createGroup(a, 'Kos');
    await uc.joinGroup(b, g.inviteCode);
    const bill = await uc.createBill(a, g.id, {
      title: 'Wifi',
      totalAmount: 100,
      splitMethod: 'manual',
      shares: [
        { userId: b, amount: 70 },
        { userId: a, amount: 30 },
      ],
    });
    expect(bill.shares.map((s) => [s.userId, s.amount, s.status])).toEqual([
      [a, 30, 'lunas'],
      [b, 70, 'belum_bayar'],
    ]);
    await expect(
      uc.createBill(a, g.id, {
        title: 'Wifi',
        totalAmount: 100,
        splitMethod: 'manual',
        shares: [
          { userId: b, amount: 50 },
          { userId: b, amount: 50 },
        ],
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });
});
