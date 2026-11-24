import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, { error: 'Email wajib diisi' })
  .pipe(z.email({ error: 'Format email belum benar' }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Kata sandi wajib diisi' }),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(50, { error: 'Nama maksimal 50 karakter' }),
  email: email.pipe(z.string().max(254, { error: 'Email terlalu panjang' })),
  password: z
    .string()
    .min(8, { error: 'Kata sandi minimal 8 karakter' })
    .max(72, { error: 'Kata sandi maksimal 72 karakter' }),
});
export type RegisterForm = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(50, { error: 'Nama maksimal 50 karakter' }),
  campus: z.string().trim().max(80, { error: 'Kampus maksimal 80 karakter' }),
});
export type ProfileForm = z.infer<typeof profileSchema>;
