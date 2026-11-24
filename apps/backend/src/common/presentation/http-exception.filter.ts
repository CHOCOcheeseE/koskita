import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../domain/app-error';

interface ErrorBody {
  error: { code: string; message: string; details?: Record<string, string> };
}

const STATUS_DEFAULTS: Record<number, { code: string; message: string }> = {
  400: { code: 'VALIDATION_FAILED', message: 'Data yang dikirim tidak valid' },
  401: { code: 'UNAUTHENTICATED', message: 'Silakan masuk dulu' },
  403: { code: 'FORBIDDEN', message: 'Kamu tidak punya akses' },
  404: { code: 'NOT_FOUND', message: 'Data tidak ditemukan' },
  405: { code: 'METHOD_NOT_ALLOWED', message: 'Metode tidak didukung' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Data yang dikirim terlalu besar' },
  429: { code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak percobaan. Coba lagi sebentar.' },
};

/** Semua error keluar dalam bentuk kontrak `{ error: { code, message, details? } }`. */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpErrorFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toBody(exception);
    res.status(status).json(body);
  }

  private toBody(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      const error: ErrorBody['error'] = { code: exception.code, message: exception.message };
      if (exception.details) error.details = exception.details;
      return { status: exception.status, body: { error } };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const fallback = STATUS_DEFAULTS[status] ?? {
        code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
        message: status >= 500 ? 'Terjadi kesalahan di server' : 'Permintaan gagal',
      };
      if (status === 400) {
        // Contoh: body JSON rusak dari body-parser.
        return {
          status,
          body: { error: { ...fallback, details: { body: 'Format JSON tidak valid' } } },
        };
      }
      return { status, body: { error: fallback } };
    }

    // body-parser melempar error biasa dengan `status`/`type` untuk JSON rusak atau body terlalu besar.
    const raw = exception as { status?: number; type?: string } | undefined;
    if (raw && typeof raw.status === 'number' && raw.status >= 400 && raw.status < 500) {
      const fallback = STATUS_DEFAULTS[raw.status] ?? STATUS_DEFAULTS[400];
      const error: ErrorBody['error'] = { ...fallback };
      if (raw.status === 400) error.details = { body: 'Format JSON tidak valid' };
      return { status: raw.status, body: { error } };
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return {
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan di server' } },
    };
  }
}
