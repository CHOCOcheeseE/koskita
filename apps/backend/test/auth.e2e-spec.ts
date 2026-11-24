import { createTestApp, expectError, registerUser, TestApp } from './support/app';

describe('health, auth, profile (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  describe('GET /v1/health', () => {
    it('200 { status: ok } tanpa token', async () => {
      const res = await t.http.get('/v1/health').expect(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('503 jika database mati', async () => {
      t.health.up = false;
      const res = await t.http.get('/v1/health').expect(503);
      expectError(res.body, 'DATABASE_UNAVAILABLE');
      t.health.up = true;
    });
  });

  describe('POST /v1/auth/register', () => {
    it('201 dan langsung masuk; email disimpan huruf kecil; tanpa password', async () => {
      const res = await t.http
        .post('/v1/auth/register')
        .send({ email: '  Rina@Kampus.AC.ID ', password: 'rahasia123', name: '  Rina  ' })
        .expect(201);
      expect(res.body.user).toEqual({
        id: expect.any(String),
        email: 'rina@kampus.ac.id',
        name: 'Rina',
        campus: null,
        createdAt: expect.any(String),
      });
      expect(Object.keys(res.body.tokens).sort()).toEqual(['accessToken', 'accessTokenExpiresAt', 'refreshToken']);
      expect(new Date(res.body.tokens.accessTokenExpiresAt).getTime() - Date.parse('2026-11-24T03:00:00Z')).toBe(15 * 60 * 1000);
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    it('409 EMAIL_TAKEN untuk email sama (beda kapital)', async () => {
      const res = await t.http
        .post('/v1/auth/register')
        .send({ email: 'RINA@kampus.ac.id', password: 'rahasia123', name: 'Rina Lagi' })
        .expect(409);
      expectError(res.body, 'EMAIL_TAKEN');
    });

    it('400 VALIDATION_FAILED dengan details per field', async () => {
      const res = await t.http.post('/v1/auth/register').send({ email: 'bukan-email', password: 'pendek', name: 'R' }).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(res.body.error.details).sort()).toEqual(['email', 'name', 'password']);
    });

    it('400 untuk field tidak dikenal', async () => {
      const res = await t.http
        .post('/v1/auth/register')
        .send({ email: 'x@y.id', password: 'rahasia123', name: 'Xyz', role: 'admin' })
        .expect(400);
      expect(res.body.error.details.role).toBeDefined();
    });

    it('400 untuk JSON rusak', async () => {
      const res = await t.http.post('/v1/auth/register').set('Content-Type', 'application/json').send('{"email":').expect(400);
      expectError(res.body, 'VALIDATION_FAILED');
    });
  });

  describe('POST /v1/auth/login', () => {
    it('200 dengan kata sandi benar', async () => {
      const res = await t.http.post('/v1/auth/login').send({ email: 'rina@kampus.ac.id', password: 'rahasia123' }).expect(200);
      expect(res.body.user.email).toBe('rina@kampus.ac.id');
      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
    });

    it('401 INVALID_CREDENTIALS untuk sandi salah dan email tidak ada, pesan sama', async () => {
      const a = await t.http.post('/v1/auth/login').send({ email: 'rina@kampus.ac.id', password: 'salah12345' }).expect(401);
      const b = await t.http.post('/v1/auth/login').send({ email: 'tidakada@kampus.ac.id', password: 'salah12345' }).expect(401);
      expectError(a.body, 'INVALID_CREDENTIALS');
      expect(a.body.error.message).toBe(b.body.error.message);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('rotasi: token baru berlaku, token lama ditolak SESSION_EXPIRED', async () => {
      const s = await registerUser(t);
      const first = await t.http.post('/v1/auth/refresh').send({ refreshToken: s.refreshToken }).expect(200);
      expect(first.body.refreshToken).not.toBe(s.refreshToken);
      const again = await t.http.post('/v1/auth/refresh').send({ refreshToken: s.refreshToken }).expect(401);
      expectError(again.body, 'SESSION_EXPIRED');
      await t.http.post('/v1/auth/refresh').send({ refreshToken: first.body.refreshToken }).expect(200);
    });

    it('400 tanpa refreshToken', async () => {
      const res = await t.http.post('/v1/auth/refresh').send({}).expect(400);
      expectError(res.body, 'VALIDATION_FAILED');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('204 dan refresh token dicabut; tetap 204 walau sudah tidak berlaku', async () => {
      const s = await registerUser(t);
      await t.http.post('/v1/auth/logout').set(s.auth).send({ refreshToken: s.refreshToken }).expect(204);
      await t.http.post('/v1/auth/logout').set(s.auth).send({ refreshToken: s.refreshToken }).expect(204);
      const res = await t.http.post('/v1/auth/refresh').send({ refreshToken: s.refreshToken }).expect(401);
      expectError(res.body, 'SESSION_EXPIRED');
    });

    it('401 UNAUTHENTICATED tanpa bearer', async () => {
      const res = await t.http.post('/v1/auth/logout').send({ refreshToken: 'x' }).expect(401);
      expectError(res.body, 'UNAUTHENTICATED');
    });
  });

  describe('token', () => {
    it('401 TOKEN_EXPIRED setelah 15 menit, refresh lalu bisa lagi', async () => {
      const s = await registerUser(t);
      const start = t.clock.now();
      t.clock.set(new Date(start.getTime() + 16 * 60 * 1000));
      const res = await t.http.get('/v1/me').set(s.auth).expect(401);
      expectError(res.body, 'TOKEN_EXPIRED');
      const refreshed = await t.http.post('/v1/auth/refresh').send({ refreshToken: s.refreshToken }).expect(200);
      await t.http.get('/v1/me').set('Authorization', `Bearer ${refreshed.body.accessToken}`).expect(200);
      t.clock.set(start);
    });

    it('401 UNAUTHENTICATED untuk token palsu', async () => {
      const res = await t.http.get('/v1/me').set('Authorization', 'Bearer abc.def.ghi').expect(401);
      expectError(res.body, 'UNAUTHENTICATED');
    });
  });

  describe('/v1/me', () => {
    it('GET 200 profil sendiri', async () => {
      const s = await registerUser(t, 'Budi');
      const res = await t.http.get('/v1/me').set(s.auth).expect(200);
      expect(res.body).toMatchObject({ id: s.userId, name: 'Budi', campus: null });
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('PATCH ubah nama dan kampus; string kosong menghapus kampus', async () => {
      const s = await registerUser(t, 'Budi');
      const a = await t.http.patch('/v1/me').set(s.auth).send({ name: 'Budi S', campus: 'UGM' }).expect(200);
      expect(a.body).toMatchObject({ name: 'Budi S', campus: 'UGM' });
      const b = await t.http.patch('/v1/me').set(s.auth).send({ campus: '' }).expect(200);
      expect(b.body.campus).toBeNull();
      const c = await t.http.patch('/v1/me').set(s.auth).send({ campus: 'ITB' }).expect(200);
      expect(c.body.campus).toBe('ITB');
      const d = await t.http.patch('/v1/me').set(s.auth).send({ campus: null }).expect(200);
      expect(d.body.campus).toBeNull();
    });

    it('PATCH 400: body kosong, email, nama null', async () => {
      const s = await registerUser(t);
      expectError((await t.http.patch('/v1/me').set(s.auth).send({}).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await t.http.patch('/v1/me').set(s.auth).send({ email: 'baru@x.id' }).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await t.http.patch('/v1/me').set(s.auth).send({ name: null }).expect(400)).body, 'VALIDATION_FAILED');
    });
  });

  it('rute tidak ada -> 404 NOT_FOUND bentuk kontrak', async () => {
    const res = await t.http.get('/v1/tidak-ada').expect(404);
    expectError(res.body, 'NOT_FOUND');
  });
});
