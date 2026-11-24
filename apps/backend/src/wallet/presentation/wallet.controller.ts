import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import type { components } from '../../contract/schema';
import { CurrentUser, UuidParamPipe } from '../../common/presentation/auth';
import { DEFAULT_LIMIT } from '../../common/presentation/pagination.dto';
import { assertHasFields } from '../../common/presentation/validation';
import { WalletUseCases } from '../domain/wallet.use-cases';
import { BudgetInputDto, ListTransactionsQueryDto, MonthParamDto, TransactionInputDto, TransactionPatchDto } from './wallet.dto';
import { toBudgetStatusResponse, toMonthSummaryResponse, toTransactionResponse } from './wallet.mapper';

type Schemas = components['schemas'];

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletUseCases) {}

  @Get('categories')
  listWalletCategories(): { items: Schemas['CategoryInfo'][] } {
    return { items: this.wallet.listCategories().map((c) => ({ code: c.code, type: c.type, label: c.label })) };
  }

  @Get('transactions')
  async listTransactions(
    @CurrentUser() userId: string,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<Schemas['TransactionPage']> {
    const page = await this.wallet.listTransactions(userId, query.month, query.cursor, query.limit ?? DEFAULT_LIMIT);
    return { items: page.items.map(toTransactionResponse), nextCursor: page.nextCursor };
  }

  @Post('transactions')
  @HttpCode(201)
  async createTransaction(@CurrentUser() userId: string, @Body() body: TransactionInputDto): Promise<Schemas['Transaction']> {
    return toTransactionResponse(await this.wallet.createTransaction(userId, body));
  }

  @Get('transactions/:transactionId')
  async getTransaction(
    @CurrentUser() userId: string,
    @Param('transactionId', UuidParamPipe) id: string,
  ): Promise<Schemas['Transaction']> {
    return toTransactionResponse(await this.wallet.getTransaction(userId, id));
  }

  @Patch('transactions/:transactionId')
  async updateTransaction(
    @CurrentUser() userId: string,
    @Param('transactionId', UuidParamPipe) id: string,
    @Body() body: TransactionPatchDto,
  ): Promise<Schemas['Transaction']> {
    assertHasFields(body);
    return toTransactionResponse(await this.wallet.updateTransaction(userId, id, body));
  }

  @Delete('transactions/:transactionId')
  @HttpCode(204)
  async deleteTransaction(@CurrentUser() userId: string, @Param('transactionId', UuidParamPipe) id: string): Promise<void> {
    await this.wallet.deleteTransaction(userId, id);
  }

  @Get('months/:month/summary')
  async getMonthSummary(@CurrentUser() userId: string, @Param() params: MonthParamDto): Promise<Schemas['MonthSummary']> {
    return toMonthSummaryResponse(await this.wallet.getMonthSummary(userId, params.month));
  }

  @Get('budgets/:month')
  async getBudgetStatus(@CurrentUser() userId: string, @Param() params: MonthParamDto): Promise<Schemas['BudgetStatus']> {
    return toBudgetStatusResponse(await this.wallet.getBudgetStatus(userId, params.month));
  }

  @Put('budgets/:month')
  @HttpCode(200)
  async setBudget(
    @CurrentUser() userId: string,
    @Param() params: MonthParamDto,
    @Body() body: BudgetInputDto,
  ): Promise<Schemas['BudgetStatus']> {
    return toBudgetStatusResponse(await this.wallet.setBudget(userId, params.month, body.amount));
  }
}
