/**
 * Error aturan bisnis yang dilempar use case.
 * Filter HTTP mengubahnya ke bentuk kontrak `{ error: { code, message, details? } }`.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message = 'Data tidak ditemukan'): AppError =>
  new AppError(404, 'NOT_FOUND', message);

export const notGroupMember = (): AppError =>
  new AppError(403, 'NOT_GROUP_MEMBER', 'Kamu bukan anggota grup ini');

export const validationFailed = (details: Record<string, string>): AppError =>
  new AppError(400, 'VALIDATION_FAILED', Object.values(details)[0] ?? 'Data yang dikirim tidak valid', details);
