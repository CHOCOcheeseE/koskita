import { randomUUID } from 'node:crypto';
import { createTestApp, expectError, registerUser, Session, TestApp } from './support/app';

describe('wallet (e2e)', () => {
  let t: TestApp;
  let me: Session;

  beforeAll(async () => {
    // Sabtu 21 November 2026 10:00 WIB: sisa 10 hari termasuk hari ini.
    t = await createTestApp(new Date('2026-11-21T03:00:00Z'));
    me = await registerUser(t, 'Dompet');
  });

  afterAll(async () => {
    await t.close();
  });

  const tx = (body: Record<string, unknown>, s: Session = me) => t.http.post('/v1/wallet/transactions').set(s.auth).send(body);

  it('GET categories: 10 kategori dengan label', async () => {
    const res = await t.http.get('/v1/wallet/categories').set(me.auth).expect(200);
    expect(res.body.items).toHaveLength(10);
    expect(res.body.items[0]).toEqual({ code: 'food', type: 'expense', label: 'Makan' });
  });

  it('401 tanpa token', async () => {
    expectError((await t.http.get('/v1/wallet/categories').expect(401)).body, 'UNAUTHENTICATED');
  });

  describe('transaksi', () => {
    it('POST 201, GET, PATCH, DELETE', async () => {
      const created = await tx({ type: 'expense', amount: 15000, category: 'food', date: '2026-11-21', note: ' Nasi padang ' }).expect(201);
      expect(created.body).toEqual({
        id: expect.any(String),
        type: 'expense',
        amount: 15000,
        category: 'food',
        date: '2026-11-21',
        note: 'Nasi padang',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      const id = created.body.id;
      await t.http.get(`/v1/wallet/transactions/${id}`).set(me.auth).expect(200);

      const patched = await t.http.patch(`/v1/wallet/transactions/${id}`).set(me.auth).send({ amount: 20000, note: null }).expect(200);
      expect(patched.body).toMatchObject({ amount: 20000, note: null, category: 'food' });

      await t.http.delete(`/v1/wallet/transactions/${id}`).set(me.auth).expect(204);
      expectError((await t.http.get(`/v1/wallet/transactions/${id}`).set(me.auth).expect(404)).body, 'NOT_FOUND');
    });

    it('422 DATE_IN_FUTURE untuk tanggal besok', async () => {
      expectError((await tx({ type: 'expense', amount: 1000, category: 'food', date: '2026-11-22' }).expect(422)).body, 'DATE_IN_FUTURE');
    });

    it('422 CATEGORY_TYPE_MISMATCH, juga lewat PATCH sebagian', async () => {
      expectError((await tx({ type: 'income', amount: 1000, category: 'food', date: '2026-11-21' }).expect(422)).body, 'CATEGORY_TYPE_MISMATCH');
      const created = await tx({ type: 'expense', amount: 1000, category: 'food', date: '2026-11-20' }).expect(201);
      const res = await t.http.patch(`/v1/wallet/transactions/${created.body.id}`).set(me.auth).send({ category: 'allowance' }).expect(422);
      expectError(res.body, 'CATEGORY_TYPE_MISMATCH');
      await t.http.patch(`/v1/wallet/transactions/${created.body.id}`).set(me.auth).send({ type: 'income', category: 'allowance' }).expect(200);
      await t.http.delete(`/v1/wallet/transactions/${created.body.id}`).set(me.auth).expect(204);
    });

    it('400 untuk nominal 0, desimal, string, dan tanggal tidak ada', async () => {
      for (const amount of [0, 1.5, '5000', 100_000_001]) {
        const res = await tx({ type: 'expense', amount, category: 'food', date: '2026-11-21' }).expect(400);
        expect(res.body.error.details.amount).toBeDefined();
      }
      const res = await tx({ type: 'expense', amount: 1000, category: 'food', date: '2026-02-30' }).expect(400);
      expect(res.body.error.details.date).toBeDefined();
      expectError((await tx({ type: 'expense', amount: 1000, category: 'kopi', date: '2026-11-21' }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('transaksi orang lain -> 404; ID bukan UUID -> 404', async () => {
      const other = await registerUser(t, 'Orang Lain');
      const theirs = await tx({ type: 'expense', amount: 1000, category: 'food', date: '2026-11-21' }, other).expect(201);
      expectError((await t.http.get(`/v1/wallet/transactions/${theirs.body.id}`).set(me.auth).expect(404)).body, 'NOT_FOUND');
      await t.http.patch(`/v1/wallet/transactions/${theirs.body.id}`).set(me.auth).send({ amount: 1 }).expect(404);
      await t.http.delete(`/v1/wallet/transactions/${theirs.body.id}`).set(me.auth).expect(404);
      await t.http.get('/v1/wallet/transactions/bukan-uuid').set(me.auth).expect(404);
      await t.http.get(`/v1/wallet/transactions/${randomUUID()}`).set(me.auth).expect(404);
    });

    it('GET list: urut terbaru, paginasi kursor, filter bulan', async () => {
      const s = await registerUser(t, 'Paginasi');
      for (const date of ['2026-11-01', '2026-11-15', '2026-11-15', '2026-11-20', '2026-10-31']) {
        await tx({ type: 'expense', amount: 1000, category: 'transport', date }, s).expect(201);
      }
      const p1 = await t.http.get('/v1/wallet/transactions?month=2026-11&limit=2').set(s.auth).expect(200);
      expect(p1.body.items.map((i: { date: string }) => i.date)).toEqual(['2026-11-20', '2026-11-15']);
      expect(p1.body.nextCursor).toEqual(expect.any(String));
      const p2 = await t.http.get(`/v1/wallet/transactions?month=2026-11&limit=2&cursor=${p1.body.nextCursor}`).set(s.auth).expect(200);
      expect(p2.body.items.map((i: { date: string }) => i.date)).toEqual(['2026-11-15', '2026-11-01']);
      expect(p2.body.items[0].id).not.toBe(p1.body.items[1].id);
      expect(p2.body.nextCursor).toBeNull();

      const all = await t.http.get('/v1/wallet/transactions?month=2026-11').set(s.auth).expect(200);
      expect(all.body.items).toHaveLength(4);
      expect(all.body.nextCursor).toBeNull();
    });

    it('GET list 422 MONTH_IN_FUTURE, 400 bulan salah/kursor rusak/limit', async () => {
      expectError((await t.http.get('/v1/wallet/transactions?month=2026-12').set(me.auth).expect(422)).body, 'MONTH_IN_FUTURE');
      expectError((await t.http.get('/v1/wallet/transactions?month=2026-13').set(me.auth).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await t.http.get('/v1/wallet/transactions').set(me.auth).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await t.http.get('/v1/wallet/transactions?month=2026-11&cursor=zzz').set(me.auth).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await t.http.get('/v1/wallet/transactions?month=2026-11&limit=101').set(me.auth).expect(400)).body, 'VALIDATION_FAILED');
    });
  });

  describe('ringkasan bulan', () => {
    it('dua transaksi Makan 60.000.000 -> CategoryTotal 120.000.000', async () => {
      const s = await registerUser(t, 'Sultan');
      await tx({ type: 'expense', amount: 60_000_000, category: 'food', date: '2026-11-02' }, s).expect(201);
      await tx({ type: 'expense', amount: 60_000_000, category: 'food', date: '2026-11-03' }, s).expect(201);
      await tx({ type: 'expense', amount: 40_000_000, category: 'transport', date: '2026-11-03' }, s).expect(201);
      await tx({ type: 'income', amount: 5_000_000, category: 'allowance', date: '2026-11-01' }, s).expect(201);
      const res = await t.http.get('/v1/wallet/months/2026-11/summary').set(s.auth).expect(200);
      expect(res.body).toEqual({
        month: '2026-11',
        totalIncome: 5_000_000,
        totalExpense: 160_000_000,
        expenseByCategory: [
          { category: 'food', label: 'Makan', amount: 120_000_000, percent: 75 },
          { category: 'transport', label: 'Transport', amount: 40_000_000, percent: 25 },
        ],
      });
    });

    it('bulan kosong -> expenseByCategory []; bulan depan -> 422', async () => {
      const s = await registerUser(t);
      const res = await t.http.get('/v1/wallet/months/2026-10/summary').set(s.auth).expect(200);
      expect(res.body).toEqual({ month: '2026-10', totalIncome: 0, totalExpense: 0, expenseByCategory: [] });
      expectError((await t.http.get('/v1/wallet/months/2027-01/summary').set(s.auth).expect(422)).body, 'MONTH_IN_FUTURE');
      expectError((await t.http.get('/v1/wallet/months/11-2026/summary').set(s.auth).expect(400)).body, 'VALIDATION_FAILED');
    });
  });

  describe('anggaran', () => {
    it('404 BUDGET_NOT_FOUND sebelum diatur', async () => {
      const s = await registerUser(t);
      expectError((await t.http.get('/v1/wallet/budgets/2026-11').set(s.auth).expect(404)).body, 'BUDGET_NOT_FOUND');
    });

    it('PUT bulan berjalan + jatah harian contoh kontrak', async () => {
      const s = await registerUser(t, 'Hemat');
      await tx({ type: 'expense', amount: 1_000_000, category: 'housing_bills', date: '2026-11-05' }, s).expect(201);
      await tx({ type: 'expense', amount: 20_000, category: 'food', date: '2026-11-21' }, s).expect(201);
      await tx({ type: 'income', amount: 3_000_000, category: 'allowance', date: '2026-11-01' }, s).expect(201);

      const put = await t.http.put('/v1/wallet/budgets/2026-11').set(s.auth).send({ amount: 1_500_000 }).expect(200);
      expect(put.body).toEqual({
        month: '2026-11',
        amount: 1_500_000,
        totalExpense: 1_020_000,
        remainingBudget: 480_000,
        overBudgetAmount: 0,
        today: {
          date: '2026-11-21',
          daysLeftIncludingToday: 10,
          spentBeforeToday: 1_000_000,
          spentToday: 20_000,
          dailyAllowance: 50_000,
          remainingToday: 30_000,
          overTodayAmount: 0,
        },
      });
      const get = await t.http.get('/v1/wallet/budgets/2026-11').set(s.auth).expect(200);
      expect(get.body).toEqual(put.body);
    });

    it('anggaran terlampaui -> dailyAllowance 0, overBudgetAmount > 0', async () => {
      const s = await registerUser(t);
      await tx({ type: 'expense', amount: 600_000, category: 'leisure', date: '2026-11-10' }, s).expect(201);
      const res = await t.http.put('/v1/wallet/budgets/2026-11').set(s.auth).send({ amount: 500_000 }).expect(200);
      expect(res.body.overBudgetAmount).toBe(100_000);
      expect(res.body.remainingBudget).toBe(0);
      expect(res.body.today.dailyAllowance).toBe(0);
    });

    it('422 MONTH_NOT_EDITABLE untuk bulan lain; 400 nominal salah', async () => {
      expectError((await t.http.put('/v1/wallet/budgets/2026-10').set(me.auth).send({ amount: 1000 }).expect(422)).body, 'MONTH_NOT_EDITABLE');
      expectError((await t.http.put('/v1/wallet/budgets/2026-11').set(me.auth).send({ amount: 0 }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('batas hari WIB: 1 Desember 00:30 WIB transaksi 1 Desember diterima dan anggaran Desember', async () => {
      const t2 = await createTestApp(new Date('2026-11-30T17:30:00Z'));
      const s = await registerUser(t2);
      await t2.http.post('/v1/wallet/transactions').set(s.auth).send({ type: 'expense', amount: 1000, category: 'food', date: '2026-12-01' }).expect(201);
      const res = await t2.http.put('/v1/wallet/budgets/2026-12').set(s.auth).send({ amount: 310_000 }).expect(200);
      expect(res.body.today).toMatchObject({ date: '2026-12-01', daysLeftIncludingToday: 31, spentBeforeToday: 0, spentToday: 1000, dailyAllowance: 10_000 });
      await t2.close();
    });
  });
});
