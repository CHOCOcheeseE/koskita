import { randomUUID } from 'node:crypto';
import { createTestApp, expectError, registerUser, Session, TestApp } from './support/app';

/**
 * Tes kasus tepi dari QA (Gilang).
 * `it.failing` = bug yang sudah dilaporkan di docs/qa; tes ini akan merah begitu bug diperbaiki,
 * lalu ganti `it.failing` menjadi `it`. BUG-01 dan BUG-02 sudah diperbaiki (review ulang ke-1),
 * BUG-04 di review ulang ke-2. BUG-05 masih terbuka.
 */
const cursorOf = (v: string, i: string) => Buffer.from(JSON.stringify({ v, i }), 'utf8').toString('base64url');

// BUG-04: tanggal valid di JavaScript tapi di luar rentang PostgreSQL (timestamptz minimal 4713 SM).
// Di in-memory request ini dibalas 200; di PostgreSQL query gagal dan filter membalas 500 INTERNAL_ERROR.
const FAR_PAST = '-010000-01-01T00:00:00.000Z';

describe('QA kasus tepi (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  const tx = (s: Session, body: Record<string, unknown>) => t.http.post('/v1/wallet/transactions').set(s.auth).send(body);

  describe('dompet', () => {
    it('nominal nol, negatif, pecahan, string, dan di atas batas ditolak 400', async () => {
      const a = await registerUser(t);
      const base = { type: 'expense', category: 'food', date: '2026-11-24' };
      for (const amount of [0, -1, 1.5, '1000', 100_000_001, null]) {
        expectError((await tx(a, { ...base, amount }).expect(400)).body, 'VALIDATION_FAILED');
      }
      await tx(a, { ...base, amount: 100_000_000 }).expect(201);
      expectError((await t.http.put('/v1/wallet/budgets/2026-11').set(a.auth).send({ amount: 0 }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('tanggal tidak ada di kalender 400, tanggal besok 422 DATE_IN_FUTURE', async () => {
      const a = await registerUser(t);
      const base = { type: 'expense', amount: 1000, category: 'food' };
      expectError((await tx(a, { ...base, date: '2026-02-30' }).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await tx(a, { ...base, date: '2026-11-25' }).expect(422)).body, 'DATE_IN_FUTURE');
    });

    it('catatan 101 karakter ditolak, catatan spasi saja disimpan null', async () => {
      const a = await registerUser(t);
      const base = { type: 'expense', amount: 1000, category: 'food', date: '2026-11-24' };
      expectError((await tx(a, { ...base, note: 'x'.repeat(101) }).expect(400)).body, 'VALIDATION_FAILED');
      const ok = await tx(a, { ...base, note: '    ' }).expect(201);
      expect(ok.body.note).toBeNull();
    });

    it('transaksi milik orang lain: GET/PATCH/DELETE 404, data tidak berubah', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const created = await tx(a, { type: 'expense', amount: 5000, category: 'food', date: '2026-11-24' }).expect(201);
      const path = `/v1/wallet/transactions/${created.body.id}`;
      await t.http.get(path).set(b.auth).expect(404);
      await t.http.patch(path).set(b.auth).send({ amount: 1 }).expect(404);
      await t.http.delete(path).set(b.auth).expect(404);
      const still = await t.http.get(path).set(a.auth).expect(200);
      expect(still.body.amount).toBe(5000);
    });

    it('PATCH ganti tipe tanpa ganti kategori 422 CATEGORY_TYPE_MISMATCH', async () => {
      const a = await registerUser(t);
      const created = await tx(a, { type: 'expense', amount: 5000, category: 'food', date: '2026-11-24' }).expect(201);
      const res = await t.http.patch(`/v1/wallet/transactions/${created.body.id}`).set(a.auth).send({ type: 'income' }).expect(422);
      expectError(res.body, 'CATEGORY_TYPE_MISMATCH');
    });

    it('paginasi sampai habis: tidak ada item dobel atau terlewat, halaman terakhir nextCursor null', async () => {
      const a = await registerUser(t);
      for (let i = 1; i <= 5; i++) {
        await tx(a, { type: 'expense', amount: i * 1000, category: 'food', date: `2026-11-0${i}` }).expect(201);
      }
      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const query: Record<string, string | number> = { month: '2026-11', limit: 2 };
        if (cursor) query.cursor = cursor;
        const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query(query).expect(200);
        const body = res.body as { items: { id: string }[]; nextCursor: string | null };
        seen.push(...body.items.map((x) => x.id));
        cursor = body.nextCursor;
        pages += 1;
      } while (cursor && pages < 10);
      expect(pages).toBe(3);
      expect(new Set(seen).size).toBe(5);
    });

    it('limit 0, 101, dan bukan angka ditolak 400', async () => {
      const a = await registerUser(t);
      for (const limit of ['0', '101', 'abc']) {
        const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', limit }).expect(400);
        expectError(res.body, 'VALIDATION_FAILED');
      }
    });

    it('kursor rusak (bukan base64 JSON) 400', async () => {
      const a = await registerUser(t);
      const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor: '!!!' }).expect(400);
      expectError(res.body, 'VALIDATION_FAILED');
    });

    // BUG-01: bagian `i` kursor tidak divalidasi UUID. Di PostgreSQL kolom id bertipe uuid,
    // sehingga Prisma gagal (P2023) dan respons jadi 500. Kontrak hanya mengenal 400 untuk kursor rusak.
    it('BUG-01: kursor dengan id bukan UUID harus 400 (transaksi)', async () => {
      const a = await registerUser(t);
      await tx(a, { type: 'expense', amount: 1000, category: 'food', date: '2026-11-24' }).expect(201);
      const cursor = cursorOf(`2026-11-24|${new Date().toISOString()}`, 'bukan-uuid');
      const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor });
      expect(res.status).toBe(400);
    });

    // BUG-01 (lanjutan): tanggal di kursor hanya dicek pola, "2026-13-45" lolos lalu jadi Invalid Date di Prisma.
    it('BUG-01: kursor dengan tanggal mustahil harus 400 (transaksi)', async () => {
      const a = await registerUser(t);
      const cursor = cursorOf(`2026-13-45|${new Date().toISOString()}`, randomUUID());
      const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor });
      expect(res.status).toBe(400);
    });

    it('kursor dengan id UUID huruf besar tetap diterima (200)', async () => {
      const a = await registerUser(t);
      const cursor = cursorOf(`2026-11-24|${new Date().toISOString()}`, randomUUID().toUpperCase());
      await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor }).expect(200);
    });

    it('kursor JSON bukan objek (array, angka, null) 400', async () => {
      const a = await registerUser(t);
      for (const raw of ['[]', '123', 'null', '{"v":1,"i":"x"}']) {
        const cursor = Buffer.from(raw, 'utf8').toString('base64url');
        const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor }).expect(400);
        expectError(res.body, 'VALIDATION_FAILED');
      }
    });

    it('BUG-04: kursor transaksi dengan createdAt di luar rentang PostgreSQL harus 400', async () => {
      const a = await registerUser(t);
      const cursor = cursorOf(`2026-11-24|${FAR_PAST}`, randomUUID());
      const res = await t.http.get('/v1/wallet/transactions').set(a.auth).query({ month: '2026-11', cursor });
      expect(res.status).toBe(400);
    });
  });

  describe('patungan', () => {
    async function groupOf(owner: Session, others: Session[]): Promise<{ id: string; inviteCode: string }> {
      const g = await t.http.post('/v1/groups').set(owner.auth).send({ name: 'Kos QA' }).expect(201);
      for (const o of others) {
        await t.http.post('/v1/groups/join').set(o.auth).send({ inviteCode: g.body.inviteCode }).expect(200);
      }
      return g.body;
    }
    const bill = (s: Session, groupId: string, body: Record<string, unknown>) =>
      t.http.post(`/v1/groups/${groupId}/bills`).set(s.auth).send(body);

    it('participantIds dobel 400, peserta bukan anggota 422, pembayar bukan anggota 422', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const x = await registerUser(t);
      const g = await groupOf(a, [b]);
      const base = { title: 'Galon', totalAmount: 20_000, splitMethod: 'equal' };
      expectError((await bill(a, g.id, { ...base, participantIds: [a.userId, a.userId] }).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await bill(a, g.id, { ...base, participantIds: [a.userId, x.userId] }).expect(422)).body, 'PARTICIPANT_NOT_MEMBER');
      expectError((await bill(a, g.id, { ...base, payerId: x.userId }).expect(422)).body, 'PARTICIPANT_NOT_MEMBER');
    });

    it('bagi rata ganjil: jumlah bagian = total, sisa Rp1 ke yang paling awal gabung', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const c = await registerUser(t);
      const g = await groupOf(a, [b, c]);
      const res = await bill(b, g.id, { title: 'Wifi', totalAmount: 100_001, splitMethod: 'equal' }).expect(201);
      const amounts = res.body.shares.map((s: { amount: number }) => s.amount);
      expect(amounts).toEqual([33_334, 33_334, 33_333]);
      expect(amounts.reduce((x: number, y: number) => x + y, 0)).toBe(100_001);
      const payerShare = res.body.shares.find((s: { user: { userId: string } }) => s.user.userId === b.userId);
      expect(payerShare.status).toBe('lunas');
    });

    it('bagi manual: selisih 422, userId dobel 400, judul spasi saja 400', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const res = await bill(a, g.id, {
        title: 'Makan',
        totalAmount: 50_000,
        splitMethod: 'manual',
        shares: [
          { userId: a.userId, amount: 20_000 },
          { userId: b.userId, amount: 20_000 },
        ],
      }).expect(422);
      expectError(res.body, 'SHARES_SUM_MISMATCH');
      const dup = await bill(a, g.id, {
        title: 'Makan',
        totalAmount: 50_000,
        splitMethod: 'manual',
        shares: [
          { userId: b.userId, amount: 25_000 },
          { userId: b.userId, amount: 25_000 },
        ],
      }).expect(400);
      expectError(dup.body, 'VALIDATION_FAILED');
      expectError((await bill(a, g.id, { title: '     ', totalAmount: 1000, splitMethod: 'equal' }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('alur lengkap: mark-paid, tolak, mark-paid lagi, terima, tagihan settled, boleh keluar grup', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const created = await bill(a, g.id, { title: 'Listrik', totalAmount: 40_000, splitMethod: 'equal' }).expect(201);
      const share = created.body.shares.find((s: { user: { userId: string } }) => s.user.userId === b.userId);
      const act = (s: Session, action: string) => t.http.post(`/v1/bills/${created.body.id}/shares/${share.id}/${action}`).set(s.auth);

      expectError((await t.http.post(`/v1/groups/${g.id}/leave`).set(b.auth).expect(409)).body, 'BALANCE_NOT_SETTLED');
      expectError((await act(a, 'mark-paid').expect(403)).body, 'NOT_SHARE_OWNER');
      expectError((await act(b, 'confirm').expect(403)).body, 'NOT_BILL_PAYER');
      await act(b, 'mark-paid').expect(200);
      expectError((await act(b, 'mark-paid').expect(409)).body, 'INVALID_SHARE_TRANSITION');
      await act(a, 'reject').expect(200);
      await act(b, 'mark-paid').expect(200);
      const done = await act(a, 'confirm').expect(200);
      expect(done.body.status).toBe('settled');
      expect(done.body.canDelete).toBe(false);
      expectError((await t.http.delete(`/v1/bills/${created.body.id}`).set(a.auth).expect(409)).body, 'BILL_HAS_PAYMENTS');
      await t.http.post(`/v1/groups/${g.id}/leave`).set(b.auth).expect(204);
      expectError((await t.http.get(`/v1/bills/${created.body.id}`).set(b.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
    });

    it('saldo silang dinetto per pasangan', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      await bill(a, g.id, { title: 'Beras', totalAmount: 30_000, splitMethod: 'equal' }).expect(201);
      await bill(b, g.id, { title: 'Sabun', totalAmount: 10_000, splitMethod: 'equal' }).expect(201);
      const res = await t.http.get(`/v1/groups/${g.id}/balances`).set(a.auth).expect(200);
      expect(res.body.entries).toEqual([{ from: { userId: b.userId, name: expect.any(String) }, to: { userId: a.userId, name: expect.any(String) }, amount: 10_000 }]);
      expect(res.body.totalOwedToMe).toBe(10_000);
      expect(res.body.totalIOwe).toBe(0);
    });

    it('share id dari tagihan lain 404', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const one = await bill(a, g.id, { title: 'Satu', totalAmount: 2000, splitMethod: 'equal' }).expect(201);
      const two = await bill(a, g.id, { title: 'Dua', totalAmount: 2000, splitMethod: 'equal' }).expect(201);
      const shareOfTwo = two.body.shares[1].id;
      await t.http.post(`/v1/bills/${one.body.id}/shares/${shareOfTwo}/confirm`).set(a.auth).expect(404);
    });

    it('BUG-01: kursor tagihan dengan id bukan UUID harus 400', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const cursor = cursorOf(new Date().toISOString(), 'bukan-uuid');
      const res = await t.http.get(`/v1/groups/${g.id}/bills`).set(a.auth).query({ cursor });
      expect(res.status).toBe(400);
    });

    it('BUG-04: kursor tagihan dengan tanggal di luar rentang PostgreSQL harus 400', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const cursor = cursorOf(FAR_PAST, randomUUID());
      const res = await t.http.get(`/v1/groups/${g.id}/bills`).set(a.auth).query({ cursor });
      expect(res.status).toBe(400);
    });
  });

  describe('kuliah', () => {
    it('jam selesai = jam mulai 422, jam 24:00 400', async () => {
      const a = await registerUser(t);
      const base = { courseName: 'Kalkulus', dayOfWeek: 1 };
      const same = await t.http.post('/v1/study/schedules').set(a.auth).send({ ...base, startTime: '08:00', endTime: '08:00' }).expect(422);
      expectError(same.body, 'TIME_RANGE_INVALID');
      const bad = await t.http.post('/v1/study/schedules').set(a.auth).send({ ...base, startTime: '08:00', endTime: '24:00' }).expect(400);
      expectError(bad.body, 'VALIDATION_FAILED');
    });

    it('tugas ke jadwal milik orang lain 422 SCHEDULE_NOT_FOUND', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const s = await t.http.post('/v1/study/schedules').set(b.auth).send({ courseName: 'Fisika', dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }).expect(201);
      const res = await t.http.post('/v1/study/tasks').set(a.auth).send({ title: 'Laporan', scheduleId: s.body.id, deadline: '2026-11-30T16:59:00Z' }).expect(422);
      expectError(res.body, 'SCHEDULE_NOT_FOUND');
    });

    it('tugas selesai lalu dibuka lagi: completedAt kembali null', async () => {
      const a = await registerUser(t);
      const task = await t.http.post('/v1/study/tasks').set(a.auth).send({ title: 'Kuis', deadline: '2026-11-30T16:59:00Z' }).expect(201);
      const done = await t.http.patch(`/v1/study/tasks/${task.body.id}`).set(a.auth).send({ status: 'selesai' }).expect(200);
      expect(done.body.completedAt).toEqual(expect.any(String));
      expect(done.body.deadlineLabel).toBeNull();
      const back = await t.http.patch(`/v1/study/tasks/${task.body.id}`).set(a.auth).send({ status: 'belum' }).expect(200);
      expect(back.body.completedAt).toBeNull();
    });

    it('BUG-01: kursor tugas dengan id bukan UUID harus 400', async () => {
      const a = await registerUser(t);
      const cursor = cursorOf(new Date().toISOString(), 'bukan-uuid');
      const res = await t.http.get('/v1/study/tasks').set(a.auth).query({ status: 'belum', cursor });
      expect(res.status).toBe(400);
    });

    it('BUG-04: kursor tugas dengan deadline di luar rentang PostgreSQL harus 400', async () => {
      const a = await registerUser(t);
      const cursor = cursorOf(FAR_PAST, randomUUID());
      const res = await t.http.get('/v1/study/tasks').set(a.auth).query({ status: 'belum', cursor });
      expect(res.status).toBe(400);
    });

    it('kursor tugas: tanggal tanpa zona, tahun 6 digit positif, dan tanggal mustahil 400', async () => {
      const a = await registerUser(t);
      for (const v of ['2026-11-24T03:00:00', '+010000-01-01T00:00:00.000Z', '2026-02-30T00:00:00Z', '']) {
        const res = await t.http.get('/v1/study/tasks').set(a.auth).query({ status: 'belum', cursor: cursorOf(v, randomUUID()) }).expect(400);
        expectError(res.body, 'VALIDATION_FAILED');
        expect(res.body.error.details.cursor).toBeDefined();
      }
    });

    // BUG-05: deadline 9999-12-31 dengan offset negatif lolos @IsDateTime, tapi di UTC jatuh ke tahun 10000.
    // toISOString() lalu menghasilkan "+010000-...": bukan date-time RFC 3339 (kontrak), dan kursor
    // yang dibuat server sendiri dari baris itu ditolak parseCursorDate -> halaman berikutnya 400.
    const EDGE_DEADLINE = '9999-12-31T23:59:00-01:00';

    it.failing('BUG-05: deadline di tepi tahun 9999 harus ditolak 400 atau tetap dibalas date-time 4 digit tahun', async () => {
      const a = await registerUser(t);
      const res = await t.http.post('/v1/study/tasks').set(a.auth).send({ title: 'Tepi', deadline: EDGE_DEADLINE });
      if (res.status === 400) return;
      expect(res.status).toBe(201);
      expect(res.body.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it.failing('BUG-05: nextCursor dari server tidak boleh ditolak server sendiri', async () => {
      const a = await registerUser(t);
      for (const title of ['Tepi 1', 'Tepi 2']) {
        await t.http.post('/v1/study/tasks').set(a.auth).send({ title, deadline: EDGE_DEADLINE });
      }
      const first = await t.http.get('/v1/study/tasks').set(a.auth).query({ status: 'belum', limit: 1 }).expect(200);
      if (first.body.nextCursor === null) return; // deadline ditolak saat dibuat: tidak ada halaman kedua
      const next = await t.http.get('/v1/study/tasks').set(a.auth).query({ status: 'belum', limit: 1, cursor: first.body.nextCursor });
      expect(next.status).toBe(200);
    });
  });

  describe('auth', () => {
    it('email sama beda huruf besar dan spasi 409 EMAIL_TAKEN', async () => {
      const email = `dobel-${Date.now()}@kampus.ac.id`;
      await t.http.post('/v1/auth/register').send({ email, password: 'rahasia123', name: 'Satu' }).expect(201);
      const res = await t.http.post('/v1/auth/register').send({ email: `  ${email.toUpperCase()} `, password: 'rahasia123', name: 'Dua' }).expect(409);
      expectError(res.body, 'EMAIL_TAKEN');
    });

    it('token rusak, skema bukan Bearer, dan tanpa header semuanya 401 UNAUTHENTICATED', async () => {
      for (const header of ['Bearer abc.def.ghi', 'Basic abc', '']) {
        const req = t.http.get('/v1/me');
        if (header) req.set('Authorization', header);
        expectError((await req.expect(401)).body, 'UNAUTHENTICATED');
      }
    });

    // BUG-02: batas 72 di kontrak/DTO dihitung per karakter, bcrypt memotong per 72 BYTE.
    // Dua sandi berbeda yang 72 byte pertamanya sama dianggap sama.
    it('BUG-02: sandi berbeda setelah byte ke-72 tidak boleh bisa masuk', async () => {
      const email = `bcrypt-${Date.now()}@kampus.ac.id`;
      const real = 'é'.repeat(40); // 40 karakter, 80 byte UTF-8
      const other = 'é'.repeat(36) + 'beda'; // 40 karakter, 72 byte pertama sama
      // Sandi di atas 72 byte ditolak saat daftar, jadi tidak ada akun yang bergantung pada pemotongan bcrypt.
      const reg = await t.http.post('/v1/auth/register').send({ email, password: real, name: 'Byte' }).expect(400);
      expectError(reg.body, 'VALIDATION_FAILED');
      expect(reg.body.error.details.password).toBeDefined();
      const res = await t.http.post('/v1/auth/login').send({ email, password: other });
      expect(res.status).toBe(401);

      // Sisi login: sandi tepat 72 byte terdaftar, versi lebih panjang dengan 72 byte pertama sama tetap ditolak.
      const exact = 'é'.repeat(36); // 72 byte
      await t.http.post('/v1/auth/register').send({ email, password: exact, name: 'Byte' }).expect(201);
      expectError((await t.http.post('/v1/auth/login').send({ email, password: exact + 'x' }).expect(401)).body, 'INVALID_CREDENTIALS');
      await t.http.post('/v1/auth/login').send({ email, password: exact }).expect(200);
    });
  });
});
