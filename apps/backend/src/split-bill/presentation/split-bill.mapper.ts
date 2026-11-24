import type { components } from '../../contract/schema';
import type { GroupWithMembers } from '../domain/ports';
import type { BillView, GroupBalancesView, GroupSummaryView } from '../domain/split-bill.use-cases';

type Schemas = components['schemas'];

export function toGroupDetailResponse(g: GroupWithMembers): Schemas['GroupDetail'] {
  return {
    id: g.id,
    name: g.name,
    inviteCode: g.inviteCode,
    members: g.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      campus: m.campus,
      joinedAt: m.joinedAt.toISOString(),
    })),
    createdAt: g.createdAt.toISOString(),
  };
}

export function toGroupSummaryResponse(g: GroupSummaryView): Schemas['GroupSummary'] {
  return {
    id: g.id,
    name: g.name,
    memberCount: g.memberCount,
    myNetBalance: g.myNetBalance,
    isSettledForMe: g.isSettledForMe,
  };
}

export function toBalancesResponse(b: GroupBalancesView): Schemas['GroupBalances'] {
  return {
    groupId: b.groupId,
    entries: b.entries.map((e) => ({
      from: { userId: e.from.userId, name: e.from.name },
      to: { userId: e.to.userId, name: e.to.name },
      amount: e.amount,
    })),
    totalIOwe: b.totalIOwe,
    totalOwedToMe: b.totalOwedToMe,
    canLeave: b.canLeave,
    allSettled: b.allSettled,
  };
}

export function toBillResponse(b: BillView): Schemas['Bill'] {
  return {
    id: b.id,
    groupId: b.groupId,
    title: b.title,
    totalAmount: b.totalAmount,
    splitMethod: b.splitMethod,
    payer: { userId: b.payerId, name: b.payerName },
    createdBy: { userId: b.createdById, name: b.createdByName },
    status: b.status,
    shares: b.shares.map((s) => ({
      id: s.id,
      user: { userId: s.userId, name: s.userName },
      amount: s.amount,
      status: s.status,
      updatedAt: s.updatedAt.toISOString(),
    })),
    canDelete: b.canDelete,
    createdAt: b.createdAt.toISOString(),
  };
}
