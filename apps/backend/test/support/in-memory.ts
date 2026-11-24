import { randomUUID } from 'node:crypto';
import type {
  RefreshTokenRepository,
  User,
  UserRepository,
  UserWithPassword,
} from '../../src/auth/domain/ports';
import type { HealthChecker } from '../../src/health/domain/health-checker';
import type {
  Bill,
  BillCursor,
  BillRepository,
  BillStatus,
  Group,
  GroupDebt,
  GroupRepository,
  GroupWithMembers,
  MyGroup,
  SplitMethod,
} from '../../src/split-bill/domain/ports';
import type { ShareStatus } from '../../src/split-bill/domain/rules';
import type {
  ClassSchedule,
  ScheduleData,
  ScheduleRepository,
  StudyTask,
  TaskCursor,
  TaskData,
  TaskRepository,
} from '../../src/study/domain/ports';
import type { TaskStatus } from '../../src/study/domain/rules';
import type { Category } from '../../src/wallet/domain/categories';
import type { BudgetRepository, Transaction, TransactionCursor, TransactionRepository } from '../../src/wallet/domain/ports';

/**
 * Database tiruan di memori, meniru perilaku repository Prisma (urutan, unique, cascade).
 * Dipakai tes e2e dan unit supaya bisa jalan tanpa PostgreSQL.
 */

let tick = Date.parse('2026-01-01T00:00:00Z');
/** Timestamp yang selalu naik supaya urutan createdAt/joinedAt stabil. */
function stamp(): Date {
  tick += 1000;
  return new Date(tick);
}

const cmpDesc = (a: string | number, b: string | number) => (a < b ? 1 : a > b ? -1 : 0);

export class MemoryDb {
  users = new Map<string, UserWithPassword>();
  refreshTokens = new Map<string, { userId: string; expiresAt: Date; usedAt: Date | null; revokedAt: Date | null }>();
  transactions = new Map<string, Transaction>();
  budgets = new Map<string, number>();
  groups = new Map<string, Group>();
  members: { groupId: string; userId: string; joinedAt: Date }[] = [];
  bills = new Map<string, Omit<Bill, 'payerName' | 'createdByName' | 'shares'> & { shares: Omit<Bill['shares'][number], 'userName'>[] }>();
  schedules = new Map<string, ClassSchedule>();
  tasks = new Map<string, Omit<StudyTask, 'courseName'>>();
}

export class MemoryUserRepository implements UserRepository {
  constructor(private readonly db: MemoryDb) {}

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return [...this.db.users.values()].find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const u = this.db.users.get(id);
    if (!u) return null;
    const { passwordHash: _p, ...user } = u;
    void _p;
    return user;
  }

  async create(input: { email: string; name: string; passwordHash: string }): Promise<User | null> {
    if (await this.findByEmail(input.email)) return null;
    const user = { id: randomUUID(), campus: null, createdAt: stamp(), ...input };
    this.db.users.set(user.id, user);
    return this.findById(user.id);
  }

  async update(id: string, input: { name?: string; campus?: string | null }): Promise<User> {
    const u = this.db.users.get(id)!;
    Object.assign(u, input);
    return (await this.findById(id))!;
  }
}

export class MemoryRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    this.db.refreshTokens.set(input.tokenHash, { userId: input.userId, expiresAt: input.expiresAt, usedAt: null, revokedAt: null });
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const row = this.db.refreshTokens.get(tokenHash);
    if (!row || row.usedAt || row.revokedAt || row.expiresAt <= now) return null;
    row.usedAt = now;
    return row.userId;
  }

  async revoke(tokenHash: string, userId: string, now: Date): Promise<void> {
    const row = this.db.refreshTokens.get(tokenHash);
    if (row && row.userId === userId && !row.revokedAt) row.revokedAt = now;
  }
}

export class MemoryTransactionRepository implements TransactionRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(input: { userId: string; category: Category; amount: number; date: string; note: string | null }): Promise<Transaction> {
    const now = stamp();
    const t: Transaction = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.db.transactions.set(t.id, t);
    return { ...t };
  }

  async findOwned(userId: string, id: string): Promise<Transaction | null> {
    const t = this.db.transactions.get(id);
    return t && t.userId === userId ? { ...t } : null;
  }

  async update(id: string, input: { category: Category; amount: number; date: string; note: string | null }): Promise<Transaction> {
    const t = this.db.transactions.get(id)!;
    Object.assign(t, input, { updatedAt: stamp() });
    return { ...t };
  }

  async delete(id: string): Promise<void> {
    this.db.transactions.delete(id);
  }

  async listInRange(userId: string, from: string, to: string, after: TransactionCursor | null, take: number): Promise<Transaction[]> {
    const key = (t: { date: string; createdAt: Date; id: string }) => `${t.date}|${t.createdAt.toISOString()}|${t.id}`;
    const afterKey = after ? key(after) : null;
    return [...this.db.transactions.values()]
      .filter((t) => t.userId === userId && t.date >= from && t.date <= to)
      .filter((t) => afterKey === null || key(t) < afterKey)
      .sort((a, b) => cmpDesc(key(a), key(b)))
      .slice(0, take)
      .map((t) => ({ ...t }));
  }

  async sumByCategory(userId: string, from: string, to: string): Promise<{ category: Category; amount: number }[]> {
    const sums = new Map<Category, number>();
    for (const t of this.db.transactions.values()) {
      if (t.userId !== userId || t.date < from || t.date > to) continue;
      sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount);
    }
    return [...sums.entries()].map(([category, amount]) => ({ category, amount }));
  }
}

