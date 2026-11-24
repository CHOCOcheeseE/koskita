import { AppError, notFound, notGroupMember, validationFailed } from '../../common/domain/app-error';
import { decodeCursor, Page, parseCursorDate, toPage } from '../../common/pagination/cursor';
import { formatRupiah } from '../../common/domain/rupiah';
import {
  Bill,
  BillRepository,
  BillStatus,
  GroupRepository,
  GroupWithMembers,
  SplitMethod,
} from './ports';
import {
  canDeleteBill,
  computeNetBalances,
  createInviteCode,
  Debt,
  MAX_GROUP_MEMBERS,
  nextShareStatus,
  normalizeInviteCode,
  ShareAction,
  ShareStatus,
  splitEqually,
  summarizeForUser,
} from './rules';

export interface BillView extends Bill {
  canDelete: boolean;
}

export interface GroupSummaryView {
  id: string;
  name: string;
  memberCount: number;
  myNetBalance: number;
  isSettledForMe: boolean;
}

export interface NamedDebt {
  from: { userId: string; name: string };
  to: { userId: string; name: string };
  amount: number;
}

export interface GroupBalancesView {
  groupId: string;
  entries: NamedDebt[];
  totalIOwe: number;
  totalOwedToMe: number;
  canLeave: boolean;
  allSettled: boolean;
}

export interface SplitTotalsView {
  hasGroups: boolean;
  totalIOwe: number;
  totalOwedToMe: number;
}

export interface CreateBillInput {
  title: string;
  totalAmount: number;
  payerId?: string;
  splitMethod: SplitMethod;
  participantIds?: string[];
  shares?: { userId: string; amount: number }[];
}

export class SplitBillUseCases {
  constructor(
    private readonly groups: GroupRepository,
    private readonly bills: BillRepository,
    private readonly random: () => number,
  ) {}

  // ------------------------------------------------------------ grup

