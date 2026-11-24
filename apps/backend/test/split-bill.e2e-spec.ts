import { randomUUID } from 'node:crypto';
import { createTestApp, expectError, registerUser, Session, TestApp } from './support/app';

interface ShareBody {
  id: string;
  user: { userId: string; name: string };
  amount: number;
  status: string;
}

describe('split-bill (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  async function groupOf(owner: Session, others: Session[], name = 'Kos Melati'): Promise<{ id: string; inviteCode: string }> {
    const g = await t.http.post('/v1/groups').set(owner.auth).send({ name }).expect(201);
    for (const o of others) {
      await t.http.post('/v1/groups/join').set(o.auth).send({ inviteCode: g.body.inviteCode.toLowerCase() }).expect(200);
    }
    return g.body;
  }

  const bill = (s: Session, groupId: string, body: Record<string, unknown>) =>
    t.http.post(`/v1/groups/${groupId}/bills`).set(s.auth).send(body);

  const shareOf = (b: { shares: ShareBody[] }, userId: string) => b.shares.find((x) => x.user.userId === userId)!;

  describe('grup', () => {
    it('buat grup: pembuat anggota pertama, kode undangan sesuai pola', async () => {
      const a = await registerUser(t, 'Ayu');
      const res = await t.http.post('/v1/groups').set(a.auth).send({ name: '  Kos Melati  ' }).expect(201);
      expect(res.body).toEqual({
        id: expect.any(String),
        name: 'Kos Melati',
        inviteCode: expect.stringMatching(/^[A-HJ-NP-Z2-9]{6}$/),
        members: [{ userId: a.userId, name: 'Ayu', campus: null, joinedAt: expect.any(String) }],
        createdAt: expect.any(String),
      });
      expectError((await t.http.post('/v1/groups').set(a.auth).send({ name: 'ab' }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('gabung idempoten, huruf kecil diterima, kode salah 404 GROUP_NOT_FOUND', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const g = await groupOf(a, [b]);
      const again = await t.http.post('/v1/groups/join').set(b.auth).send({ inviteCode: g.inviteCode }).expect(200);
      expect(again.body.members).toHaveLength(2);
      expect(again.body.members.map((m: { userId: string }) => m.userId)).toEqual([a.userId, b.userId]);
      expectError((await t.http.post('/v1/groups/join').set(b.auth).send({ inviteCode: 'ZZZZZZ' }).expect(404)).body, 'GROUP_NOT_FOUND');
      expectError((await t.http.post('/v1/groups/join').set(b.auth).send({ inviteCode: 'ABC' }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('409 GROUP_FULL untuk anggota ke-21', async () => {
      const owner = await registerUser(t, 'Ketua');
      const g = await t.http.post('/v1/groups').set(owner.auth).send({ name: 'Kos Besar' }).expect(201);
      for (let i = 0; i < 19; i++) {
        const u = await registerUser(t, `Anggota ${i}`);
        await t.http.post('/v1/groups/join').set(u.auth).send({ inviteCode: g.body.inviteCode }).expect(200);
      }
      const late = await registerUser(t, 'Telat');
      expectError((await t.http.post('/v1/groups/join').set(late.auth).send({ inviteCode: g.body.inviteCode }).expect(409)).body, 'GROUP_FULL');
    });

    it('GET grup: bukan anggota 403 NOT_GROUP_MEMBER, tidak ada 404', async () => {
      const a = await registerUser(t);
      const x = await registerUser(t);
      const g = await groupOf(a, []);
      await t.http.get(`/v1/groups/${g.id}`).set(a.auth).expect(200);
      expectError((await t.http.get(`/v1/groups/${g.id}`).set(x.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
      expectError((await t.http.get(`/v1/groups/${randomUUID()}`).set(a.auth).expect(404)).body, 'NOT_FOUND');
    });

    it('GET /groups: urut joinedAt menurun dengan saldo', async () => {
      const a = await registerUser(t);
      const g1 = await groupOf(a, [], 'Grup Satu');
      const g2 = await groupOf(a, [], 'Grup Dua');
      const res = await t.http.get('/v1/groups').set(a.auth).expect(200);
      expect(res.body.items.map((g: { id: string }) => g.id)).toEqual([g2.id, g1.id]);
      expect(res.body.items[0]).toEqual({ id: g2.id, name: 'Grup Dua', memberCount: 1, myNetBalance: 0, isSettledForMe: true });
    });
  });

  describe('tagihan', () => {
    it('bagi rata 100.000 / 3 = 33.334, 33.333, 33.333; bagian pembayar lunas', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const c = await registerUser(t, 'Cici');
      const g = await groupOf(a, [b, c]);
      const res = await bill(a, g.id, { title: 'Listrik November', totalAmount: 100_000, splitMethod: 'equal' }).expect(201);
      expect(res.body).toMatchObject({
        groupId: g.id,
        title: 'Listrik November',
        totalAmount: 100_000,
        splitMethod: 'equal',
        payer: { userId: a.userId, name: 'Ana' },
        createdBy: { userId: a.userId, name: 'Ana' },
        status: 'open',
        canDelete: true,
      });
      expect(res.body.shares.map((s: ShareBody) => [s.user.userId, s.amount, s.status])).toEqual([
        [a.userId, 33_334, 'lunas'],
        [b.userId, 33_333, 'belum_bayar'],
        [c.userId, 33_333, 'belum_bayar'],
      ]);
    });

    it('bagi rata sebagian: sisa Rp1 menurut joinedAt, bukan urutan participantIds', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const c = await registerUser(t);
      const g = await groupOf(a, [b, c]);
      const res = await bill(a, g.id, { title: 'Galon', totalAmount: 10_001, splitMethod: 'equal', participantIds: [c.userId, b.userId] }).expect(201);
      expect(res.body.shares.map((s: ShareBody) => [s.user.userId, s.amount])).toEqual([
        [b.userId, 5001],
        [c.userId, 5000],
      ]);
    });

    it('aturan 422: SHARES_SUM_MISMATCH (pesan sebut selisih), SHARES_REQUIRED, SHARES_NOT_ALLOWED, PARTICIPANT_NOT_MEMBER, MIN_PARTICIPANTS', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const x = await registerUser(t);
      const g = await groupOf(a, [b]);
      const mismatch = await bill(a, g.id, {
        title: 'Wifi',
        totalAmount: 100_000,
        splitMethod: 'manual',
        shares: [
          { userId: a.userId, amount: 50_000 },
          { userId: b.userId, amount: 40_000 },
        ],
      }).expect(422);
      expectError(mismatch.body, 'SHARES_SUM_MISMATCH');
      expect(mismatch.body.error.message).toContain('Rp10.000');

      expectError((await bill(a, g.id, { title: 'Wifi', totalAmount: 100_000, splitMethod: 'manual' }).expect(422)).body, 'SHARES_REQUIRED');
      expectError(
        (
          await bill(a, g.id, {
            title: 'Wifi',
            totalAmount: 100_000,
            splitMethod: 'equal',
            shares: [
              { userId: a.userId, amount: 50_000 },
              { userId: b.userId, amount: 50_000 },
            ],
          }).expect(422)
        ).body,
        'SHARES_NOT_ALLOWED',
      );
      expectError(
        (await bill(a, g.id, { title: 'Wifi', totalAmount: 100_000, splitMethod: 'equal', participantIds: [a.userId, x.userId] }).expect(422)).body,
        'PARTICIPANT_NOT_MEMBER',
      );
      expectError(
        (await bill(a, g.id, { title: 'Wifi', totalAmount: 100_000, splitMethod: 'equal', payerId: x.userId }).expect(422)).body,
        'PARTICIPANT_NOT_MEMBER',
      );
      const solo = await groupOf(a, [], 'Sendirian');
      expectError((await bill(a, solo.id, { title: 'Wifi', totalAmount: 100_000, splitMethod: 'equal' }).expect(422)).body, 'MIN_PARTICIPANTS');
      expectError((await bill(x, g.id, { title: 'Wifi', totalAmount: 100_000, splitMethod: 'equal' }).expect(403)).body, 'NOT_GROUP_MEMBER');
      expectError((await bill(a, g.id, { title: 'Wifi', totalAmount: 0, splitMethod: 'equal' }).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('alur status: mark-paid, reject, mark-paid, confirm -> settled', async () => {
      const a = await registerUser(t, 'Pembayar');
      const b = await registerUser(t, 'Peserta');
      const g = await groupOf(a, [b]);
      const created = await bill(a, g.id, { title: 'Gas', totalAmount: 20_000, splitMethod: 'equal' }).expect(201);
      const bId = created.body.id;
      const shareB = shareOf(created.body, b.userId).id;
      const base = `/v1/bills/${bId}/shares/${shareB}`;

      expectError((await t.http.post(`${base}/confirm`).set(b.auth).expect(403)).body, 'NOT_BILL_PAYER');
      expectError((await t.http.post(`${base}/mark-paid`).set(a.auth).expect(403)).body, 'NOT_SHARE_OWNER');
      expectError((await t.http.post(`${base}/reject`).set(a.auth).expect(409)).body, 'INVALID_SHARE_TRANSITION');

      let res = await t.http.post(`${base}/mark-paid`).set(b.auth).expect(200);
      expect(shareOf(res.body, b.userId).status).toBe('menunggu_konfirmasi');
      expectError((await t.http.post(`${base}/mark-paid`).set(b.auth).expect(409)).body, 'INVALID_SHARE_TRANSITION');

      res = await t.http.post(`${base}/reject`).set(a.auth).expect(200);
      expect(shareOf(res.body, b.userId).status).toBe('belum_bayar');

      await t.http.post(`${base}/mark-paid`).set(b.auth).expect(200);
      res = await t.http.post(`${base}/confirm`).set(a.auth).expect(200);
      expect(shareOf(res.body, b.userId).status).toBe('lunas');
      expect(res.body.status).toBe('settled');
      expect(res.body.canDelete).toBe(false);

      const open = await t.http.get(`/v1/groups/${g.id}/bills?status=open`).set(a.auth).expect(200);
      expect(open.body.items).toHaveLength(0);
      const settled = await t.http.get(`/v1/groups/${g.id}/bills?status=settled`).set(a.auth).expect(200);
      expect(settled.body.items.map((x: { id: string }) => x.id)).toEqual([bId]);
    });

    it('confirm tunai langsung dari belum_bayar', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const created = await bill(a, g.id, { title: 'Sabun', totalAmount: 9_000, splitMethod: 'equal' }).expect(201);
      const res = await t.http.post(`/v1/bills/${created.body.id}/shares/${shareOf(created.body, b.userId).id}/confirm`).set(a.auth).expect(200);
      expect(res.body.status).toBe('settled');
    });

    it('hapus: B membuat dengan payerId = A -> canDelete B, 204; setelah bagian C lunas -> 409 BILL_HAS_PAYMENTS', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const c = await registerUser(t, 'Cici');
      const g = await groupOf(a, [b, c]);

      const first = await bill(b, g.id, { title: 'Air', totalAmount: 30_000, splitMethod: 'equal', payerId: a.userId }).expect(201);
      expect(shareOf(first.body, a.userId).status).toBe('lunas');
      expect(first.body.canDelete).toBe(true);
      const asA = await t.http.get(`/v1/bills/${first.body.id}`).set(a.auth).expect(200);
      expect(asA.body.canDelete).toBe(false);
      expectError((await t.http.delete(`/v1/bills/${first.body.id}`).set(a.auth).expect(403)).body, 'NOT_BILL_CREATOR');
      await t.http.delete(`/v1/bills/${first.body.id}`).set(b.auth).expect(204);
      await t.http.get(`/v1/bills/${first.body.id}`).set(b.auth).expect(404);

      const second = await bill(b, g.id, { title: 'Air', totalAmount: 30_000, splitMethod: 'equal', payerId: a.userId }).expect(201);
      await t.http.post(`/v1/bills/${second.body.id}/shares/${shareOf(second.body, c.userId).id}/confirm`).set(a.auth).expect(200);
      expectError((await t.http.delete(`/v1/bills/${second.body.id}`).set(b.auth).expect(409)).body, 'BILL_HAS_PAYMENTS');
    });

    it('tagihan grup lain -> 403 NOT_GROUP_MEMBER; share salah -> 404', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const x = await registerUser(t);
      const g = await groupOf(a, [b]);
      const created = await bill(a, g.id, { title: 'Kebersihan', totalAmount: 10_000, splitMethod: 'equal' }).expect(201);
      expectError((await t.http.get(`/v1/bills/${created.body.id}`).set(x.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
      expectError((await t.http.delete(`/v1/bills/${created.body.id}`).set(x.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
      await t.http.post(`/v1/bills/${created.body.id}/shares/${randomUUID()}/confirm`).set(a.auth).expect(404);
      expectError((await t.http.get(`/v1/groups/${g.id}/bills`).set(x.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
    });

    it('list tagihan: terbaru di atas, paginasi', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      const ids: string[] = [];
      for (let i = 0; i < 3; i++) {
        ids.push((await bill(a, g.id, { title: `Tagihan ${i}`, totalAmount: 1000, splitMethod: 'equal' }).expect(201)).body.id);
      }
      const p1 = await t.http.get(`/v1/groups/${g.id}/bills?limit=2`).set(a.auth).expect(200);
      expect(p1.body.items.map((x: { id: string }) => x.id)).toEqual([ids[2], ids[1]]);
      const p2 = await t.http.get(`/v1/groups/${g.id}/bills?limit=2&cursor=${p1.body.nextCursor}`).set(a.auth).expect(200);
      expect(p2.body).toEqual({ items: [expect.objectContaining({ id: ids[0] })], nextCursor: null });
      expectError((await t.http.get(`/v1/groups/${g.id}/bills?status=lunas`).set(a.auth).expect(400)).body, 'VALIDATION_FAILED');
    });
  });

  describe('saldo dan keluar grup', () => {
    it('saldo silang: A->B 10.000, C->A 10.000; A tidak boleh keluar, myNetBalance 0', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const c = await registerUser(t, 'Cici');
      const g = await groupOf(a, [b, c]);
      await bill(b, g.id, { title: 'Pulsa', totalAmount: 20_000, splitMethod: 'equal', participantIds: [a.userId, b.userId] }).expect(201);
      await bill(a, g.id, { title: 'Token', totalAmount: 20_000, splitMethod: 'equal', participantIds: [a.userId, c.userId] }).expect(201);

      const bal = await t.http.get(`/v1/groups/${g.id}/balances`).set(a.auth).expect(200);
      expect(bal.body).toMatchObject({ groupId: g.id, totalIOwe: 10_000, totalOwedToMe: 10_000, canLeave: false, allSettled: false });
      expect(bal.body.entries).toHaveLength(2);
      expect(bal.body.entries).toEqual(
        expect.arrayContaining([
          { from: { userId: a.userId, name: 'Ana' }, to: { userId: b.userId, name: 'Budi' }, amount: 10_000 },
          { from: { userId: c.userId, name: 'Cici' }, to: { userId: a.userId, name: 'Ana' }, amount: 10_000 },
        ]),
      );

      const groups = await t.http.get('/v1/groups').set(a.auth).expect(200);
      expect(groups.body.items[0]).toMatchObject({ id: g.id, myNetBalance: 0, isSettledForMe: false });

      expectError((await t.http.post(`/v1/groups/${g.id}/leave`).set(a.auth).expect(409)).body, 'BALANCE_NOT_SETTLED');
    });

    it('netto pasangan: A->B 70.000 dan B->A 20.000 jadi A->B 50.000', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const g = await groupOf(a, [b]);
      await bill(b, g.id, { title: 'Belanja', totalAmount: 140_000, splitMethod: 'equal' }).expect(201);
      await bill(a, g.id, { title: 'Bensin', totalAmount: 40_000, splitMethod: 'equal' }).expect(201);
      const bal = await t.http.get(`/v1/groups/${g.id}/balances`).set(b.auth).expect(200);
      expect(bal.body.entries).toEqual([{ from: { userId: a.userId, name: 'Ana' }, to: { userId: b.userId, name: 'Budi' }, amount: 50_000 }]);
      expect(bal.body).toMatchObject({ totalIOwe: 0, totalOwedToMe: 50_000, canLeave: false });
    });

    it('agregat > 100.000.000: dua tagihan 60.000.000 ke orang yang sama', async () => {
      const a = await registerUser(t);
      const b = await registerUser(t);
      const g = await groupOf(a, [b]);
      for (let i = 0; i < 2; i++) {
        await bill(a, g.id, {
          title: 'Sewa besar',
          totalAmount: 60_000_000,
          splitMethod: 'manual',
          shares: [
            { userId: a.userId, amount: 0 },
            { userId: b.userId, amount: 60_000_000 },
          ],
        }).expect(201);
      }
      const bal = await t.http.get(`/v1/groups/${g.id}/balances`).set(a.auth).expect(200);
      expect(bal.body.entries[0].amount).toBe(120_000_000);
    });

    it('keluar saat beres -> 204, gabung lagi tanpa duplikat; tagihan lama tetap terbaca', async () => {
      const a = await registerUser(t, 'Ana');
      const b = await registerUser(t, 'Budi');
      const g = await groupOf(a, [b]);
      const created = await bill(a, g.id, { title: 'Lampu', totalAmount: 2_000, splitMethod: 'equal' }).expect(201);
      await t.http.post(`/v1/bills/${created.body.id}/shares/${shareOf(created.body, b.userId).id}/confirm`).set(a.auth).expect(200);

      const bal = await t.http.get(`/v1/groups/${g.id}/balances`).set(b.auth).expect(200);
      expect(bal.body).toMatchObject({ canLeave: true, allSettled: true, entries: [] });
      await t.http.post(`/v1/groups/${g.id}/leave`).set(b.auth).expect(204);
      expectError((await t.http.get(`/v1/groups/${g.id}`).set(b.auth).expect(403)).body, 'NOT_GROUP_MEMBER');
      expectError((await t.http.post(`/v1/groups/${g.id}/leave`).set(b.auth).expect(403)).body, 'NOT_GROUP_MEMBER');

      const rejoin = await t.http.post('/v1/groups/join').set(b.auth).send({ inviteCode: g.inviteCode }).expect(200);
      expect(rejoin.body.members.filter((m: { userId: string }) => m.userId === b.userId)).toHaveLength(1);
      const old = await t.http.get(`/v1/bills/${created.body.id}`).set(a.auth).expect(200);
      expect(old.body.shares).toHaveLength(2);
    });
  });
});
