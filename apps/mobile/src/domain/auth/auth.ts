export type User = {
  id: string;
  email: string;
  name: string;
  campus: string | null;
  createdAt: string;
};

export type RegisterInput = { email: string; password: string; name: string };
export type LoginInput = { email: string; password: string };
export type UpdateProfileInput = { name?: string; campus?: string | null };

export interface AuthRepository {
  /** Daftar, simpan token di perangkat, kembalikan profil. */
  register(input: RegisterInput): Promise<User>;
  /** Masuk, simpan token di perangkat, kembalikan profil. */
  login(input: LoginInput): Promise<User>;
  /** Cabut refresh token di server (jika bisa) lalu hapus token di perangkat. */
  logout(): Promise<void>;
  /** Ada sesi tersimpan di perangkat. */
  hasSession(): Promise<boolean>;
  getProfile(): Promise<User>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
}

export function createAuthUseCases(repo: AuthRepository) {
  return {
    register: (input: RegisterInput) =>
      repo.register({ ...input, email: input.email.trim().toLowerCase(), name: input.name.trim() }),
    login: (input: LoginInput) => repo.login({ ...input, email: input.email.trim().toLowerCase() }),
    logout: async () => {
      try {
        await repo.logout();
      } catch {
        // Keluar di perangkat tetap jalan walau server tidak bisa dihubungi.
      }
    },
    hasSession: () => repo.hasSession(),
    getProfile: () => repo.getProfile(),
    updateProfile: (input: UpdateProfileInput) => {
      const patch: UpdateProfileInput = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.campus !== undefined) {
        const campus = input.campus?.trim() ?? '';
        patch.campus = campus === '' ? null : campus;
      }
      return repo.updateProfile(patch);
    },
  };
}

export type AuthUseCases = ReturnType<typeof createAuthUseCases>;

/** Dua huruf inisial untuk avatar. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
