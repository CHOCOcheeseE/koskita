import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { container } from '@/data/container';
import type { BillStatus, CreateBillInput, ShareAction } from '@/domain/split-bill/split-bill';

import { queryKeys } from '../shared/query-keys';

const split = container.splitBill;

export function useGroups() {
  return useQuery({ queryKey: queryKeys.split.groups, queryFn: () => split.listMyGroups() });
}

export function useGroup(id: string) {
  return useQuery({ queryKey: queryKeys.split.group(id), queryFn: () => split.getGroup(id) });
}

export function useGroupBalances(id: string) {
  return useQuery({ queryKey: queryKeys.split.balances(id), queryFn: () => split.getGroupBalances(id) });
}

export function useGroupBills(groupId: string, status: BillStatus | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.split.bills(groupId, status ?? 'all'),
    queryFn: ({ pageParam }) => split.listGroupBills(groupId, status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useBill(id: string) {
  return useQuery({ queryKey: queryKeys.split.bill(id), queryFn: () => split.getBill(id) });
}

/** Setelah mutasi grup/tagihan: muat ulang Patungan dan Beranda. */
function useInvalidateSplit() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.split.all }),
      qc.invalidateQueries({ queryKey: queryKeys.home }),
    ]);
}

export function useCreateGroup() {
  const invalidate = useInvalidateSplit();
  return useMutation({ mutationFn: (name: string) => split.createGroup(name), onSuccess: invalidate });
}

export function useJoinGroup() {
  const invalidate = useInvalidateSplit();
  return useMutation({ mutationFn: (code: string) => split.joinGroup(code), onSuccess: invalidate });
}

export function useLeaveGroup() {
  const invalidate = useInvalidateSplit();
  return useMutation({ mutationFn: (groupId: string) => split.leaveGroup(groupId), onSuccess: invalidate });
}

export function useCreateBill(groupId: string) {
  const invalidate = useInvalidateSplit();
  return useMutation({
    mutationFn: (input: CreateBillInput) => split.createBill(groupId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteBill() {
  const invalidate = useInvalidateSplit();
  return useMutation({ mutationFn: (billId: string) => split.deleteBill(billId), onSuccess: invalidate });
}

export function useChangeShare(billId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateSplit();
  return useMutation({
    mutationFn: ({ shareId, action }: { shareId: string; action: ShareAction }) =>
      split.changeShare(billId, shareId, action),
    onSuccess: (bill) => {
      qc.setQueryData(queryKeys.split.bill(billId), bill);
      return invalidate();
    },
  });
}
