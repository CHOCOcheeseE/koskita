import { createTestApp, registerUser, TestApp } from './support/app';

describe('home (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    // Selasa 24 November 2026 10:00 WIB (hari ISO 2).
    t = await createTestApp(new Date('2026-11-24T03:00:00Z'));
  });

  afterAll(async () => {
    await t.close();
  });

  it('pengguna baru: budget null, belum ada grup, array kosong', async () => {
    const s = await registerUser(t);
    const res = await t.http.get('/v1/home/today').set(s.auth).expect(200);
    expect(res.body).toEqual({
      date: '2026-11-24',
      budget: null,
      split: { hasGroups: false, totalIOwe: 0, totalOwedToMe: 0 },
      classesToday: [],
      upcomingTasks: [],
    });
  });

  it('401 tanpa token', async () => {
    await t.http.get('/v1/home/today').expect(401);
  });

  it('angka sama dengan endpoint modul; upcomingTasks maks 3; lintas grup tidak dinettokan', async () => {
    const a = await registerUser(t, 'Ana');
    const b = await registerUser(t, 'Budi');
    const c = await registerUser(t, 'Cici');

    await t.http.post('/v1/wallet/transactions').set(a.auth).send({ type: 'expense', amount: 25_000, category: 'food', date: '2026-11-24' }).expect(201);
    const budget = await t.http.put('/v1/wallet/budgets/2026-11').set(a.auth).send({ amount: 700_000 }).expect(200);

    await t.http.post('/v1/study/schedules').set(a.auth).send({ courseName: 'Basis Data', dayOfWeek: 2, startTime: '13:00', endTime: '15:00' }).expect(201);
    await t.http.post('/v1/study/schedules').set(a.auth).send({ courseName: 'Jaringan', dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }).expect(201);
    await t.http.post('/v1/study/schedules').set(a.auth).send({ courseName: 'Rabu', dayOfWeek: 3, startTime: '08:00', endTime: '10:00' }).expect(201);

    for (const [title, deadline] of [
      ['Tugas 4', '2026-11-29T00:00:00Z'],
      ['Tugas 1 terlambat', '2026-11-20T00:00:00Z'],
      ['Tugas 3', '2026-11-27T00:00:00Z'],
      ['Tugas 2', '2026-11-25T00:00:00Z'],
    ]) {
      await t.http.post('/v1/study/tasks').set(a.auth).send({ title, deadline }).expect(201);
    }

    // Grup 1: Ana utang 10.000 ke Budi. Grup 2: Cici utang 5.000 ke Ana.
    const g1 = await t.http.post('/v1/groups').set(b.auth).send({ name: 'Grup Satu' }).expect(201);
    await t.http.post('/v1/groups/join').set(a.auth).send({ inviteCode: g1.body.inviteCode }).expect(200);
    await t.http.post(`/v1/groups/${g1.body.id}/bills`).set(b.auth).send({ title: 'Listrik', totalAmount: 20_000, splitMethod: 'equal' }).expect(201);
    const g2 = await t.http.post('/v1/groups').set(a.auth).send({ name: 'Grup Dua' }).expect(201);
    await t.http.post('/v1/groups/join').set(c.auth).send({ inviteCode: g2.body.inviteCode }).expect(200);
    await t.http.post(`/v1/groups/${g2.body.id}/bills`).set(a.auth).send({ title: 'Air', totalAmount: 10_000, splitMethod: 'equal' }).expect(201);

    const res = await t.http.get('/v1/home/today').set(a.auth).expect(200);
    expect(res.body.date).toBe('2026-11-24');
    expect(res.body.budget).toEqual(budget.body);
    expect(res.body.split).toEqual({ hasGroups: true, totalIOwe: 10_000, totalOwedToMe: 5_000 });
    expect(res.body.classesToday.map((x: { courseName: string }) => x.courseName)).toEqual(['Jaringan', 'Basis Data']);
    expect(res.body.upcomingTasks.map((x: { title: string }) => x.title)).toEqual(['Tugas 1 terlambat', 'Tugas 2', 'Tugas 3']);
    expect(res.body.upcomingTasks[0].deadlineLabel).toBe('overdue');
  });
});
