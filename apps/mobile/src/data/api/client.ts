import { AppError, NETWORK_ERROR_CODE } from '@/domain/shared/errors';

import type { components } from './schema';
import type { TokenStorage } from './token-storage';

export type Schemas = components['schemas'];

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Record<string, string | number | null | undefined>;

export type RequestOptions = {
  body?: unknown;
  query?: Query;
  /** `false` untuk endpoint tanpa bearer (register, login, refresh). */
  auth?: boolean;
};

export type ApiClientOptions = {
  baseUrl: string;
  tokens: TokenStorage;
  /** Dipanggil saat sesi tidak bisa dipulihkan (refresh gagal / token ditolak). */
  onSessionExpired: () => void;
  timeoutMs?: number;
};

const NETWORK_MESSAGE =
  'Tidak bisa tersambung ke server KosKita. Cek koneksi atau pastikan server lokal menyala.';

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const url = baseUrl.replace(/\/+$/, '') + path;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

async function toAppError(res: Response): Promise<AppError> {
  try {
    const body = (await res.json()) as Partial<Schemas['ErrorResponse']>;
    if (body?.error?.code) {
      return new AppError(res.status, body.error.code, body.error.message ?? '', body.error.details);
    }
  } catch {
    // Badan respons bukan JSON.
  }
  return new AppError(res.status, `HTTP_${res.status}`, 'Terjadi kesalahan di server.');
}

/**
 * Klien fetch untuk kontrak KosKita: bearer token, refresh otomatis sekali saat `TOKEN_EXPIRED`
 * lalu ulang request, dan parsing `ErrorResponse` menjadi `AppError`.
 */
export class ApiClient {
  private refreshing: Promise<boolean> | null = null;

  constructor(private readonly options: ApiClientOptions) {}

  get tokens(): TokenStorage {
    return this.options.tokens;
  }

  async request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
    const auth = options.auth ?? true;
    let res = await this.send(method, path, options, auth);

    if (auth && res.status === 401) {
      const error = await toAppError(res);
      if (error.code !== 'TOKEN_EXPIRED') {
        await this.expireSession();
        throw error;
      }
      const refreshed = await this.refreshOnce();
      if (!refreshed) {
        await this.expireSession();
        throw new AppError(401, 'SESSION_EXPIRED', 'Sesi berakhir, silakan masuk lagi');
      }
      res = await this.send(method, path, options, auth);
      if (res.status === 401) {
        const retryError = await toAppError(res);
        await this.expireSession();
        throw retryError;
      }
    }

    if (!res.ok) throw await toAppError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private async send(method: Method, path: string, options: RequestOptions, auth: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const tokens = await this.options.tokens.get();
      if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15000);
    try {
      return await fetch(buildUrl(this.options.baseUrl, path, options.query), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch {
      throw new AppError(0, NETWORK_ERROR_CODE, NETWORK_MESSAGE);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Satu refresh berjalan untuk semua request yang kedaluwarsa bersamaan (token sekali pakai). */
  private refreshOnce(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const current = await this.options.tokens.get();
    if (!current) return false;
    const body: Schemas['RefreshRequest'] = { refreshToken: current.refreshToken };
    const res = await this.send('POST', '/v1/auth/refresh', { body }, false);
    if (!res.ok) return false;
    const tokens = (await res.json()) as Schemas['AuthTokens'];
    await this.options.tokens.save({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return true;
  }

  private async expireSession(): Promise<void> {
    await this.options.tokens.clear();
    this.options.onSessionExpired();
  }
}
