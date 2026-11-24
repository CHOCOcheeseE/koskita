import { Injectable } from '@nestjs/common';
import { Prisma, Transaction as TransactionRow } from '@prisma/client';
import { PrismaService } from '../../common/data/prisma.service';
import { dateToUtcMidnight, utcMidnightToDate } from '../../common/time/wib';
import type { Category } from '../domain/categories';
import { BudgetRepository, Transaction, TransactionCursor, TransactionRepository } from '../domain/ports';

function toEntity(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as Category,
    amount: row.amount,
    date: utcMidnightToDate(row.date),
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { userId: string; category: Category; amount: number; date: string; note: string | null }): Promise<Transaction> {
    const row = await this.prisma.transaction.create({
      data: { ...input, date: dateToUtcMidnight(input.date) },
    });
    return toEntity(row);
  }

  async findOwned(userId: string, id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findFirst({ where: { id, userId } });
    return row ? toEntity(row) : null;
  }

  async update(id: string, input: { category: Category; amount: number; date: string; note: string | null }): Promise<Transaction> {
    const row = await this.prisma.transaction.update({
      where: { id },
      data: { ...input, date: dateToUtcMidnight(input.date) },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }

  async listInRange(userId: string, from: string, to: string, after: TransactionCursor | null, take: number): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      date: { gte: dateToUtcMidnight(from), lte: dateToUtcMidnight(to) },
    };
    if (after) {
      const d = dateToUtcMidnight(after.date);
      where.OR = [
        { date: { lt: d } },
        { date: d, createdAt: { lt: after.createdAt } },
        { date: d, createdAt: after.createdAt, id: { lt: after.id } },
      ];
    }
    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
    return rows.map(toEntity);
  }

  async sumByCategory(userId: string, from: string, to: string): Promise<{ category: Category; amount: number }[]> {
    // SUM dihitung sebagai bigint supaya total di atas batas Int 32-bit tetap aman.
    const rows = await this.prisma.$queryRaw<{ category: string; total: bigint }[]>`
      SELECT "category"::text AS "category", SUM("amount")::bigint AS "total"
      FROM "transactions"
      WHERE "user_id" = ${userId}::uuid AND "date" BETWEEN ${from}::date AND ${to}::date
      GROUP BY "category"`;
    return rows.map((r) => ({ category: r.category as Category, amount: Number(r.total) }));
  }
}

@Injectable()
export class PrismaBudgetRepository implements BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(userId: string, month: string): Promise<{ amount: number } | null> {
    return this.prisma.budget.findUnique({ where: { userId_month: { userId, month } }, select: { amount: true } });
  }

  upsert(userId: string, month: string, amount: number): Promise<{ amount: number }> {
    return this.prisma.budget.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, amount },
      update: { amount },
      select: { amount: true },
    });
  }
}
