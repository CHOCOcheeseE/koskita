import type { Page } from '@/domain/shared/page';
import type {
  Bill,
  BillStatus,
  CreateBillInput,
  GroupBalances,
  GroupDetail,
  GroupSummary,
  ShareAction,
  SplitBillRepository,
} from '@/domain/split-bill/split-bill';

import type { ApiClient, Schemas } from '../api/client';

const toGroupSummary = (dto: Schemas['GroupSummary']): GroupSummary => dto;
const toGroupDetail = (dto: Schemas['GroupDetail']): GroupDetail => dto;
const toBalances = (dto: Schemas['GroupBalances']): GroupBalances => dto;
const toBill = (dto: Schemas['Bill']): Bill => dto;

const enc = encodeURIComponent;

const SHARE_ACTION_PATH: Record<ShareAction, string> = {
  'mark-paid': 'mark-paid',
  confirm: 'confirm',
  reject: 'reject',
};

export class HttpSplitBillRepository implements SplitBillRepository {
  constructor(private readonly api: ApiClient) {}

  async listMyGroups(): Promise<GroupSummary[]> {
    const res = await this.api.request<{ items: Schemas['GroupSummary'][] }>('GET', '/v1/groups');
    return res.items.map(toGroupSummary);
  }

  async createGroup(name: string): Promise<GroupDetail> {
    const body: Schemas['CreateGroupRequest'] = { name };
    return toGroupDetail(await this.api.request<Schemas['GroupDetail']>('POST', '/v1/groups', { body }));
  }

  async joinGroup(inviteCode: string): Promise<GroupDetail> {
    const body: Schemas['JoinGroupRequest'] = { inviteCode };
    return toGroupDetail(await this.api.request<Schemas['GroupDetail']>('POST', '/v1/groups/join', { body }));
  }

  async getGroup(groupId: string): Promise<GroupDetail> {
    return toGroupDetail(await this.api.request<Schemas['GroupDetail']>('GET', `/v1/groups/${enc(groupId)}`));
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.api.request<void>('POST', `/v1/groups/${enc(groupId)}/leave`);
  }

  async getGroupBalances(groupId: string): Promise<GroupBalances> {
    return toBalances(await this.api.request<Schemas['GroupBalances']>('GET', `/v1/groups/${enc(groupId)}/balances`));
  }

  async listGroupBills(groupId: string, status: BillStatus | null, cursor?: string | null): Promise<Page<Bill>> {
    const res = await this.api.request<Schemas['BillPage']>('GET', `/v1/groups/${enc(groupId)}/bills`, {
      query: { status, cursor, limit: 20 },
    });
    return { items: res.items.map(toBill), nextCursor: res.nextCursor };
  }

  async createBill(groupId: string, input: CreateBillInput): Promise<Bill> {
    const body: Schemas['CreateBillRequest'] = input;
    return toBill(await this.api.request<Schemas['Bill']>('POST', `/v1/groups/${enc(groupId)}/bills`, { body }));
  }

  async getBill(billId: string): Promise<Bill> {
    return toBill(await this.api.request<Schemas['Bill']>('GET', `/v1/bills/${enc(billId)}`));
  }

  async deleteBill(billId: string): Promise<void> {
    await this.api.request<void>('DELETE', `/v1/bills/${enc(billId)}`);
  }

  async changeShare(billId: string, shareId: string, action: ShareAction): Promise<Bill> {
    return toBill(
      await this.api.request<Schemas['Bill']>(
        'POST',
        `/v1/bills/${enc(billId)}/shares/${enc(shareId)}/${SHARE_ACTION_PATH[action]}`,
      ),
    );
  }
}