export class MemoryBudgetRepository implements BudgetRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(userId: string, month: string): Promise<{ amount: number } | null> {
    const amount = this.db.budgets.get(`${userId}|${month}`);
    return amount === undefined ? null : { amount };
  }

  async upsert(userId: string, month: string, amount: number): Promise<{ amount: number }> {
    this.db.budgets.set(`${userId}|${month}`, amount);
    return { amount };
  }
}

export class MemoryGroupRepository implements GroupRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(input: { name: string; inviteCode: string; creatorId: string }): Promise<Group | null> {
    if ([...this.db.groups.values()].some((g) => g.inviteCode === input.inviteCode)) return null;
    const group: Group = { id: randomUUID(), name: input.name, inviteCode: input.inviteCode, createdAt: stamp() };
    this.db.groups.set(group.id, group);
    this.db.members.push({ groupId: group.id, userId: input.creatorId, joinedAt: stamp() });
    return { ...group };
  }

  async findById(id: string): Promise<GroupWithMembers | null> {
    const g = this.db.groups.get(id);
    if (!g) return null;
    const members = this.db.members
      .filter((m) => m.groupId === id)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((m) => {
        const u = this.db.users.get(m.userId)!;
        return { userId: m.userId, name: u.name, campus: u.campus, joinedAt: m.joinedAt };
      });
    return { ...g, members };
  }

  async findByInviteCode(code: string): Promise<GroupWithMembers | null> {
    const g = [...this.db.groups.values()].find((x) => x.inviteCode === code);
    return g ? this.findById(g.id) : null;
  }

  async listForUser(userId: string): Promise<MyGroup[]> {
    return this.db.members
      .filter((m) => m.userId === userId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
      .map((m) => {
        const g = this.db.groups.get(m.groupId)!;
        return { id: g.id, name: g.name, memberCount: this.db.members.filter((x) => x.groupId === g.id).length };
      });
  }

  async addMember(groupId: string, userId: string, maxMembers: number): Promise<'added' | 'already' | 'full'> {
    const list = this.db.members.filter((m) => m.groupId === groupId);
    if (list.some((m) => m.userId === userId)) return 'already';
    if (list.length >= maxMembers) return 'full';
    this.db.members.push({ groupId, userId, joinedAt: stamp() });
    return 'added';
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    this.db.members = this.db.members.filter((m) => !(m.groupId === groupId && m.userId === userId));
  }

  async userNames(userIds: string[]): Promise<Map<string, string>> {
    return new Map(userIds.filter((id) => this.db.users.has(id)).map((id) => [id, this.db.users.get(id)!.name]));
  }
}

