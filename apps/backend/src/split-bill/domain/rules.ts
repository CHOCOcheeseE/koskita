import { AppError } from '../../common/domain/app-error';

export type ShareStatus = 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas';
export type ShareAction = 'mark-paid' | 'confirm' | 'reject';

/**
 * Bagi rata: floor(total / n); sisa (total mod n) ditambah Rp1 ke peserta paling awal bergabung.
 * `participantIdsByJoinOrder` sudah urut joinedAt menaik.
 */
export function splitEqually(total: number, participantIdsByJoinOrder: string[]): { userId: string; amount: number }[] {
  const n = participantIdsByJoinOrder.length;
  if (n === 0) return [];
  const base = Math.floor(total / n);
  const remainder = total % n;
  return participantIdsByJoinOrder.map((userId, index) => ({ userId, amount: base + (index < remainder ? 1 : 0) }));
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

/** Netto hanya per pasangan (A ke B dikurangi B ke A). Entri 0 dibuang. */
export function computeNetBalances(debts: Debt[]): Debt[] {
  const pair = new Map<string, number>();
  for (const d of debts) {
    if (d.from === d.to || d.amount <= 0) continue;
    const [a, b] = d.from < d.to ? [d.from, d.to] : [d.to, d.from];
    const key = `${a}|${b}`;
    // positif = a utang ke b
    pair.set(key, (pair.get(key) ?? 0) + (d.from === a ? d.amount : -d.amount));
  }
  const entries: Debt[] = [];
  for (const [key, net] of pair) {
    if (net === 0) continue;
    const [a, b] = key.split('|');
    entries.push(net > 0 ? { from: a, to: b, amount: net } : { from: b, to: a, amount: -net });
  }
  return entries.sort((x, y) => y.amount - x.amount || x.from.localeCompare(y.from) || x.to.localeCompare(y.to));
}

export function summarizeForUser(
  entries: Debt[],
  userId: string,
): { totalIOwe: number; totalOwedToMe: number; isSettledForUser: boolean } {
  let totalIOwe = 0;
  let totalOwedToMe = 0;
  let involved = false;
  for (const e of entries) {
    if (e.from === userId) {
      totalIOwe += e.amount;
      involved = true;
    }
    if (e.to === userId) {
      totalOwedToMe += e.amount;
      involved = true;
    }
  }
  return { totalIOwe, totalOwedToMe, isSettledForUser: !involved };
}

/** Pembuat boleh hapus selama belum ada bagian peserta selain pembayar yang `lunas`. */
export function canDeleteBill(
  bill: { createdBy: string; payerId: string; shares: { userId: string; status: ShareStatus }[] },
  actorId: string,
): boolean {
  return actorId === bill.createdBy && !hasNonPayerPayments(bill);
}

export function hasNonPayerPayments(bill: { payerId: string; shares: { userId: string; status: ShareStatus }[] }): boolean {
  return bill.shares.some((s) => s.userId !== bill.payerId && s.status === 'lunas');
}

/** Transisi status bagian. Lempar INVALID_SHARE_TRANSITION jika tidak diizinkan. */
export function nextShareStatus(current: ShareStatus, action: ShareAction, actor: 'owner' | 'payer'): ShareStatus {
  if (action === 'mark-paid' && actor === 'owner' && current === 'belum_bayar') return 'menunggu_konfirmasi';
  if (action === 'confirm' && actor === 'payer' && (current === 'belum_bayar' || current === 'menunggu_konfirmasi')) return 'lunas';
  if (action === 'reject' && actor === 'payer' && current === 'menunggu_konfirmasi') return 'belum_bayar';
  throw new AppError(409, 'INVALID_SHARE_TRANSITION', 'Status bagian ini tidak bisa diubah dengan aksi tersebut');
}

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Kode undangan 6 karakter tanpa O, 0, I, 1. `random` mengembalikan angka [0, 1). */
export function createInviteCode(random: () => number): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_ALPHABET[Math.floor(random() * INVITE_ALPHABET.length) % INVITE_ALPHABET.length];
  }
  return code;
}

export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase();
}

export const MAX_GROUP_MEMBERS = 20;
