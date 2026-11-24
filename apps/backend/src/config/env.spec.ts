import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JWT_SECRET_PLACEHOLDER, validateEnv } from './env';

const GOOD = 'f3a9c1d7e2b84f6a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f';

describe('validateEnv', () => {
  it('rahasia acak 32+ karakter diterima', () => {
    expect(validateEnv({ JWT_ACCESS_SECRET: GOOD })).toEqual({ JWT_ACCESS_SECRET: GOOD });
  });

  it('placeholder dari .env.example ditolak (S1)', () => {
    const example = readFileSync(resolve(__dirname, '../../.env.example'), 'utf8');
    const fromFile = /^JWT_ACCESS_SECRET="?([^"\n]*)"?/m.exec(example)?.[1];
    expect(fromFile).toBe(JWT_SECRET_PLACEHOLDER);
    expect(() => validateEnv({ JWT_ACCESS_SECRET: fromFile })).toThrow(/nilai contoh/);
  });

  it('rahasia yang mengandung "ganti" ditolak, apa pun kapitalnya', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'GANTI-ini-nanti-saja-0123456789abcdef' })).toThrow(/nilai contoh/);
  });

  it('rahasia pendek atau kosong ditolak', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'pendek' })).toThrow(/minimal 32/);
    expect(() => validateEnv({})).toThrow(/minimal 32/);
  });

  it('angka env harus positif', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: GOOD, JOIN_THROTTLE_LIMIT: '0' })).toThrow(/JOIN_THROTTLE_LIMIT/);
    expect(() => validateEnv({ JWT_ACCESS_SECRET: GOOD, BCRYPT_ROUNDS: '3' })).toThrow(/BCRYPT_ROUNDS/);
  });
});
