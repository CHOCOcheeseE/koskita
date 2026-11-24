import { ApiClient } from '../src/data/api/client';
import type { TokenStorage } from '../src/data/api/token-storage';

type Tokens = { accessToken: string; refreshToken: string };
type Call = { url: string; method: string; auth: string | undefined; body: unknown };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const expired = () => json(401, { error: { code: 'TOKEN_EXPIRED', message: 'Sesi habis' } });

function memoryTokens(initial: Tokens | null) {
  let current = initial;
  return {
    get: async () => current,
    save: async (t: Tokens) => {
      current = t;
    },
    clear: async () => {
      current = null;
    },
    peek: () => current,
  };
}

/** fetch palsu: `handler` menerima tiap panggilan dan mengembalikan Response. */
function fakeFetch(handler: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const headers = (init.headers ?? {}) as Record<string, string>;
    const call: Call = {
      url,
      method: String(init.method),
      auth: headers.Authorization,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

describe('ApiClient', () => {
  let restore: () => void = () => undefined;
  afterEach(() => restore());

  function client(tokens: ReturnType<typeof memoryTokens>, onSessionExpired = jest.fn()) {
    return new ApiClient({
      baseUrl: 'http://localhost:3000/',
      tokens: tokens as unknown as TokenStorage,
      onSessionExpired: onSessionExpired as unknown as () => void,
    });
  }

  it('TOKEN_EXPIRED: refresh sekali lalu ulang request dengan token baru', async () => {
    const tokens = memoryTokens({ accessToken: 'lama', refreshToken: 'r1' });
    const f = fakeFetch((c) => {
      if (c.url.endsWith('/v1/auth/refresh')) return json(200, { accessToken: 'baru', refreshToken: 'r2', accessTokenExpiresAt: 'x' });
      return c.auth === 'Bearer baru' ? json(200, { ok: true }) : expired();
    });
    restore = f.restore;
    const res = await client(tokens).request('GET', '/v1/me');
    expect(res).toEqual({ ok: true });
    expect(tokens.peek()).toEqual({ accessToken: 'baru', refreshToken: 'r2' });
    expect(f.calls.map((c) => c.url)).toEqual([
      'http://localhost:3000/v1/me',
      'http://localhost:3000/v1/auth/refresh',
      'http://localhost:3000/v1/me',
    ]);
  });

  it('tiga request kedaluwarsa bersamaan hanya memicu satu refresh (token sekali pakai)', async () => {
    const tokens = memoryTokens({ accessToken: 'lama', refreshToken: 'r1' });
    let refreshes = 0;
    const f = fakeFetch(async (c) => {
      if (c.url.endsWith('/v1/auth/refresh')) {
        refreshes += 1;
        await new Promise((r) => setTimeout(r, 20));
        return json(200, { accessToken: 'baru', refreshToken: 'r2', accessTokenExpiresAt: 'x' });
      }
      return c.auth === 'Bearer baru' ? json(200, { ok: true }) : expired();
    });
    restore = f.restore;
    const api = client(tokens);
    await Promise.all([api.request('GET', '/v1/a'), api.request('GET', '/v1/b'), api.request('GET', '/v1/c')]);
    expect(refreshes).toBe(1);
  });

  it('refresh gagal: SESSION_EXPIRED, token dihapus, callback dipanggil', async () => {
    const tokens = memoryTokens({ accessToken: 'lama', refreshToken: 'r1' });
    const onExpired = jest.fn();
    const f = fakeFetch((c) =>
      c.url.endsWith('/v1/auth/refresh') ? json(401, { error: { code: 'SESSION_EXPIRED', message: 'x' } }) : expired(),
    );
    restore = f.restore;
    await expect(client(tokens, onExpired).request('GET', '/v1/me')).rejects.toMatchObject({ code: 'SESSION_EXPIRED', status: 401 });
    expect(tokens.peek()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('401 login salah (tanpa bearer) tidak menghapus sesi', async () => {
    const tokens = memoryTokens(null);
    const onExpired = jest.fn();
    const f = fakeFetch(() => json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'salah' } }));
    restore = f.restore;
    await expect(
      client(tokens, onExpired).request('POST', '/v1/auth/login', { body: { email: 'a@b.id', password: 'x' }, auth: false }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(onExpired).toHaveBeenCalledTimes(0);
    expect(f.calls[0].auth).toBe(undefined);
  });

  it('error bukan JSON jadi HTTP_<status>, jaringan putus jadi NETWORK', async () => {
    const tokens = memoryTokens({ accessToken: 't', refreshToken: 'r' });
    const f = fakeFetch(() => new Response('<html>oops</html>', { status: 502 }));
    restore = f.restore;
    await expect(client(tokens).request('GET', '/v1/me')).rejects.toMatchObject({ code: 'HTTP_502', status: 502 });
    f.restore();
    const g = fakeFetch(() => {
      throw new TypeError('Network request failed');
    });
    restore = g.restore;
    await expect(client(tokens).request('GET', '/v1/me')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
  });

  it('query kosong/null dibuang dan nilai di-encode', async () => {
    const tokens = memoryTokens({ accessToken: 't', refreshToken: 'r' });
    const f = fakeFetch(() => json(200, { items: [], nextCursor: null }));
    restore = f.restore;
    await client(tokens).request('GET', '/v1/wallet/transactions', { query: { month: '2026-11', cursor: null, status: '', q: 'a b&c' } });
    expect(f.calls[0].url).toBe('http://localhost:3000/v1/wallet/transactions?month=2026-11&q=a%20b%26c');
  });

  it('204 tanpa body dikembalikan undefined', async () => {
    const tokens = memoryTokens({ accessToken: 't', refreshToken: 'r' });
    const f = fakeFetch(() => new Response(null, { status: 204 }));
    restore = f.restore;
    const res = await client(tokens).request('DELETE', '/v1/bills/x');
    expect(res).toBe(undefined);
  });
});