  async createGroup(userId: string, name: string): Promise<GroupWithMembers> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const group = await this.groups.create({ name: name.trim(), inviteCode: createInviteCode(this.random), creatorId: userId });
      if (group) return this.requireGroup(group.id);
    }
    throw new AppError(500, 'INTERNAL_ERROR', 'Gagal membuat kode undangan, coba lagi');
  }

  async joinGroup(userId: string, inviteCode: string): Promise<GroupWithMembers> {
    const group = await this.groups.findByInviteCode(normalizeInviteCode(inviteCode));
    if (!group) throw new AppError(404, 'GROUP_NOT_FOUND', 'Kode grup tidak ditemukan');
    const result = await this.groups.addMember(group.id, userId, MAX_GROUP_MEMBERS);
    if (result === 'full') throw new AppError(409, 'GROUP_FULL', `Grup sudah penuh (${MAX_GROUP_MEMBERS} anggota)`);
    return this.requireGroup(group.id);
  }

  async getGroup(userId: string, groupId: string): Promise<GroupWithMembers> {
    return this.assertMember(groupId, userId);
  }

  async listMyGroups(userId: string): Promise<GroupSummaryView[]> {
    const mine = await this.groups.listForUser(userId);
    const byGroup = await this.debtsByGroup(mine.map((g) => g.id));
    return mine.map((g) => {
      const s = summarizeForUser(computeNetBalances(byGroup.get(g.id) ?? []), userId);
      return {
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        myNetBalance: s.totalOwedToMe - s.totalIOwe,
        isSettledForMe: s.isSettledForUser,
      };
    });
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    await this.assertMember(groupId, userId);
    const entries = computeNetBalances((await this.debtsByGroup([groupId])).get(groupId) ?? []);
    if (!summarizeForUser(entries, userId).isSettledForUser) {
      throw new AppError(409, 'BALANCE_NOT_SETTLED', 'Selesaikan dulu patunganmu');
    }
    await this.groups.removeMember(groupId, userId);
  }

  async getBalances(userId: string, groupId: string): Promise<GroupBalancesView> {
    await this.assertMember(groupId, userId);
    const entries = computeNetBalances((await this.debtsByGroup([groupId])).get(groupId) ?? []);
    const names = await this.groups.userNames([...new Set(entries.flatMap((e) => [e.from, e.to]))]);
    const s = summarizeForUser(entries, userId);
    return {
      groupId,
      entries: entries.map((e) => ({
        from: { userId: e.from, name: names.get(e.from) ?? '' },
        to: { userId: e.to, name: names.get(e.to) ?? '' },
        amount: e.amount,
      })),
      totalIOwe: s.totalIOwe,
      totalOwedToMe: s.totalOwedToMe,
      canLeave: s.isSettledForUser,
      allSettled: entries.length === 0,
    };
  }

  /** Total Beranda: jumlah totalIOwe/totalOwedToMe per grup, tanpa netto lintas grup. */
  async splitTotals(userId: string): Promise<SplitTotalsView> {
    const mine = await this.groups.listForUser(userId);
    const byGroup = await this.debtsByGroup(mine.map((g) => g.id));
    let totalIOwe = 0;
    let totalOwedToMe = 0;
    for (const g of mine) {
      const s = summarizeForUser(computeNetBalances(byGroup.get(g.id) ?? []), userId);
      totalIOwe += s.totalIOwe;
      totalOwedToMe += s.totalOwedToMe;
    }
    return { hasGroups: mine.length > 0, totalIOwe, totalOwedToMe };
  }

  // ------------------------------------------------------------ tagihan

  async listBills(
    userId: string,
    groupId: string,
    status: BillStatus | undefined,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<BillView>> {
    const group = await this.assertMember(groupId, userId);
    const decoded = decodeCursor(cursor);
    const after = decoded ? { createdAt: parseCursorDate(decoded.v), id: decoded.i } : null;
    const rows = await this.bills.listByGroup(groupId, status, after, limit + 1);
    const page = toPage(rows, limit, (b) => ({ v: b.createdAt.toISOString(), i: b.id }));
    return { items: page.items.map((b) => this.view(b, group, userId)), nextCursor: page.nextCursor };
  }

  async createBill(userId: string, groupId: string, input: CreateBillInput): Promise<BillView> {
    const group = await this.assertMember(groupId, userId);
    const memberOrder = new Map(group.members.map((m, i) => [m.userId, i]));
    const payerId = input.payerId ?? userId;
    const notMember = () => new AppError(422, 'PARTICIPANT_NOT_MEMBER', 'Pembayar dan semua peserta harus anggota grup');

    let shares: { userId: string; amount: number }[];
    if (input.splitMethod === 'equal') {
      if (input.shares !== undefined) {
        throw new AppError(422, 'SHARES_NOT_ALLOWED', 'Bagian manual tidak dipakai pada bagi rata');
      }
      const participants = input.participantIds ?? group.members.map((m) => m.userId);
      if (participants.length < 2) throw new AppError(422, 'MIN_PARTICIPANTS', 'Peserta minimal 2 orang');
      if (participants.some((id) => !memberOrder.has(id))) throw notMember();
      const ordered = [...new Set(participants)].sort((a, b) => memberOrder.get(a)! - memberOrder.get(b)!);
      shares = splitEqually(input.totalAmount, ordered);
    } else {
      if (input.shares === undefined || input.shares.length === 0) {
        throw new AppError(422, 'SHARES_REQUIRED', 'Isi bagian tiap peserta untuk bagi manual');
      }
      if (new Set(input.shares.map((s) => s.userId)).size !== input.shares.length) {
        throw validationFailed({ shares: 'Satu peserta hanya boleh punya satu bagian' });
      }
      if (input.shares.length < 2) throw new AppError(422, 'MIN_PARTICIPANTS', 'Peserta minimal 2 orang');
      if (input.shares.some((s) => !memberOrder.has(s.userId))) throw notMember();
      const sum = input.shares.reduce((a, s) => a + s.amount, 0);
      if (sum !== input.totalAmount) {
        const diff = input.totalAmount - sum;
        const detail = diff > 0 ? `kurang ${formatRupiah(diff)}` : `lebih ${formatRupiah(-diff)}`;
        throw new AppError(
          422,
          'SHARES_SUM_MISMATCH',
          `Jumlah bagian ${formatRupiah(sum)} tidak sama dengan total ${formatRupiah(input.totalAmount)} (${detail})`,
        );
      }
      shares = [...input.shares].sort((a, b) => memberOrder.get(a.userId)! - memberOrder.get(b.userId)!);
    }
    if (!memberOrder.has(payerId)) throw notMember();

    const withStatus = shares.map((s) => ({
      ...s,
      status: (s.userId === payerId ? 'lunas' : 'belum_bayar') as ShareStatus,
    }));
    const bill = await this.bills.create({
      groupId,
      title: input.title.trim(),
      totalAmount: input.totalAmount,
      splitMethod: input.splitMethod,
      payerId,
      createdById: userId,
      status: withStatus.every((s) => s.status === 'lunas') ? 'settled' : 'open',
      shares: withStatus,
    });
    return this.view(bill, group, userId);
  }

  async getBill(userId: string, billId: string): Promise<BillView> {
    const { bill, group } = await this.loadBill(userId, billId);
    return this.view(bill, group, userId);
  }

  async deleteBill(userId: string, billId: string): Promise<void> {
    const { bill } = await this.loadBill(userId, billId);
    if (bill.createdById !== userId) {
      throw new AppError(403, 'NOT_BILL_CREATOR', 'Hanya pembuat tagihan yang bisa menghapus');
    }
    if (!canDeleteBill({ createdBy: bill.createdById, payerId: bill.payerId, shares: bill.shares }, userId)) {
      throw new AppError(409, 'BILL_HAS_PAYMENTS', 'Tagihan tidak bisa dihapus karena sudah ada yang lunas');
    }
    await this.bills.delete(bill.id);
  }

  async changeShare(userId: string, billId: string, shareId: string, action: ShareAction): Promise<BillView> {
    const { bill } = await this.loadBill(userId, billId);
    const share = bill.shares.find((s) => s.id === shareId);
    if (!share) throw notFound('Bagian tagihan tidak ditemukan');

    let actor: 'owner' | 'payer';
    if (action === 'mark-paid') {
      if (share.userId !== userId) throw new AppError(403, 'NOT_SHARE_OWNER', 'Hanya pemilik bagian yang bisa menandai sudah bayar');
      actor = 'owner';
    } else {
      if (bill.payerId !== userId) throw new AppError(403, 'NOT_BILL_PAYER', 'Hanya pembayar tagihan yang bisa melakukan ini');
      actor = 'payer';
    }
    const next = nextShareStatus(share.status, action, actor);
    const changed = await this.bills.transitionShare(bill.id, share.id, share.status, next);
    if (!changed) {
      throw new AppError(409, 'INVALID_SHARE_TRANSITION', 'Status bagian ini sudah berubah, muat ulang dulu');
    }
    return this.getBill(userId, billId);
  }

  // ------------------------------------------------------------ helper

  private async requireGroup(groupId: string): Promise<GroupWithMembers> {
    const group = await this.groups.findById(groupId);
    if (!group) throw notFound('Grup tidak ditemukan');
    return group;
  }

  /** Grup tidak ada = 404; ada tapi bukan anggota = 403 NOT_GROUP_MEMBER. */
  private async assertMember(groupId: string, userId: string): Promise<GroupWithMembers> {
    const group = await this.requireGroup(groupId);
    if (!group.members.some((m) => m.userId === userId)) throw notGroupMember();
    return group;
  }

  private async loadBill(userId: string, billId: string): Promise<{ bill: Bill; group: GroupWithMembers }> {
    const bill = await this.bills.findById(billId);
    if (!bill) throw notFound('Tagihan tidak ditemukan');
    const group = await this.assertMember(bill.groupId, userId);
    return { bill, group };
  }

  private async debtsByGroup(groupIds: string[]): Promise<Map<string, Debt[]>> {
    const map = new Map<string, Debt[]>();
    if (groupIds.length === 0) return map;
    for (const d of await this.bills.openDebts(groupIds)) {
      const list = map.get(d.groupId) ?? [];
      list.push({ from: d.from, to: d.to, amount: d.amount });
      map.set(d.groupId, list);
    }
    return map;
  }

  /** Bagian diurutkan sesuai joinedAt peserta; yang sudah keluar grup di akhir. */
  private view(bill: Bill, group: GroupWithMembers, userId: string): BillView {
    const order = new Map(group.members.map((m, i) => [m.userId, i]));
    const rank = (id: string) => order.get(id) ?? Number.MAX_SAFE_INTEGER;
    const shares = [...bill.shares].sort((a, b) => rank(a.userId) - rank(b.userId) || a.userId.localeCompare(b.userId));
    return {
      ...bill,
      shares,
      canDelete: canDeleteBill({ createdBy: bill.createdById, payerId: bill.payerId, shares: bill.shares }, userId),
    };
  }
}
