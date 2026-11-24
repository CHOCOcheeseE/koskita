import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { container } from '@/data/container';
import { addDays } from '@/domain/shared/wib';
import { budgetUsageRatio, groupByDate, type BudgetStatus, type Category } from '@/domain/wallet/wallet';
import { formatDayShortDate, formatMonthName, formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Amount, HighlightAmount } from '@/shared/ui/amount';
import { Button, Fab } from '@/shared/ui/button';
import { EmptyState, ErrorPanel, ProgressBar, Skeleton, ScreenSkeleton } from '@/shared/ui/feedback';
import { Screen, SectionDivider } from '@/shared/ui/layout';
import { ListRow } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { useBudget, useCategories, useMonthSummary, useTransactions } from './hooks';
import { MonthSwitcher } from './month-switcher';

/** D1 · Dompet */
export function WalletScreen() {
  const currentMonth = container.wallet.currentMonth();
  const today = container.wallet.today();
  const [month, setMonth] = useState(currentMonth);
  const isCurrent = month === currentMonth;

  const budget = useBudget(month);
  const summary = useMonthSummary(month);
  const transactions = useTransactions(month);
  const categories = useCategories();

  const labelOf = useMemo(() => {
    const map = new Map<Category, string>((categories.data ?? []).map((c) => [c.code, c.label]));
    return (code: Category) => map.get(code) ?? code;
  }, [categories.data]);

  const items = transactions.data?.pages.flatMap((p) => p.items) ?? [];
  const groups = groupByDate(items);
  const refreshing = budget.isRefetching || summary.isRefetching || transactions.isRefetching;
  const refresh = () => {
    budget.refetch();
    summary.refetch();
    transactions.refetch();
  };
  const loadMore = () => {
    if (transactions.hasNextPage && !transactions.isFetchingNextPage) transactions.fetchNextPage();
  };
  const dateLabel = (date: string) =>
    date === today ? 'Hari ini' : date === addDays(today, -1) ? 'Kemarin' : formatDayShortDate(date);

  return (
    <Screen
      testID="screen-dompet"
      floating={<Fab label="+ Transaksi" onPress={() => router.push('/transaksi/baru')} />}
      refreshing={refreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
    >
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        Dompet
      </Txt>
      <MonthSwitcher month={month} currentMonth={currentMonth} onChange={setMonth} />

      {budget.isPending ? (
        <ScreenSkeleton label="Dompet" rows={2} />
      ) : budget.isError ? (
        <ErrorPanel message={errorMessage(budget.error)} onRetry={() => budget.refetch()} />
      ) : budget.data === null ? (
        isCurrent ? (
          <EmptyState
            message="Atur anggaran bulan ini supaya jatah harian bisa dihitung."
            actionLabel="Atur anggaran"
            onAction={() => router.push('/anggaran')}
          />
        ) : (
          <EmptyState message="Tidak ada anggaran di bulan ini." />
        )
      ) : (
        <BudgetBlock budget={budget.data} editable={isCurrent} />
      )}

      {summary.isPending ? (
        <Skeleton height={48} />
      ) : summary.isError ? (
        <ErrorPanel bar message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />
      ) : (
        <View style={styles.totals}>
          <View style={styles.pair}>
            <Txt variant="body">Masuk</Txt>
            <Amount value={summary.data.totalIncome} sign="+" />
          </View>
          <View style={styles.pair}>
            <Txt variant="body">Keluar</Txt>
            <Amount value={summary.data.totalExpense} sign="-" />
          </View>
          <Button
            label="Lihat per kategori"
            variant="text"
            style={styles.alignEnd}
            onPress={() => router.push({ pathname: '/ringkasan/[month]', params: { month } })}
          />
        </View>
      )}

      <SectionDivider />
      {transactions.isPending ? (
        Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={22} />)
      ) : transactions.isError ? (
        <ErrorPanel message={errorMessage(transactions.error)} onRetry={() => transactions.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          message={`Belum ada catatan di ${formatMonthName(month)}. Catat pengeluaran pertamamu.`}
          actionLabel="+ Transaksi"
          onAction={() => router.push('/transaksi/baru')}
        />
      ) : (
        groups.map((g) => (
          <View key={g.date} style={styles.group}>
            <Txt variant="caption" color="inkMuted" accessibilityRole="header">
              {dateLabel(g.date)}
            </Txt>
            {g.items.map((t) => {
              const sign = t.type === 'income' ? '+' : '-';
              const label = labelOf(t.category);
              return (
                <ListRow
                  key={t.id}
                  title={t.note ? `${label} · ${t.note}` : label}
                  right={<Amount value={t.amount} sign={sign} />}
                  onPress={() => router.push({ pathname: '/transaksi/[id]', params: { id: t.id } })}
                  accessibilityLabel={`${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${label}${t.note ? `, ${t.note}` : ''}, ${formatRupiah(t.amount)}. Ketuk untuk ubah`}
                />
              );
            })}
          </View>
        ))
      )}
      {transactions.isFetchingNextPage ? (
        <Txt variant="label" color="inkMuted" style={styles.loadingMore}>
          Memuat…
        </Txt>
      ) : null}
    </Screen>
  );
}

function BudgetBlock({ budget, editable }: { budget: BudgetStatus; editable: boolean }) {
  const over = budget.overBudgetAmount > 0;
  const percent = Math.round(budgetUsageRatio(budget) * 100);
  return (
    <View style={styles.budget}>
      {budget.today ? (
        <View>
          <Txt variant="label" color="inkMuted">
            Jatah hari ini
          </Txt>
          <View style={styles.inline}>
            <HighlightAmount value={budget.today.remainingToday} label="Sisa jatah hari ini" />
            <Txt variant="body" color="inkMuted">
              sisa
            </Txt>
          </View>
        </View>
      ) : null}
      <View style={styles.inline}>
        <Txt variant="body" style={styles.flex}>
          Anggaran {formatRupiah(budget.amount)}
        </Txt>
        {editable ? <Button label="Ubah" variant="text" onPress={() => router.push('/anggaran')} /> : null}
      </View>
      <ProgressBar
        ratio={budgetUsageRatio(budget)}
        over={over}
        accessibilityLabel={over ? `Anggaran terlampaui ${formatRupiah(budget.overBudgetAmount)}` : `${percent} persen anggaran terpakai`}
      />
      {over ? (
        <Txt variant="bodyStrong" color="statusUnpaid">
          Anggaran terlampaui {formatRupiah(budget.overBudgetAmount)}
        </Txt>
      ) : (
        <Txt variant="label" color="inkMuted" style={styles.alignEnd}>
          {percent}% terpakai
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: spacing.md },
  budget: { gap: spacing.sm, marginTop: spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  totals: { marginTop: spacing.lg },
  pair: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  alignEnd: { alignSelf: 'flex-end' },
  group: { marginBottom: spacing.md },
  loadingMore: { textAlign: 'center', marginTop: spacing.md },
});
