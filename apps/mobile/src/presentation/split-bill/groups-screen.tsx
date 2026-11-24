import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { groupBalanceState, type GroupSummary } from '@/domain/split-bill/split-bill';
import { formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorPanel, ScreenSkeleton } from '@/shared/ui/feedback';
import { Screen } from '@/shared/ui/layout';
import { ListRow } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { useGroups } from './hooks';

function BalanceLine({ group }: { group: GroupSummary }) {
  const state = groupBalanceState(group);
  switch (state.kind) {
    case 'settled':
      return (
        <Txt variant="bodyStrong" color="statusPaid">
          ✓ Beres
        </Txt>
      );
    case 'i-owe':
      return (
        <Txt variant="bodyStrong" color="statusUnpaid" tabular>
          Kamu utang {formatRupiah(state.amount)}
        </Txt>
      );
    case 'owed-to-me':
      return (
        <Txt variant="bodyStrong" tabular>
          Diutangi {formatRupiah(state.amount)}
        </Txt>
      );
    case 'crossed':
      return (
        <Txt variant="bodyStrong" color="statusPending">
          Ada utang-piutang, buka grup
        </Txt>
      );
  }
}

/** P1 · Patungan (daftar grup) */
export function GroupsScreen() {
  const groups = useGroups();
  const actions = (
    <View style={styles.actions}>
      <Button label="Buat grup" variant="secondary" onPress={() => router.push('/grup/baru')} />
      <Button label="Gabung pakai kode" variant="secondary" onPress={() => router.push('/grup/gabung')} />
    </View>
  );

  return (
    <Screen testID="screen-patungan" refreshing={groups.isRefetching} onRefresh={() => groups.refetch()}>
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        Patungan
      </Txt>
      {groups.isPending ? (
        <ScreenSkeleton label="Patungan" rows={6} />
      ) : groups.isError ? (
        <ErrorPanel message={errorMessage(groups.error)} onRetry={() => groups.refetch()} />
      ) : groups.data.length === 0 ? (
        <EmptyState
          message="Belum ada grup. Buat grup untuk kamar kosmu, atau minta kode dari teman sekos."
          actionLabel="Buat grup"
          onAction={() => router.push('/grup/baru')}
          secondaryLabel="Gabung pakai kode"
          onSecondary={() => router.push('/grup/gabung')}
        />
      ) : (
        <>
          {groups.data.map((g) => (
            <ListRow
              key={g.id}
              title={g.name}
              right={
                <Txt variant="label" color="inkMuted">
                  {g.memberCount} orang
                </Txt>
              }
              below={<BalanceLine group={g} />}
              onPress={() => router.push({ pathname: '/grup/[id]', params: { id: g.id } })}
              accessibilityLabel={`Grup ${g.name}, ${g.memberCount} orang`}
            />
          ))}
          {actions}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
});
