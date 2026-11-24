import type { Page } from '../shared/page';

export type MemberRef = { userId: string; name: string };
export type GroupMember = { userId: string; name: string; campus: string | null; joinedAt: string };

export type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  myNetBalance: number;
  isSettledForMe: boolean;
};

export type GroupDetail = {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: string;
};

export type BalanceEntry = { from: MemberRef; to: MemberRef; amount: number };

export type GroupBalances = {
  groupId: string;
  entries: BalanceEntry[];
  totalIOwe: number;
  totalOwedToMe: number;
  canLeave: boolean;
  allSettled: boolean;
};

export type SplitMethod = 'equal' | 'manual';
export type ShareStatus = 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas';
export type BillStatus = 'open' | 'settled';

export type BillShare = {
  id: string;
  user: MemberRef;
  amount: number;
  status: ShareStatus;
  updatedAt: string;
};

export type Bill = {
  id: string;
  groupId: string;
  title: string;
  totalAmount: number;
  splitMethod: SplitMethod;
  payer: MemberRef;
  createdBy: MemberRef;
  status: BillStatus;
  shares: BillShare[];
  canDelete: boolean;
  createdAt: string;
};

export type CreateBillInput = {
  title: string;
  totalAmount: number;
  payerId?: string;
  splitMethod: SplitMethod;
  participantIds?: string[];
  shares?: { userId: string; amount: number }[];
};

export type ShareAction = 'mark-paid' | 'confirm' | 'reject';

export interface SplitBillRepository {
  listMyGroups(): Promise<GroupSummary[]>;
  createGroup(name: string): Promise<GroupDetail>;
  joinGroup(inviteCode: string): Promise<GroupDetail>;
  getGroup(groupId: string): Promise<GroupDetail>;
  leaveGroup(groupId: string): Promise<void>;
  getGroupBalances(groupId: string): Promise<GroupBalances>;
  listGroupBills(groupId: string, status: BillStatus | null, cursor?: string | null): Promise<Page<Bill>>;
  createBill(groupId: string, input: CreateBillInput): Promise<Bill>;
  getBill(billId: string): Promise<Bill>;
  deleteBill(billId: string): Promise<void>;
  changeShare(billId: string, shareId: string, action: ShareAction): Promise<Bill>;
}

export function createSplitBillUseCases(repo: SplitBillRepository) {
  return {
    listMyGroups: () => repo.listMyGroups(),
    createGroup: (name: string) => repo.createGroup(name.trim()),
    joinGroup: (code: string) => repo.joinGroup(normalizeInviteCode(code)),
    getGroup: (groupId: string) => repo.getGroup(groupId),
    leaveGroup: (groupId: string) => repo.leaveGroup(groupId),
    getGroupBalances: (groupId: string) => repo.getGroupBalances(groupId),
    listGroupBills: (groupId: string, status: BillStatus | null, cursor?: string | null) =>
      repo.listGroupBills(groupId, status, cursor),
    createBill: (groupId: string, input: CreateBillInput) => {
      const base = { title: input.title.trim(), totalAmount: input.totalAmount, payerId: input.payerId };
      if (input.splitMethod === 'equal') {
        return repo.createBill(groupId, { ...base, splitMethod: 'equal', participantIds: input.participantIds });
      }
      return repo.createBill(groupId, { ...base, splitMethod: 'manual', shares: input.shares });
    },
    getBill: (billId: string) => repo.getBill(billId),
    deleteBill: (billId: string) => repo.deleteBill(billId),
    changeShare: (billId: string, shareId: string, action: ShareAction) => repo.changeShare(billId, shareId, action),
  };
}

export type SplitBillUseCases = ReturnType<typeof createSplitBillUseCases>;

export function normalizeInviteCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

/** Kode memakai huruf/angka yang tidak ada di alfabet undangan (O, 0, I, 1). */
export function hasAmbiguousInviteChars(code: string): boolean {
  return /[OI01]/.test(normalizeInviteCode(code));
}

/** Keadaan saldo satu grup di daftar Patungan (P1). */
export type GroupBalanceState =
  | { kind: 'settled' }
  | { kind: 'i-owe'; amount: number }
  | { kind: 'owed-to-me'; amount: number }
  | { kind: 'crossed' };

export function groupBalanceState(group: Pick<GroupSummary, 'myNetBalance' | 'isSettledForMe'>): GroupBalanceState {
  if (group.isSettledForMe) return { kind: 'settled' };
  if (group.myNetBalance < 0) return { kind: 'i-owe', amount: -group.myNetBalance };
  if (group.myNetBalance > 0) return { kind: 'owed-to-me', amount: group.myNetBalance };
  return { kind: 'crossed' };
}

export type BalanceSentence = { text: string; amount: number; involvesMe: boolean };

/** Kalimat saldo dari BalanceEntry; entri yang melibatkan saya diurutkan di atas. */
export function balanceSentences(entries: BalanceEntry[], myId: string): BalanceSentence[] {
  const sentences = entries.map((e) => {
    if (e.from.userId === myId) return { text: `Kamu utang ke ${e.to.name}`, amount: e.amount, involvesMe: true };
    if (e.to.userId === myId) return { text: `${e.from.name} utang ke kamu`, amount: e.amount, involvesMe: true };
    return { text: `${e.from.name} utang ke ${e.to.name}`, amount: e.amount, involvesMe: false };
  });
  return [...sentences.filter((s) => s.involvesMe), ...sentences.filter((s) => !s.involvesMe)];
}

/** Nama-nama yang masih punya utang-piutang dengan saya (untuk sheet "Selesaikan dulu patunganmu"). */
export function counterpartiesOf(entries: BalanceEntry[], myId: string): string[] {
  const names = new Set<string>();
  for (const e of entries) {
    if (e.from.userId === myId) names.add(e.to.name);
    if (e.to.userId === myId) names.add(e.from.name);
  }
  return [...names];
}

export function myShareOf(bill: Bill, myId: string): BillShare | undefined {
  return bill.shares.find((s) => s.user.userId === myId);
}

export function paidCount(bill: Bill): number {
  return bill.shares.filter((s) => s.status === 'lunas').length;
}

/**
 * Aksi yang ditampilkan untuk satu baris bagian (desain P6). Backend tetap yang memutuskan.
 * - Pemilik bagian (bukan pembayar), belum_bayar: mark-paid.
 * - Pembayar, menunggu_konfirmasi: confirm dan reject.
 * - Pembayar, belum_bayar: confirm (tunai).
 */
export function shareActionsFor(bill: Bill, share: BillShare, myId: string): ShareAction[] {
  const iAmPayer = bill.payer.userId === myId;
  const iOwnShare = share.user.userId === myId;
  if (iOwnShare && !iAmPayer && share.status === 'belum_bayar') return ['mark-paid'];
  if (iAmPayer && !iOwnShare) {
    if (share.status === 'menunggu_konfirmasi') return ['confirm', 'reject'];
    if (share.status === 'belum_bayar') return ['confirm'];
  }
  return [];
}

/** Selisih pembagian manual: positif = masih kurang, negatif = kelebihan. */
export function manualSplitGap(total: number, amounts: number[]): number {
  return total - amounts.reduce((sum, a) => sum + a, 0);
}
