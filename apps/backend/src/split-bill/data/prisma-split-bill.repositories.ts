import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUniqueViolation, PrismaService } from '../../common/data/prisma.service';
import {
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
} from '../domain/ports';
import type { ShareStatus } from '../domain/rules';

const groupInclude = {
  members: {
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    include: { user: { select: { name: true, campus: true } } },
  },
} satisfies Prisma.GroupInclude;

type GroupRow = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

function toGroup(row: GroupRow): GroupWithMembers {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.inviteCode,
    createdAt: row.createdAt,
    members: row.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      campus: m.user.campus,
      joinedAt: m.joinedAt,
    })),
  };
}

@Injectable()
export class PrismaGroupRepository implements GroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { name: string; inviteCode: string; creatorId: string }): Promise<Group | null> {
    try {
      return await this.prisma.group.create({
        data: { name: input.name, inviteCode: input.inviteCode, members: { create: { userId: input.creatorId } } },
        select: { id: true, name: true, inviteCode: true, createdAt: true },
      });
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }

  async findById(id: string): Promise<GroupWithMembers | null> {
    const row = await this.prisma.group.findUnique({ where: { id }, include: groupInclude });
    return row ? toGroup(row) : null;
  }

  async findByInviteCode(code: string): Promise<GroupWithMembers | null> {
    const row = await this.prisma.group.findUnique({ where: { inviteCode: code }, include: groupInclude });
    return row ? toGroup(row) : null;
  }

  async listForUser(userId: string): Promise<MyGroup[]> {
    const rows = await this.prisma.groupMember.findMany({
      where: { userId },
      orderBy: [{ joinedAt: 'desc' }, { id: 'desc' }],
      include: { group: { select: { id: true, name: true, _count: { select: { members: true } } } } },
    });
    return rows.map((r) => ({ id: r.group.id, name: r.group.name, memberCount: r.group._count.members }));
  }

  async addMember(groupId: string, userId: string, maxMembers: number): Promise<'added' | 'already' | 'full'> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Kunci baris grup supaya dua orang yang gabung bersamaan tidak melewati batas anggota.
        await tx.$queryRaw`SELECT 1 FROM "groups" WHERE "id" = ${groupId}::uuid FOR UPDATE`;
        const existing = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
        if (existing) return 'already' as const;
        const count = await tx.groupMember.count({ where: { groupId } });
        if (count >= maxMembers) return 'full' as const;
        await tx.groupMember.create({ data: { groupId, userId } });
        return 'added' as const;
      });
    } catch (err) {
      if (isUniqueViolation(err)) return 'already';
      throw err;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMember.deleteMany({ where: { groupId, userId } });
  }

  async userNames(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
    return new Map(rows.map((r) => [r.id, r.name]));
  }
}

const billInclude = {
  payer: { select: { name: true } },
  createdBy: { select: { name: true } },
  shares: { include: { user: { select: { name: true } } } },
} satisfies Prisma.BillInclude;

type BillRow = Prisma.BillGetPayload<{ include: typeof billInclude }>;

function toBill(row: BillRow): Bill {
  return {
    id: row.id,
    groupId: row.groupId,
    title: row.title,
    totalAmount: row.totalAmount,
    splitMethod: row.splitMethod as SplitMethod,
    payerId: row.payerId,
    payerName: row.payer.name,
    createdById: row.createdById,
    createdByName: row.createdBy.name,
    status: row.status as BillStatus,
    createdAt: row.createdAt,
    shares: row.shares.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name,
      amount: s.amount,
      status: s.status as ShareStatus,
      updatedAt: s.updatedAt,
    })),
  };
}

@Injectable()
export class PrismaBillRepository implements BillRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    const { shares, ...bill } = input;
    const row = await this.prisma.bill.create({
      data: { ...bill, shares: { create: shares } },
      include: billInclude,
    });
    return toBill(row);
  }

  async findById(id: string): Promise<Bill | null> {
    const row = await this.prisma.bill.findUnique({ where: { id }, include: billInclude });
    return row ? toBill(row) : null;
  }

  async listByGroup(groupId: string, status: BillStatus | undefined, after: BillCursor | null, take: number): Promise<Bill[]> {
    const where: Prisma.BillWhereInput = { groupId };
    if (status) where.status = status;
    if (after) {
      where.OR = [{ createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } }];
    }
    const rows = await this.prisma.bill.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: billInclude,
    });
    return rows.map(toBill);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.bill.delete({ where: { id } });
  }

  async transitionShare(billId: string, shareId: string, from: ShareStatus, to: ShareStatus): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.billShare.updateMany({ where: { id: shareId, billId, status: from }, data: { status: to } });
      if (count !== 1) return false;
      const open = await tx.billShare.count({ where: { billId, status: { not: 'lunas' } } });
      await tx.bill.update({ where: { id: billId }, data: { status: open === 0 ? 'settled' : 'open' } });
      return true;
    });
  }

  async openDebts(groupIds: string[]): Promise<GroupDebt[]> {
    if (groupIds.length === 0) return [];
    const rows = await this.prisma.billShare.findMany({
      where: { status: { not: 'lunas' }, bill: { groupId: { in: groupIds } } },
      select: { userId: true, amount: true, bill: { select: { groupId: true, payerId: true } } },
    });
    return rows
      .filter((r) => r.userId !== r.bill.payerId)
      .map((r) => ({ groupId: r.bill.groupId, from: r.userId, to: r.bill.payerId, amount: r.amount }));
  }
}

export const mathRandom = (): number => Math.random();
