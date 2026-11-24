import { hasCode } from '@/domain/shared/errors';
import type { Page } from '@/domain/shared/page';
import type {
  BudgetStatus,
  CategoryInfo,
  MonthSummary,
  Transaction,
  TransactionInput,
  WalletRepository,
} from '@/domain/wallet/wallet';

import type { ApiClient, Schemas } from '../api/client';

const toTransaction = (dto: Schemas['Transaction']): Transaction => dto;
const toBudget = (dto: Schemas['BudgetStatus']): BudgetStatus => dto;
const toSummary = (dto: Schemas['MonthSummary']): MonthSummary => dto;
const toCategory = (dto: Schemas['CategoryInfo']): CategoryInfo => dto;

export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly api: ApiClient) {}

  async listCategories(): Promise<CategoryInfo[]> {
    const res = await this.api.request<{ items: Schemas['CategoryInfo'][] }>('GET', '/v1/wallet/categories');
    return res.items.map(toCategory);
  }

  async listTransactions(month: string, cursor?: string | null): Promise<Page<Transaction>> {
    const res = await this.api.request<Schemas['TransactionPage']>('GET', '/v1/wallet/transactions', {
      query: { month, cursor, limit: 20 },
    });
    return { items: res.items.map(toTransaction), nextCursor: res.nextCursor };
  }

  async getTransaction(id: string): Promise<Transaction> {
    return toTransaction(
      await this.api.request<Schemas['Transaction']>('GET', `/v1/wallet/transactions/${encodeURIComponent(id)}`),
    );
  }

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const body: Schemas['TransactionInput'] = input;
    return toTransaction(await this.api.request<Schemas['Transaction']>('POST', '/v1/wallet/transactions', { body }));
  }

  async updateTransaction(id: string, patch: Partial<TransactionInput>): Promise<Transaction> {
    const body: Schemas['TransactionPatch'] = patch;
    return toTransaction(
      await this.api.request<Schemas['Transaction']>('PATCH', `/v1/wallet/transactions/${encodeURIComponent(id)}`, {
        body,
      }),
    );
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.api.request<void>('DELETE', `/v1/wallet/transactions/${encodeURIComponent(id)}`);
  }

  async getMonthSummary(month: string): Promise<MonthSummary> {
    return toSummary(
      await this.api.request<Schemas['MonthSummary']>('GET', `/v1/wallet/months/${encodeURIComponent(month)}/summary`),
    );
  }

  async getBudgetStatus(month: string): Promise<BudgetStatus | null> {
    try {
      return toBudget(
        await this.api.request<Schemas['BudgetStatus']>('GET', `/v1/wallet/budgets/${encodeURIComponent(month)}`),
      );
    } catch (error) {
      if (hasCode(error, 'BUDGET_NOT_FOUND')) return null;
      throw error;
    }
  }

  async setBudget(month: string, amount: number): Promise<BudgetStatus> {
    const body: Schemas['BudgetInput'] = { amount };
    return toBudget(
      await this.api.request<Schemas['BudgetStatus']>('PUT', `/v1/wallet/budgets/${encodeURIComponent(month)}`, {
        body,
      }),
    );
  }
}
