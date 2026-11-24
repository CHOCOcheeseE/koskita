import request from 'supertest';
import type { Session, TestApp } from './support/app';

// Batas kecil khusus file ini. Env dibaca saat AppModule pertama di-import, jadi app di-import dinamis.
process.env.AUTH_THROTTLE_LIMIT = '3';
process.env.JOIN_THROTTLE_LIMIT = '3';

describe('throttle (e2e)', () => {
  let t: TestApp;
  let support: typeof import('./support/app');

  beforeAll(async () => {
    support = await import('./support/app');
    t = await support.createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  it('login: 429 TOO_MANY_REQUESTS setelah melewati batas', async () => {
    const server = t.app.getHttpServer();
    for (let i = 0; i < 3; i++) {
      await request(server).post('/v1/auth/login').send({ email: 'a@b.id', password: 'salah' }).expect(401);
    }
    const res = await request(server).post('/v1/auth/login').send({ email: 'a@b.id', password: 'salah' }).expect(429);
    support.expectError(res.body, 'TOO_MANY_REQUESTS');
  });

  it('refresh tidak ikut dibatasi throttle login', async () => {
    const server = t.app.getHttpServer();
    for (let i = 0; i < 5; i++) {
      await request(server).post('/v1/auth/refresh').send({ refreshToken: 'x' }).expect(401);
    }
  });

  describe('gabung grup (S2)', () => {
    let owner: Session;
    let guesser: Session;
    let inviteCode: string;

    beforeAll(async () => {
      // Akun dibuat langsung lewat use case karena endpoint register sudah kena batas di tes atas.
      const make = async (name: string): Promise<Session> => {
        const tokens = t.app.get(support.AuthUseCases);
        const s = await tokens.register({ email: `${name}-${Date.now()}@kos.id`, password: 'rahasia123', name });
        return {
          userId: s.user.id,
          token: s.tokens.accessToken,
          refreshToken: s.tokens.refreshToken,
          auth: { Authorization: `Bearer ${s.tokens.accessToken}` },
        };
      };
      owner = await make('Pemilik');
      guesser = await make('Penebak');
      const g = await request(t.app.getHttpServer()).post('/v1/groups').set(owner.auth).send({ name: 'Kos Rahasia' }).expect(201);
      inviteCode = g.body.inviteCode;
    });

    it('menebak kode beruntun: 3 percobaan lalu 429 TOO_MANY_REQUESTS, kode benar pun ikut ditahan', async () => {
      const server = t.app.getHttpServer();
      for (const code of ['AAAAAA', 'BBBBBB', 'CCCCCC']) {
        await request(server).post('/v1/groups/join').set(guesser.auth).send({ inviteCode: code }).expect(404);
      }
      const blocked = await request(server).post('/v1/groups/join').set(guesser.auth).send({ inviteCode }).expect(429);
      support.expectError(blocked.body, 'TOO_MANY_REQUESTS');
    });

    it('batas join terpisah dari endpoint grup lain', async () => {
      const server = t.app.getHttpServer();
      for (let i = 0; i < 5; i++) {
        await request(server).get('/v1/groups').set(owner.auth).expect(200);
      }
    });
  });
});