export class MemoryBillRepository implements BillRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(input: {
    groupId: string;
    title: string;
    totalAmount: number;
    splitMethod: SplitMethod;
    payerId: string;
    createdById: string;
    status: BillStatus;
    shares: { userId: string; amount: number; status: ShareStatus }[];
  }): Promise<Bill> {
    const createdAt = stamp();
    const bill = {
      id: randomUUID(),
      groupId: input.groupId,
      title: input.title,
      totalAmount: input.totalAmount,
      splitMethod: input.splitMethod,
      payerId: input.payerId,
      createdById: input.createdById,
      status: input.status,
      createdAt,
      shares: input.shares.map((s) => ({ id: randomUUID(), ...s, updatedAt: createdAt })),
    };
    this.db.bills.set(bill.id, bill);
    return (await this.findById(bill.id))!;
  }

  async findById(id: string): Promise<Bill | null> {
    const b = this.db.bills.get(id);
    if (!b) return null;
    const name = (uid: string) => this.db.users.get(uid)?.name ?? '';
    return {
      ...b,
      payerName: name(b.payerId),
      createdByName: name(b.createdById),
      shares: b.shares.map((s) => ({ ...s, userName: name(s.userId) })),
    };
  }

  async listByGroup(groupId: string, status: BillStatus | undefined, after: BillCursor | null, take: number): Promise<Bill[]> {
    const key = (b: { createdAt: Date; id: string }) => `${b.createdAt.toISOString()}|${b.id}`;
    const afterKey = after ? key(after) : null;
    const rows = [...this.db.bills.values()]
      .filter((b) => b.groupId === groupId && (!status || b.status === status))
      .filter((b) => afterKey === null || key(b) < afterKey)
      .sort((a, b) => cmpDesc(key(a), key(b)))
      .slice(0, take);
    return Promise.all(rows.map(async (b) => (await this.findById(b.id))!));
  }

  async delete(id: string): Promise<void> {
    this.db.bills.delete(id);
  }

  async transitionShare(billId: string, shareId: string, from: ShareStatus, to: ShareStatus): Promise<boolean> {
    const bill = this.db.bills.get(billId);
    const share = bill?.shares.find((s) => s.id === shareId);
    if (!bill || !share || share.status !== from) return false;
    share.status = to;
    share.updatedAt = stamp();
    bill.status = bill.shares.every((s) => s.status === 'lunas') ? 'settled' : 'open';
    return true;
  }

  async openDebts(groupIds: string[]): Promise<GroupDebt[]> {
    const out: GroupDebt[] = [];
    for (const b of this.db.bills.values()) {
      if (!groupIds.includes(b.groupId)) continue;
      for (const s of b.shares) {
        if (s.status !== 'lunas' && s.userId !== b.payerId) {
          out.push({ groupId: b.groupId, from: s.userId, to: b.payerId, amount: s.amount });
        }
      }
    }
    return out;
  }
}

export class MemoryScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: MemoryDb) {}

  async create(userId: string, data: ScheduleData): Promise<ClassSchedule> {
    const s = { id: randomUUID(), userId, ...data };
    this.db.schedules.set(s.id, s);
    return { ...s };
  }

  async findOwned(userId: string, id: string): Promise<ClassSchedule | null> {
    const s = this.db.schedules.get(id);
    return s && s.userId === userId ? { ...s } : null;
  }

  async update(id: string, data: ScheduleData): Promise<ClassSchedule> {
    const s = this.db.schedules.get(id)!;
    Object.assign(s, data);
    return { ...s };
  }

  async delete(id: string): Promise<void> {
    this.db.schedules.delete(id);
    for (const t of this.db.tasks.values()) if (t.scheduleId === id) t.scheduleId = null;
  }

  async list(userId: string, dayOfWeek?: number): Promise<ClassSchedule[]> {
    return [...this.db.schedules.values()]
      .filter((s) => s.userId === userId && (dayOfWeek === undefined || s.dayOfWeek === dayOfWeek))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute || a.endMinute - b.endMinute || a.id.localeCompare(b.id))
      .map((s) => ({ ...s }));
  }
}

export class MemoryTaskRepository implements TaskRepository {
  constructor(private readonly db: MemoryDb) {}

  private view(t: Omit<StudyTask, 'courseName'>): StudyTask {
    return { ...t, courseName: t.scheduleId ? (this.db.schedules.get(t.scheduleId)?.courseName ?? null) : null };
  }

  async create(userId: string, data: TaskData): Promise<StudyTask> {
    const t = { id: randomUUID(), userId, ...data, createdAt: stamp() };
    this.db.tasks.set(t.id, t);
    return this.view(t);
  }

  async findOwned(userId: string, id: string): Promise<StudyTask | null> {
    const t = this.db.tasks.get(id);
    return t && t.userId === userId ? this.view(t) : null;
  }

  async update(id: string, data: TaskData): Promise<StudyTask> {
    const t = this.db.tasks.get(id)!;
    Object.assign(t, data);
    return this.view(t);
  }

  async delete(id: string): Promise<void> {
    this.db.tasks.delete(id);
  }

  async list(userId: string, status: TaskStatus, after: TaskCursor | null, take: number): Promise<StudyTask[]> {
    const value = (t: Omit<StudyTask, 'courseName'>) => (status === 'belum' ? t.deadline : t.completedAt!).toISOString();
    const rows = [...this.db.tasks.values()].filter((t) => t.userId === userId && t.status === status);
    const asc = status === 'belum';
    const key = (t: Omit<StudyTask, 'courseName'>) => `${value(t)}|${t.id}`;
    const afterKey = after ? `${after.value.toISOString()}|${after.id}` : null;
    return rows
      .filter((t) => afterKey === null || (asc ? key(t) > afterKey : key(t) < afterKey))
      .sort((a, b) => (asc ? -cmpDesc(key(a), key(b)) : cmpDesc(key(a), key(b))))
      .slice(0, take)
      .map((t) => this.view(t));
  }
}

export class MemoryHealthChecker implements HealthChecker {
  up = true;

  async isDatabaseUp(): Promise<boolean> {
    return this.up;
  }
}
