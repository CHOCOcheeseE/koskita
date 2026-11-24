import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { REFRESH_TOKEN_REPOSITORY, USER_REPOSITORY } from '../../src/auth/domain/ports';
import { CLOCK, FixedClock } from '../../src/common/domain/clock';
import { PrismaService } from '../../src/common/data/prisma.service';
import { HEALTH_CHECKER } from '../../src/health/domain/health-checker';
import { BILL_REPOSITORY, GROUP_REPOSITORY } from '../../src/split-bill/domain/ports';
import { SCHEDULE_REPOSITORY, TASK_REPOSITORY } from '../../src/study/domain/ports';
import { BUDGET_REPOSITORY, TRANSACTION_REPOSITORY } from '../../src/wallet/domain/ports';
import {
  MemoryBillRepository,
  MemoryBudgetRepository,
  MemoryDb,
  MemoryGroupRepository,
  MemoryHealthChecker,
  MemoryRefreshTokenRepository,
  MemoryScheduleRepository,
  MemoryTaskRepository,
  MemoryTransactionRepository,
  MemoryUserRepository,
} from './in-memory';

export { AuthUseCases } from '../../src/auth/domain/auth.use-cases';

/** Selasa, 24 November 2026 10:00 WIB. */
export const DEFAULT_NOW = new Date('2026-11-24T03:00:00Z');

export interface TestApp {
  app: INestApplication;
  http: ReturnType<typeof request>;
  db: MemoryDb;
  clock: FixedClock;
  health: MemoryHealthChecker;
  close(): Promise<void>;
}

export async function createTestApp(now: Date = DEFAULT_NOW): Promise<TestApp> {
  const db = new MemoryDb();
  const clock = new FixedClock(now);
  const health = new MemoryHealthChecker();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ $disconnect: async () => undefined })
    .overrideProvider(CLOCK)
    .useValue(clock)
    .overrideProvider(HEALTH_CHECKER)
    .useValue(health)
    .overrideProvider(USER_REPOSITORY)
    .useValue(new MemoryUserRepository(db))
    .overrideProvider(REFRESH_TOKEN_REPOSITORY)
    .useValue(new MemoryRefreshTokenRepository(db))
    .overrideProvider(TRANSACTION_REPOSITORY)
    .useValue(new MemoryTransactionRepository(db))
    .overrideProvider(BUDGET_REPOSITORY)
    .useValue(new MemoryBudgetRepository(db))
    .overrideProvider(GROUP_REPOSITORY)
    .useValue(new MemoryGroupRepository(db))
    .overrideProvider(BILL_REPOSITORY)
    .useValue(new MemoryBillRepository(db))
    .overrideProvider(SCHEDULE_REPOSITORY)
    .useValue(new MemoryScheduleRepository(db))
    .overrideProvider(TASK_REPOSITORY)
    .useValue(new MemoryTaskRepository(db))
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  return {
    app,
    http: request(app.getHttpServer()),
    db,
    clock,
    health,
    close: () => app.close(),
  };
}

let counter = 0;

export interface Session {
  userId: string;
  token: string;
  refreshToken: string;
  auth: { Authorization: string };
}

/** Daftar akun baru dan kembalikan token-nya. */
export async function registerUser(t: TestApp, name = 'Anak Kos'): Promise<Session> {
  counter += 1;
  const res = await request(t.app.getHttpServer())
    .post('/v1/auth/register')
    .send({ email: `user${counter}-${Date.now()}@kampus.ac.id`, password: 'rahasia123', name })
    .expect(201);
  return {
    userId: res.body.user.id,
    token: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
    auth: { Authorization: `Bearer ${res.body.tokens.accessToken}` },
  };
}

/** Bentuk error kontrak: `{ error: { code, message } }`. */
export function expectError(body: unknown, code: string): void {
  const b = body as { error?: { code?: unknown; message?: unknown } };
  expect(b.error?.code).toBe(code);
  expect(typeof b.error?.message).toBe('string');
  expect(Object.keys(b)).toEqual(['error']);
}
