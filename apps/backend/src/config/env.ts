/** Nilai contoh JWT_ACCESS_SECRET di .env.example. Tidak boleh dipakai sungguhan. */
export const JWT_SECRET_PLACEHOLDER = 'ganti-dengan-string-acak-minimal-32-karakter';

const SECRET_HINT =
  'Buat yang acak, misalnya: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"';

const POSITIVE_NUMBERS = [
  'ACCESS_TOKEN_TTL_SECONDS',
  'REFRESH_TOKEN_TTL_DAYS',
  'AUTH_THROTTLE_LIMIT',
  'AUTH_THROTTLE_TTL_MS',
  'JOIN_THROTTLE_LIMIT',
  'JOIN_THROTTLE_TTL_MS',
  'PORT',
];

/** Validasi env saat start. Backend menolak jalan tanpa rahasia JWT yang cukup panjang dan bukan contoh. */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const secret = config.JWT_ACCESS_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error(`JWT_ACCESS_SECRET wajib diisi minimal 32 karakter (lihat .env.example). ${SECRET_HINT}`);
  }
  if (secret === JWT_SECRET_PLACEHOLDER || secret.toLowerCase().includes('ganti')) {
    throw new Error(`JWT_ACCESS_SECRET masih memakai nilai contoh dari .env.example. ${SECRET_HINT}`);
  }
  for (const key of POSITIVE_NUMBERS) {
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
