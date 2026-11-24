import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { initialsOf } from '@/domain/auth/auth';
import { allowanceState, splitState, type HomeSummary } from '@/domain/home/home';
import { formatLongDate, formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Amount, HighlightAmount } from '@/shared/ui/amount';
import { Button, Fab } from '@/shared/ui/button';
import { EmptyState, ErrorPanel, ScreenSkeleton } from '@/shared/ui/feedback';
import { Screen, SectionDivider } from '@/shared/ui/layout';
import { Avatar, ListRow } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { useMe } from '../auth/hooks';
import { errorMessage } from '../shared/error-messages';
import { deadlineText, TaskDeadlineBadge, taskSpeech } from '../study/task-badge';
import { useHomeToday } from './hooks';

const addExpense = () => router.push({ pathname: '/transaksi/baru', params: { dari: 'beranda' } });

/** B1 · Beranda */
export function HomeScreen() {
  const home = useHomeToday();
  const me = useMe();
  const fab = <Fab label="+ Pengeluaran" onPress={addExpense} testID="fab-pengeluaran" />;

  const header = (
    <View style={styles.top}>
      <Txt variant="bodyStrong" accessibilityRole="header">
        {home.data ? formatLongDate(home.data.date) : 'Beranda'}
      </Txt>
      <Avatar
        initials={me.data ? initialsOf(me.data.name) : '·'}
        onPress={() => router.push('/profil')}
        accessibilityLabel="Buka profil"
      />
    </View>
  );

  return (
    <Screen
      testID="screen-beranda"
      floating={fab}
      refreshing={home.isRefetching}
      onRefresh={() => home.refetch()}
    >
      {header}
      {home.isPending ? (
        <ScreenSkeleton label="Beranda" rows={8} />
      ) : home.isError ? (
        <ErrorPanel message={errorMessage(home.error)} onRetry={() => home.refetch()} />
      ) : (
        <HomeContent data={home.data} />
      )}
    </Screen>
  );
}

function HomeContent({ data }: { data: HomeSummary }) {
  return (
    <>
      <AllowanceSection data={data} />
      <SplitSection data={data} />
      <ClassesSection data={data} />
      <TasksSection data={data} />
    </>
  );
}

function AllowanceSection({ data }: { data: HomeSummary }) {
  const state = allowanceState(data.budget);
  if (state.kind === 'no-budget' || !data.budget?.today) {
    return (
      <EmptyState
        message="Belum ada anggaran bulan ini. Atur sekali, nanti kelihatan jatah harianmu."
        actionLabel="Atur anggaran"
        onAction={() => router.push('/anggaran')}
      />
    );
  }
  const { budget } = data;
  const today = budget.today!;
  return (
    <View style={styles.block}>
      <Txt variant="label" color="inkMuted">
        Sisa jajan hari ini
      </Txt>
      {state.kind === 'over-budget' ? (
        <>
          <HighlightAmount value={0} highlighted={false} label="Sisa jajan hari ini" />
          <Txt variant="bodyStrong" color="statusUnpaid">
            Anggaran terlampaui {formatRupiah(state.overBudgetAmount)}
          </Txt>
        </>
      ) : (
        <>
          <HighlightAmount value={today.remainingToday} label="Sisa jajan hari ini" testID="angka-sisa-hari-ini" />
          {state.kind === 'over-today' ? (
            <Txt variant="bodyStrong" color="statusUnpaid">
              Lewat {formatRupiah(state.overTodayAmount)} dari jatah hari ini
            </Txt>
          ) : null}
        </>
      )}
      <Txt variant="label" color="inkMuted">
        dari jatah {formatRupiah(today.dailyAllowance)} · sisa anggaran {formatRupiah(budget.remainingBudget)},{' '}
        {today.daysLeftIncludingToday} hari
      </Txt>
    </View>
  );
}

function SplitSection({ data }: { data: HomeSummary }) {
  const state = splitState(data.split);
  return (
    <>
      <SectionDivider title="Patungan" />
      {state === 'no-groups' ? (
        <EmptyState
          message="Patungan wifi atau galon? Buat grup kos atau gabung pakai kode."
          actionLabel="Buka Patungan"
          onAction={() => router.push('/patungan')}
        />
      ) : state === 'settled' ? (
        <View style={styles.inline}>
          <Txt variant="bodyStrong" color="statusPaid">
            ✓ Semua patungan beres
          </Txt>
          <Button label="Lihat grup" variant="text" onPress={() => router.push('/patungan')} />
        </View>
      ) : (
        <View>
          <View style={styles.pair}>
            <Txt variant="body">Kamu utang</Txt>
            <Amount value={data.split.totalIOwe} />
          </View>
          <View style={styles.pair}>
            <Txt variant="body">Diutangi</Txt>
            <Amount value={data.split.totalOwedToMe} />
          </View>
          <Button label="Lihat grup" variant="text" onPress={() => router.push('/patungan')} style={styles.alignEnd} />
        </View>
      )}
    </>
  );
}

function ClassesSection({ data }: { data: HomeSummary }) {
  return (
    <>
      <SectionDivider title="Kelas hari ini" />
      {data.classesToday.length === 0 ? (
        <View style={styles.inline}>
          <Txt variant="body" color="inkMuted">
            Tidak ada kelas hari ini.
          </Txt>
          <Button label="Atur jadwal" variant="text" onPress={() => router.push({ pathname: '/kuliah', params: { segmen: 'jadwal' } })} />
        </View>
      ) : (
        data.classesToday.map((c) => (
          <ListRow
            key={c.id}
            title={`${c.startTime}–${c.endTime}  ${c.courseName}`}
            right={
              c.room ? (
                <Txt variant="label" color="inkMuted">
                  {c.room}
                </Txt>
              ) : undefined
            }
            accessibilityLabel={`${c.courseName}, jam ${c.startTime} sampai ${c.endTime}${c.room ? `, ruang ${c.room}` : ''}`}
            onPress={() => router.push({ pathname: '/kuliah', params: { segmen: 'jadwal' } })}
          />
        ))
      )}
    </>
  );
}

function TasksSection({ data }: { data: HomeSummary }) {
  const openTasks = () => router.push({ pathname: '/kuliah', params: { segmen: 'tugas' } });
  return (
    <>
      <SectionDivider title="Tugas terdekat" />
      {data.upcomingTasks.length === 0 ? (
        <View style={styles.inline}>
          <Txt variant="body" color="inkMuted">
            Belum ada tugas yang menunggu.
          </Txt>
          <Button label="Tambah tugas" variant="text" onPress={() => router.push('/tugas/baru')} />
        </View>
      ) : (
        <>
          {data.upcomingTasks.map((t) => (
            <ListRow
              key={t.id}
              title={`○ ${t.title}`}
              right={<TaskDeadlineBadge task={t} today={data.date} />}
              subtitle={deadlineText(t)}
              accessibilityLabel={taskSpeech(t, data.date)}
              onPress={openTasks}
            />
          ))}
          <Button label="Semua tugas" variant="text" onPress={openTasks} style={styles.alignEnd} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  block: { gap: spacing.xs },
  pair: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 },
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  alignEnd: { alignSelf: 'flex-end' },
});
