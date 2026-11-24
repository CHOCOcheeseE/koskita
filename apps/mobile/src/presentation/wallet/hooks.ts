import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { container } from '@/data/container';
import type { TransactionInput } from '@/domain/wallet/wallet';

import { queryKeys } from '../shared/query-keys';

const wallet = container.wallet;

export function useCategories() {
  return useQuery({ queryKey: queryKeys.wallet.categories, queryFn: () => wallet.listCategories(), staleTime: Infinity });
}

export function useTransactions(month: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.wallet.transactions(month),
    queryFn: ({ pageParam }) => wallet.listTransactions(month, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.transaction(id ?? ''),
    queryFn: () => wallet.getTransaction(id as string),
    enabled: !!id,
  });
}

export function useMonthSummary(month: string) {
  return useQuery({ queryKey: queryKeys.wallet.summary(month), queryFn: () => wallet.getMonthSummary(month) });
}

export function useBudget(month: string) {
  return useQuery({ queryKey: queryKeys.wallet.budget(month), queryFn: () => wallet.getBudgetStatus(month) });
}

/** Setelah mutasi transaksi/anggaran: muat ulang Dompet dan Beranda. */
function useInvalidateWallet() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all }),
      qc.invalidateQueries({ queryKey: queryKeys.home }),
    ]);
}

export function useSaveTransaction(id?: string) {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (input: TransactionInput) =>
      id ? wallet.updateTransaction(id, input) : wallet.createTransaction(input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateWallet();
  return useMutation({ mutationFn: (id: string) => wallet.deleteTransaction(id), onSuccess: invalidate });
}

export function useSetBudget() {
  const invalidate = useInvalidateWallet();
  return useMutation({ mutationFn: (amount: number) => wallet.setBudget(amount), onSuccess: invalidate });
}
