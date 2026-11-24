import type { Debt, ShareStatus } from './rules';

export type SplitMethod = 'equal' | 'manual';
export type BillStatus = 'open' | 'settled';

export interface GroupMember {
  userId: string;
  name: string;
  campus: string | null;
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export interface GroupWithMembers extends Group {
  /** Urut joinedAt menaik. */
  members: GroupMember[];
}

export interface MyGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface BillShare {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: ShareStatus;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  groupId: string;
  title: string;
  totalAmount: number;
  splitMethod: SplitMethod;
  payerId: string;
  payerName: string;
  createdById: string;
  createdByName: string;
  status: BillStatus;
  shares: BillShare[];
  createdAt: Date;
}

export interface GroupDebt extends Debt {
  groupId: string;
}

export interface GroupRepository {
  /** `null` jika kode undangan bentrok (unique constraint); use case mencoba lagi. */
  create(input: { name: string; inviteCode: string; creatorId: string }): Promise<Group | null>;
  findById(id: string): Promise<GroupWithMembers | null>;
  findByInviteCode(code: string): Promise<GroupWithMembers | null>;
  /** Grup yang diikuti `userId`, urut joinedAt menurun. */
  listForUser(userId: string): Promise<MyGroup[]>;
  /**
   * Tambah anggota secara atomik. `full` jika sudah `maxMembers` anggota,
   * `already` jika sudah anggota.
   */
  addMember(groupId: string, userId: string, maxMembers: number): Promise<'added' | 'already' | 'full'>;
  removeMember(groupId: string, userId: string): Promise<void>;
  /** Nama pengguna untuk MemberRef (termasuk yang sudah keluar grup). */
  userNames(userIds: string[]): Promise<Map<string, string>>;
}

export interface BillCursor {
  createdAt: Date;
  id: string;
}

export interface BillRepository {
  create(input: {
    groupId: string;
    title: string;
    totalAmount: number;
    splitMethod: SplitMethod;
    payerId: string;
    createdById: string;
    status: BillStatus;
    shares: { userId: string; amount: number; status: ShareStatus }[];
  }): Promise<Bill>;
  findById(id: string): Promise<Bill | null>;
  /** Urut createdAt desc, id desc. */
  listByGroup(groupId: string, status: BillStatus | undefined, after: BillCursor | null, take: number): Promise<Bill[]>;
  delete(id: string): Promise<void>;
  /**
   * Ubah status satu bagian jika statusnya masih `from`, lalu set status tagihan
   * (`settled` jika semua bagian lunas) dalam satu transaksi. `false` jika status sudah berubah.
   */
  transitionShare(billId: string, shareId: string, from: ShareStatus, to: ShareStatus): Promise<boolean>;
  /** Utang terbuka: bagian `belum_bayar`/`menunggu_konfirmasi` milik selain pembayar = peserta utang ke pembayar. */
  openDebts(groupIds: string[]): Promise<GroupDebt[]>;
}

export const GROUP_REPOSITORY = Symbol('GROUP_REPOSITORY');
export const BILL_REPOSITORY = Symbol('BILL_REPOSITORY');
export const RANDOM = Symbol('RANDOM');
