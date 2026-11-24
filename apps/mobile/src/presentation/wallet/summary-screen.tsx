import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { container } from '@/data/container';
import { isValidMonth } from '@/domain/shared/wib';
import { formatMonthName, formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Amount, HighlightAmount } from '@/shared/ui/amount';
import { EmptyState, ErrorPanel, ProgressBar, ScreenSkeleton } from '@/shared/ui/feedback';
import { Gap, Screen, ScreenHeader } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { useMonthSummary } from './hooks';
import { MonthSwitcher } from './month-switcher';

/** D4 · Ringkasan kategori. Bilah horizontal satu warna; persen apa adanya dari API. */
export function SummaryScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const currentMonth = container.wallet.currentMonth();
  const start = params.month && isValidMonth(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const [month, setMonth] = useState(start);
  const summary = useMonthSummary(month);

  return (
    <Screen
      header={<ScreenHeader title={`Ringkasan ${formatMonthName(month)}`} left={{ label: '‹ Dompet', onPress: () => router.back(), accessibilityLabel: 'Kembali ke Dompet' }} />}
      refreshing={summary.isRefetching}
      onRefresh={() => summary.refetch()}
    >
      <MonthSwitcher month={month} currentMonth={currentMonth} onChange={setMonth} />
      <Gap />
      {summary.isPending ? (
        <ScreenSkeleton label="Ringkasan" rows={4} />
      ) : summary.isError ? (
        <ErrorPanel message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />
      ) : summary.data.expenseByCategory.length === 0 ? (
        <EmptyState message="Belum ada pengeluaran bulan ini." />
      ) : (
        <>
          <Txt variant="label" color="inkMuted">
            Total keluar
          </Txt>
          <HighlightAmount value={summary.data.totalExpense} label="Total keluar" />
          <Gap size="xl" />
          {summary.data.expenseByCategory.map((c) => (
            <View
              key={c.category}
              style={styles.row}
              accessible
              accessibilityLabel={`${c.label}, ${formatRupiah(c.amount)}, ${c.percent} persen dari total`}
            >
              <View style={styles.line}>
                <Txt variant="body" style={styles.flex}>
                  {c.label}
                </Txt>
                <Amount value={c.amount} />
              </View>
              <View style={styles.line}>
                <View style={styles.flex}>
                  <ProgressBar ratio={c.percent / 100} />
                </View>
                <Txt variant="label" color="inkMuted" tabular style={styles.pct}>
                  {c.percent}%
                </Txt>
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { marginBottom: spacing.lg, gap: spacing.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pct: { width: 44, textAlign: 'right' },
});
