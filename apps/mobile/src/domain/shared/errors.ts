/** Error seragam dari API (`ErrorResponse`) atau dari jaringan (`NETWORK`). */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function hasCode(error: unknown, ...codes: string[]): boolean {
  return isAppError(error) && codes.includes(error.code);
}

export const NETWORK_ERROR_CODE = 'NETWORK';
