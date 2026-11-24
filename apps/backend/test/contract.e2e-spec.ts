import { ContractChecker } from './support/contract';
import { createTestApp, TestApp } from './support/app';

/**
 * Kepatuhan kontrak: setiap operasi di contracts/openapi.yaml dipanggil minimal sekali,
 * dan setiap respons (sukses maupun error) divalidasi terhadap skema kontraknya.
 */
describe('kepatuhan kontrak OpenAPI (e2e)', () => {
  let t: TestApp;
  const contract = new ContractChecker();

  beforeAll(async () => {
    t = await createTestApp(new Date('2026-11-24T03:00:00Z'));
  });

  afterAll(async () => {
    await t.close();
  });

  type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

  /** Panggil endpoint, cek status, lalu validasi body dengan skema kontrak untuk template path itu. */
  async function call(
    method: Method,
    template: string,
    status: number,
    opts: { params?: Record<string, string>; token?: string; body?: unknown; query?: string } = {},
  ): Promise<any> {
    let url = template;
    for (const [k, v] of Object.entries(opts.params ?? {})) url = url.replace(`{${k}}`, v);
    if (opts.query) url += `?${opts.query}`;
    let req = t.http[method](url);
    if (opts.token) req = req.set('Authorization', `Bearer ${opts.token}`);
    const res = await (opts.body !== undefined ? req.send(opts.body as object) : req);
    expect({ url, status: res.status, body: res.body }).toMatchObject({ status });
    contract.check(method, template, res.status, res.status === 204 ? undefined : res.body);
    return res.body;
  }

  it('semua operasi dipanggil dan semua respons cocok skema', async () => {
    await call('get', '/v1/health', 200);

    // auth
    await call('post', '/v1/auth/register', 400, { body: { email: 'x' } });
    const ana = await call('post', '/v1/auth/register', 201, { body: { email: 'ana@kos.id', password: 'rahasia123', name: 'Ana' } });
    await call('post', '/v1/auth/register', 409, { body: { email: 'ana@kos.id', password: 'rahasia123', name: 'Ana' } });
    const budi = await call('post', '/v1/auth/register', 201, { body: { email: 'budi@kos.id', password: 'rahasia123', name: 'Budi' } });
    const cici = await call('post', '/v1/auth/register', 201, { body: { email: 'cici@kos.id', password: 'rahasia123', name: 'Cici' } });
    await call('post', '/v1/auth/login', 401, { body: { email: 'ana@kos.id', password: 'salah-sandi' } });
    const login = await call('post', '/v1/auth/login', 200, { body: { email: 'ana@kos.id', password: 'rahasia123' } });
    const refreshed = await call('post', '/v1/auth/refresh', 200, { body: { refreshToken: login.tokens.refreshToken } });
    await call('post', '/v1/auth/refresh', 401, { body: { refreshToken: login.tokens.refreshToken } });
    await call('post', '/v1/auth/logout', 401, { body: { refreshToken: refreshed.refreshToken } });
    await call('post', '/v1/auth/logout', 204, { token: refreshed.accessToken, body: { refreshToken: refreshed.refreshToken } });

    const A = ana.tokens.accessToken as string;
    const B = budi.tokens.accessToken as string;
    const C = cici.tokens.accessToken as string;

    // profile
    await call('get', '/v1/me', 200, { token: A });
    await call('patch', '/v1/me', 200, { token: A, body: { campus: 'UNPAD' } });
    await call('patch', '/v1/me', 400, { token: A, body: {} });

    // home kosong
    await call('get', '/v1/home/today', 200, { token: A });

    // wallet
    await call('get', '/v1/wallet/categories', 200, { token: A });
    const tx = await call('post', '/v1/wallet/transactions', 201, {
      token: A,
      body: { type: 'expense', amount: 60_000_000, category: 'food', date: '2026-11-24', note: 'Makan' },
    });
    await call('post', '/v1/wallet/transactions', 201, {
      token: A,
      body: { type: 'expense', amount: 60_000_000, category: 'food', date: '2026-11-23' },
    });
    await call('post', '/v1/wallet/transactions', 422, {
      token: A,
      body: { type: 'expense', amount: 1000, category: 'food', date: '2026-11-25' },
    });
    await call('get', '/v1/wallet/transactions', 200, { token: A, query: 'month=2026-11&limit=1' });
    await call('get', '/v1/wallet/transactions', 422, { token: A, query: 'month=2027-01' });
    await call('get', '/v1/wallet/transactions/{transactionId}', 200, { token: A, params: { transactionId: tx.id } });
    await call('get', '/v1/wallet/transactions/{transactionId}', 404, { token: B, params: { transactionId: tx.id } });
    await call('patch', '/v1/wallet/transactions/{transactionId}', 200, { token: A, params: { transactionId: tx.id }, body: { note: null } });
    await call('get', '/v1/wallet/months/{month}/summary', 200, { token: A, params: { month: '2026-11' } });
    await call('get', '/v1/wallet/budgets/{month}', 404, { token: A, params: { month: '2026-11' } });
    await call('put', '/v1/wallet/budgets/{month}', 200, { token: A, params: { month: '2026-11' }, body: { amount: 100_000_000 } });
    await call('put', '/v1/wallet/budgets/{month}', 422, { token: A, params: { month: '2026-10' }, body: { amount: 1000 } });
    await call('get', '/v1/wallet/budgets/{month}', 200, { token: A, params: { month: '2026-11' } });

    // split-bill
    const group = await call('post', '/v1/groups', 201, { token: A, body: { name: 'Kos Mawar' } });
    await call('post', '/v1/groups/join', 200, { token: B, body: { inviteCode: group.inviteCode.toLowerCase() } });
    await call('post', '/v1/groups/join', 404, { token: C, body: { inviteCode: '222222' } });
    await call('get', '/v1/groups', 200, { token: A });
    await call('get', '/v1/groups/{groupId}', 200, { token: A, params: { groupId: group.id } });
    await call('get', '/v1/groups/{groupId}', 403, { token: C, params: { groupId: group.id } });

    const bill = await call('post', '/v1/groups/{groupId}/bills', 201, {
      token: A,
      params: { groupId: group.id },
      body: { title: 'Sewa kamar', totalAmount: 100_000_000, splitMethod: 'manual', shares: [
        { userId: ana.user.id, amount: 0 },
        { userId: budi.user.id, amount: 100_000_000 },
      ] },
    });
    await call('post', '/v1/groups/{groupId}/bills', 201, {
      token: A,
      params: { groupId: group.id },
      body: { title: 'Sewa gudang', totalAmount: 100_000_000, splitMethod: 'equal' },
    });
    await call('post', '/v1/groups/{groupId}/bills', 422, {
      token: A,
      params: { groupId: group.id },
      body: { title: 'Salah', totalAmount: 100, splitMethod: 'manual', shares: [
        { userId: ana.user.id, amount: 10 },
        { userId: budi.user.id, amount: 10 },
      ] },
    });
    await call('get', '/v1/groups/{groupId}/bills', 200, { token: B, params: { groupId: group.id }, query: 'status=open&limit=1' });
    await call('get', '/v1/groups/{groupId}/balances', 200, { token: B, params: { groupId: group.id } });
    await call('get', '/v1/home/today', 200, { token: B });
    await call('post', '/v1/groups/{groupId}/leave', 409, { token: B, params: { groupId: group.id } });

    const budiShare = bill.shares.find((s: { user: { userId: string } }) => s.user.userId === budi.user.id).id;
    const shareParams = { billId: bill.id, shareId: budiShare };
    await call('get', '/v1/bills/{billId}', 200, { token: B, params: { billId: bill.id } });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/mark-paid', 403, { token: A, params: shareParams });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/mark-paid', 200, { token: B, params: shareParams });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/reject', 200, { token: A, params: shareParams });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/reject', 409, { token: A, params: shareParams });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/confirm', 403, { token: B, params: shareParams });
    await call('post', '/v1/bills/{billId}/shares/{shareId}/confirm', 200, { token: A, params: shareParams });
    await call('delete', '/v1/bills/{billId}', 409, { token: A, params: { billId: bill.id } });

    const temp = await call('post', '/v1/groups/{groupId}/bills', 201, {
      token: B,
      params: { groupId: group.id },
      body: { title: 'Galon', totalAmount: 20_000, splitMethod: 'equal', payerId: ana.user.id },
    });
    await call('delete', '/v1/bills/{billId}', 403, { token: A, params: { billId: temp.id } });
    await call('delete', '/v1/bills/{billId}', 204, { token: B, params: { billId: temp.id } });

    const solo = await call('post', '/v1/groups', 201, { token: C, body: { name: 'Kos Sendiri' } });
    await call('post', '/v1/groups/{groupId}/leave', 204, { token: C, params: { groupId: solo.id } });

    // study
    const sched = await call('post', '/v1/study/schedules', 201, {
      token: A,
      body: { courseName: 'Kalkulus', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: 'R1' },
    });
    await call('post', '/v1/study/schedules', 201, {
      token: A,
      body: { courseName: 'Fisika', dayOfWeek: 2, startTime: '09:00', endTime: '11:00' },
    });
    await call('post', '/v1/study/schedules', 422, {
      token: A,
      body: { courseName: 'Kimia', dayOfWeek: 2, startTime: '11:00', endTime: '10:00' },
    });
    await call('get', '/v1/study/schedules', 200, { token: A, query: 'dayOfWeek=2' });
    await call('get', '/v1/study/schedules/{scheduleId}', 200, { token: A, params: { scheduleId: sched.id } });
    await call('patch', '/v1/study/schedules/{scheduleId}', 200, { token: A, params: { scheduleId: sched.id }, body: { room: null } });

    const task = await call('post', '/v1/study/tasks', 201, {
      token: A,
      body: { title: 'Laporan', scheduleId: sched.id, deadline: '2026-11-25T01:00:00Z', note: 'Bab 2' },
    });
    await call('post', '/v1/study/tasks', 201, { token: A, body: { title: 'Kuis', deadline: '2026-11-20T01:00:00Z' } });
    await call('post', '/v1/study/tasks', 422, { token: B, body: { title: 'Nyontek', scheduleId: sched.id, deadline: '2026-11-25T01:00:00Z' } });
    await call('get', '/v1/study/tasks', 200, { token: A });
    await call('get', '/v1/study/tasks/{taskId}', 200, { token: A, params: { taskId: task.id } });
    await call('patch', '/v1/study/tasks/{taskId}', 200, { token: A, params: { taskId: task.id }, body: { status: 'selesai' } });
    await call('get', '/v1/study/tasks', 200, { token: A, query: 'status=selesai' });
    await call('get', '/v1/home/today', 200, { token: A });

    await call('delete', '/v1/study/tasks/{taskId}', 204, { token: A, params: { taskId: task.id } });
    await call('delete', '/v1/study/schedules/{scheduleId}', 204, { token: A, params: { scheduleId: sched.id } });
    await call('delete', '/v1/wallet/transactions/{transactionId}', 204, { token: A, params: { transactionId: tx.id } });

    expect([...contract.covered].sort()).toEqual(contract.allOperations());
    // Satu tes berisi ±80 request; beri waktu lebih supaya tidak timeout saat semua suite jalan paralel.
  }, 120_000);

  it('validator benar-benar menolak field di luar kontrak', () => {
    expect(() => contract.check('get', '/v1/health', 200, { status: 'ok', extra: 1 })).toThrow(/tidak cocok kontrak/);
    expect(() => contract.check('get', '/v1/health', 200, { status: 'ok' })).not.toThrow();
  });
});
