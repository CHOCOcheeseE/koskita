// Env tetap untuk tes. Tidak membaca .env supaya hasil tes sama di semua mesin.
process.env.JWT_ACCESS_SECRET = 'rahasia-tes-lokal-yang-panjangnya-lebih-dari-32-karakter';
process.env.ACCESS_TOKEN_TTL_SECONDS = '900';
process.env.REFRESH_TOKEN_TTL_DAYS = '30';
process.env.AUTH_THROTTLE_LIMIT = process.env.AUTH_THROTTLE_LIMIT ?? '1000';
process.env.AUTH_THROTTLE_TTL_MS = '60000';
// bcrypt cost rendah hanya untuk tes supaya cepat; produksi tetap 10.
process.env.BCRYPT_ROUNDS = '4';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://tes:tes@localhost:5432/tes';
