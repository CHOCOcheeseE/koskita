import request from 'supertest';
import type { TestApp } from './support/app';

// Batas kecil khusus file ini. Env dibaca saat AppModule pertama di-import, jadi app di-import dinamis.
process.env.AUTH_THROTTLE_LIMIT = '3';

describe('throttle login (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    const { createTestApp } = await import('./support/app');
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  it('429 TOO_MANY_REQUESTS setelah melewati batas', async () => {
    const server = t.app.getHttpServer();
    for (let i = 0; i < 3; i++) {
      await request(server).post('/v1/auth/login').send({ email: 'a@b.id', password: 'salah' }).expect(401);
    }
    const res = await request(server).post('/v1/auth/login').send({ email: 'a@b.id', password: 'salah' }).expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('refresh tidak ikut dibatasi throttle login', async () => {
    const server = t.app.getHttpServer();
    for (let i = 0; i < 5; i++) {
      await request(server).post('/v1/auth/refresh').send({ refreshToken: 'x' }).expect(401);
    }
  });
});
