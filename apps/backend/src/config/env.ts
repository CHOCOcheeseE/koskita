/** Validasi env saat start. Backend menolak jalan tanpa rahasia JWT yang cukup panjang. */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const secret = config.JWT_ACCESS_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET wajib diisi minimal 32 karakter (lihat .env.example)');
  }
  for (const key of ['ACCESS_TOKEN_TTL_SECONDS', 'REFRESH_TOKEN_TTL_DAYS', 'AUTH_THROTTLE_LIMIT', 'AUTH_THROTTLE_TTL_MS', 'PORT']) {
    const value = config[key];
    if (value !== undefined && value !== '' && !(Number(value) > 0)) {
      throw new Error(`${key} harus angka lebih dari 0`);
    }
  }
  const rounds = config.BCRYPT_ROUNDS;
  if (rounds !== undefined && rounds !== '' && !(Number.isInteger(Number(rounds)) && Number(rounds) >= 4 && Number(rounds) <= 15)) {
    throw new Error('BCRYPT_ROUNDS harus bilangan bulat 4 sampai 15');
  }
  return config;
}
