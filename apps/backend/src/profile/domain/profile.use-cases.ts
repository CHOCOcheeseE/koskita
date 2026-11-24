import { notFound } from '../../common/domain/app-error';
import type { User, UserRepository } from '../../auth/domain/ports';

export class ProfileUseCases {
  constructor(private readonly users: UserRepository) {}

  async get(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw notFound('Akun tidak ditemukan');
    return user;
  }

  async update(userId: string, input: { name?: string; campus?: string | null }): Promise<User> {
    await this.get(userId);
    const patch: { name?: string; campus?: string | null } = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.campus !== undefined) {
      const campus = input.campus?.trim() ?? '';
      patch.campus = campus === '' ? null : campus;
    }
    return this.users.update(userId, patch);
  }
}
