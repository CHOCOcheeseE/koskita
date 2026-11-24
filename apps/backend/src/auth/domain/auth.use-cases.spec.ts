import { FixedClock } from '../../common/domain/clock';
import { MemoryDb, MemoryRefreshTokenRepository, MemoryUserRepository } from '../../../test/support/in-memory';
import { AuthUseCases } from './auth.use-cases';
import { AccessTokenSigner, PasswordHasher, RefreshTokenFactory } from './ports';

const hasher: PasswordHasher = {
  hash: async (p) => `hash:${p}`,
  compare: async (p, h) => h === `hash:${p}`,
};
const signer: AccessTokenSigner = {
  sign: async (userId, now) => ({ token: `jwt:${userId}`, expiresAt: new Date(now.getTime() + 900_000) }),
};
let n = 0;
const factory: RefreshTokenFactory = { generate: () => `rt-${++n}`, hash: (t) => `h-${t}` };

function setup() {
  const db = new MemoryDb();
  const clock = new FixedClock(new Date('2026-11-24T03:00:00Z'));
  const uc = new AuthUseCases(
    new MemoryUserRepository(db),
    new MemoryRefreshTokenRepository(db),
    hasher,
    signer,
    factory,
    clock,
    { refreshTokenTtlDays: 30 },
  );
  return { db, clock, uc };
}

describe('AuthUseCases', () => {
  it('register: email huruf kecil, nama di-trim, kata sandi di-hash', async () => {
    const { db, uc } = setup();
    const s = await uc.register({ email: ' Eko@Mail.COM ', password: 'rahasia123', name: ' Eko ' });
    expect(s.user).toMatchObject({ email: 'eko@mail.com', name: 'Eko' });
    expect(db.users.get(s.user.id)!.passwordHash).toBe('hash:rahasia123');
    expect(s.user).not.toHaveProperty('passwordHash');
  });

  it('register email dobel -> EMAIL_TAKEN 409', async () => {
    const { uc } = setup();
    await uc.register({ email: 'a@b.id', password: 'rahasia123', name: 'Aa' });
    await expect(uc.register({ email: 'A@B.ID', password: 'rahasia123', name: 'Bb' })).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  it('login salah -> INVALID_CREDENTIALS', async () => {
    const { uc } = setup();
    await uc.register({ email: 'a@b.id', password: 'rahasia123', name: 'Aa' });
    await expect(uc.login({ email: 'a@b.id', password: 'salah' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(uc.login({ email: 'x@b.id', password: 'salah' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(uc.login({ email: 'A@B.id', password: 'rahasia123' })).resolves.toMatchObject({ user: { email: 'a@b.id' } });
  });

  it('refresh token kedaluwarsa setelah 30 hari -> SESSION_EXPIRED', async () => {
    const { uc, clock } = setup();
    const s = await uc.register({ email: 'a@b.id', password: 'rahasia123', name: 'Aa' });
    clock.set(new Date('2026-12-24T03:00:01Z'));
    await expect(uc.refresh(s.tokens.refreshToken)).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' });
  });

  it('logout hanya mencabut token milik sendiri', async () => {
    const { uc } = setup();
    const a = await uc.register({ email: 'a@b.id', password: 'rahasia123', name: 'Aa' });
    const b = await uc.register({ email: 'b@b.id', password: 'rahasia123', name: 'Bb' });
    await uc.logout(b.user.id, a.tokens.refreshToken);
    await expect(uc.refresh(a.tokens.refreshToken)).resolves.toBeDefined();
  });
});
