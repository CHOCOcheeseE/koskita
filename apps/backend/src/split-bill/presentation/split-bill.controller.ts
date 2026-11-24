import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { components } from '../../contract/schema';
import { CurrentUser, UuidParamPipe } from '../../common/presentation/auth';
import { DEFAULT_LIMIT } from '../../common/presentation/pagination.dto';
import { SplitBillUseCases } from '../domain/split-bill.use-cases';
import { CreateBillDto, CreateGroupDto, JoinGroupDto, ListBillsQueryDto } from './split-bill.dto';
import { toBalancesResponse, toBillResponse, toGroupDetailResponse, toGroupSummaryResponse } from './split-bill.mapper';

type Schemas = components['schemas'];

@Controller()
export class SplitBillController {
  constructor(private readonly split: SplitBillUseCases) {}

  @Get('groups')
  async listMyGroups(@CurrentUser() userId: string): Promise<{ items: Schemas['GroupSummary'][] }> {
    return { items: (await this.split.listMyGroups(userId)).map(toGroupSummaryResponse) };
  }

  @Post('groups')
  @HttpCode(201)
  async createGroup(@CurrentUser() userId: string, @Body() body: CreateGroupDto): Promise<Schemas['GroupDetail']> {
    return toGroupDetailResponse(await this.split.createGroup(userId, body.name));
  }

  @Post('groups/join')
  @HttpCode(200)
  async joinGroup(@CurrentUser() userId: string, @Body() body: JoinGroupDto): Promise<Schemas['GroupDetail']> {
    return toGroupDetailResponse(await this.split.joinGroup(userId, body.inviteCode));
  }

  @Get('groups/:groupId')
  async getGroup(@CurrentUser() userId: string, @Param('groupId', UuidParamPipe) groupId: string): Promise<Schemas['GroupDetail']> {
    return toGroupDetailResponse(await this.split.getGroup(userId, groupId));
  }

  @Post('groups/:groupId/leave')
  @HttpCode(204)
  async leaveGroup(@CurrentUser() userId: string, @Param('groupId', UuidParamPipe) groupId: string): Promise<void> {
    await this.split.leaveGroup(userId, groupId);
  }

  @Get('groups/:groupId/balances')
  async getGroupBalances(
    @CurrentUser() userId: string,
    @Param('groupId', UuidParamPipe) groupId: string,
  ): Promise<Schemas['GroupBalances']> {
    return toBalancesResponse(await this.split.getBalances(userId, groupId));
  }

  @Get('groups/:groupId/bills')
  async listGroupBills(
    @CurrentUser() userId: string,
    @Param('groupId', UuidParamPipe) groupId: string,
    @Query() query: ListBillsQueryDto,
  ): Promise<Schemas['BillPage']> {
    const page = await this.split.listBills(userId, groupId, query.status, query.cursor, query.limit ?? DEFAULT_LIMIT);
    return { items: page.items.map(toBillResponse), nextCursor: page.nextCursor };
  }

  @Post('groups/:groupId/bills')
  @HttpCode(201)
  async createBill(
    @CurrentUser() userId: string,
    @Param('groupId', UuidParamPipe) groupId: string,
    @Body() body: CreateBillDto,
  ): Promise<Schemas['Bill']> {
    return toBillResponse(await this.split.createBill(userId, groupId, body));
  }

  @Get('bills/:billId')
  async getBill(@CurrentUser() userId: string, @Param('billId', UuidParamPipe) billId: string): Promise<Schemas['Bill']> {
    return toBillResponse(await this.split.getBill(userId, billId));
  }

  @Delete('bills/:billId')
  @HttpCode(204)
  async deleteBill(@CurrentUser() userId: string, @Param('billId', UuidParamPipe) billId: string): Promise<void> {
    await this.split.deleteBill(userId, billId);
  }

  @Post('bills/:billId/shares/:shareId/mark-paid')
  @HttpCode(200)
  async markSharePaid(
    @CurrentUser() userId: string,
    @Param('billId', UuidParamPipe) billId: string,
    @Param('shareId', UuidParamPipe) shareId: string,
  ): Promise<Schemas['Bill']> {
    return toBillResponse(await this.split.changeShare(userId, billId, shareId, 'mark-paid'));
  }

  @Post('bills/:billId/shares/:shareId/confirm')
  @HttpCode(200)
  async confirmShare(
    @CurrentUser() userId: string,
    @Param('billId', UuidParamPipe) billId: string,
    @Param('shareId', UuidParamPipe) shareId: string,
  ): Promise<Schemas['Bill']> {
    return toBillResponse(await this.split.changeShare(userId, billId, shareId, 'confirm'));
  }

  @Post('bills/:billId/shares/:shareId/reject')
  @HttpCode(200)
  async rejectShare(
    @CurrentUser() userId: string,
    @Param('billId', UuidParamPipe) billId: string,
    @Param('shareId', UuidParamPipe) shareId: string,
  ): Promise<Schemas['Bill']> {
    return toBillResponse(await this.split.changeShare(userId, billId, shareId, 'reject'));
  }
}
