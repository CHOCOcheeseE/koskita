import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { hasCode } from '@/domain/shared/errors';
import {
  balanceSentences,
  counterpartiesOf,
  myShareOf,
  paidCount,
  type Bill,
  type BillStatus,
  type GroupBalances,
  type GroupDetail,
} from '@/domain/split-bill/split-bill';
import { formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Amount, HighlightAmount } from '@/shared/ui/amount';
import { Button, Fab } from '@/shared/ui/button';
import { confirmAction, EmptyState, ErrorPanel, InfoBar, ScreenSkeleton, Skeleton, StatusBadge, useToast } from '@/shared/ui/feedback';
import { Segmented } from '@/shared/ui/fields';
import { Screen, ScreenHeader, SectionDivider } from '@/shared/ui/layout';
import { InviteCodeCard, ListRow, Sheet } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { useMyId } from '../auth/hooks';
import { errorMessage } from '../shared/error-messages';
import { useGroup, useGroupBalances, useGroupBills, useLeaveGroup } from './hooks';
import { SHARE_STATUS_LABEL } from './share-labels';

type Filter = 'all' | BillStatus;
type SheetKind = 'menu' | 'code' | 'members' | 'cannot-leave' | null;

/** P4 · Detail grup */
export function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useGroup(id);
  const balances = useGroupBalances(id);
  const [filter, setFilter] = useState<Filter>('all');
  const bills = useGroupBills(id, filter === 'all' ? null : filter);
  const myId = useMyId();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const leave = useLeaveGroup();
  const toast = useToast();

  const back = () => router.back();
  const notMember = [group.error, balances.error, bills.error].some((e) => hasCode(e, 'NOT_GROUP_MEMBER'));

  if (notMember) {
    return (
      <Screen header={<ScreenHeader left={{ label: '‹ Patungan', onPress: back }} />}>
        <EmptyState message="Kamu bukan anggota grup ini lagi." actionLabel="Kembali ke Patungan" onAction={() => router.replace('/patungan')} />
      </Screen>
    );
  }

  const title = group.data?.name ?? 'Grup';
  const header = (
    <ScreenHeader
      title={title}
      left={{ label: '‹ Patungan', onPress: back, accessibilityLabel: 'Kembali ke Patungan' }}
      right={group.data ? { label: '⋯', onPress: () => setSheet('menu'), accessibilityLabel: 'Menu grup: kode, anggota, keluar' } : undefined}
    />
  );

  if (group.isPending) {
    return (
      <Screen header={header}>
        <ScreenSkeleton label="grup" rows={6} />
      </Screen>
    );
  }
  if (group.isError) {
    return (
      <Screen header={header}>
        <ErrorPanel message={errorMessage(group.error)} onRetry={() => group.refetch()} />
      </Screen>
    );
  }

  const detail = group.data;
  const singleMember = detail.members.length < 2;
  const items = bills.data?.pages.flatMap((p) => p.items) ?? [];

  const doLeave = async () => {
    setSheet(null);
    if (balances.data && !balances.data.canLeave) {
      setSheet('cannot-leave');
      return;
    }
    const ok = await confirmAction({ title: `Keluar dari ${detail.name}?`, confirmLabel: 'Keluar', destructive: true });
    if (!ok) return;
    leave.mutate(detail.id, {
      onSuccess: () => {
        toast.show(`Kamu keluar dari ${detail.name}`);
        router.replace('/patungan');
      },
      onError: (error) => {
        if (hasCode(error, 'BALANCE_NOT_SETTLED')) {
          balances.refetch();
          setSheet('cannot-leave');
        }
      },
    });
  };

  const refresh = () => {
    group.refetch();
    balances.refetch();
    bills.refetch();
  };

  return (
    <Screen
      header={header}
      refreshing={group.isRefetching || balances.isRefetching || bills.isRefetching}
      onRefresh={refresh}
      onEndReached={() => bills.hasNextPage && !bills.isFetchingNextPage && bills.fetchNextPage()}
      floating={
        singleMember ? undefined : (
          <Fab label="+ Tagihan" onPress={() => router.push({ pathname: '/grup/[id]/tagihan-baru', params: { id: detail.id } })} />
        )
      }
    >
      {leave.isError && !hasCode(leave.error, 'BALANCE_NOT_SETTLED') ? (
        <InfoBar message={errorMessage(leave.error)} tone="unpaid" />
      ) : null}

      {balances.isPending ? (
        <Skeleton height={80} />
      ) : balances.isError ? (
        <ErrorPanel bar message={errorMessage(balances.error)} onRetry={() => balances.refetch()} />
      ) : myId ? (
        <BalancesSection balances={balances.data} myId={myId} />
      ) : null}

      <SectionDivider title="Tagihan" />
      <Segmented<Filter>
        accessibilityLabel="Saring tagihan"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Semua' },
          { value: 'open', label: 'Belum selesai' },
          { value: 'settled', label: 'Selesai' },
        ]}
      />
      {singleMember ? (
        <EmptyState
          message="Ajak minimal satu teman dulu, tagihan butuh 2 orang."
          actionLabel="Bagikan kode"
          onAction={() => setSheet('code')}
        />
      ) : null}
      {bills.isPending ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={40} style={styles.skeletonRow} />)
      ) : bills.isError ? (
        <ErrorPanel message={errorMessage(bills.error)} onRetry={() => bills.refetch()} />
      ) : items.length === 0 ? (
        singleMember ? null : (
          <EmptyState
            message="Belum ada tagihan. Catat tagihan pertama, misal wifi bulan ini."
            actionLabel="+ Tagihan"
            onAction={() => router.push({ pathname: '/grup/[id]/tagihan-baru', params: { id: detail.id } })}
          />
        )
      ) : (
        items.map((b) => <BillRow key={b.id} bill={b} myId={myId} />)
      )}
      {bills.isFetchingNextPage ? (
        <Txt variant="label" color="inkMuted" style={styles.center}>
          Memuat…
        </Txt>
      ) : null}

      <GroupSheets
        kind={sheet}
        onClose={() => setSheet(null)}
        detail={detail}
        balances={balances.data}
        myId={myId}
        onOpen={setSheet}
        onLeave={doLeave}
        leaving={leave.isPending}
      />
    </Screen>
  );
}

function BalancesSection({ balances, myId }: { balances: GroupBalances; myId: string }) {
  if (balances.allSettled) {
    return (
      <Txt variant="heading" color="statusPaid" style={styles.settled}>
        ✓ Semua patungan beres
      </Txt>
    );
  }
  const sentences = balanceSentences(balances.entries, myId);
  return (
    <View>
      <Txt variant="label" color="inkMuted">
        Kamu utang
      </Txt>
      <HighlightAmount value={balances.totalIOwe} highlighted={balances.totalIOwe > 0} label="Kamu utang" />
      <View style={styles.pair}>
        <Txt variant="body">Diutangi</Txt>
        <Amount value={balances.totalOwedToMe} />
      </View>
      <Txt variant="bodyStrong" style={styles.subhead}>
        Siapa ke siapa
      </Txt>
      {sentences.map((s, i) => (
        <View key={i} style={styles.pair} accessible accessibilityLabel={`${s.text}, ${s.amount} rupiah`}>
          <Txt variant="body" color={s.involvesMe ? 'ink' : 'inkMuted'} style={styles.flex}>
            {s.text}
          </Txt>
          <Amount value={s.amount} color={s.involvesMe ? 'ink' : 'inkMuted'} />
        </View>
      ))}
    </View>
  );
}

function BillRow({ bill, myId }: { bill: Bill; myId: string | undefined }) {
  const iAmPayer = !!myId && bill.payer.userId === myId;
  const mine = myId ? myShareOf(bill, myId) : undefined;
  const payerText = iAmPayer ? 'Dibayar kamu' : `Dibayar ${bill.payer.name}`;
  let badge: ReactNode;
  if (bill.status === 'settled') badge = <StatusBadge kind="settled" label="Selesai" />;
  else if (iAmPayer) badge = <StatusBadge kind="open" label={`Kamu pembayar · ${paidCount(bill)} dari ${bill.shares.length} lunas`} />;
  else if (mine) badge = <StatusBadge kind={mine.status} label={SHARE_STATUS_LABEL[mine.status]} />;
  else badge = <StatusBadge kind="open" label="Belum selesai" />;
  return (
    <ListRow
      title={bill.title}
      right={<Amount value={bill.totalAmount} />}
      subtitle={mine && !iAmPayer ? `${payerText} · Bagianmu ${formatRupiah(mine.amount)}` : payerText}
      below={<View style={styles.badge}>{badge}</View>}
      onPress={() => router.push({ pathname: '/tagihan/[id]', params: { id: bill.id } })}
      accessibilityLabel={`Tagihan ${bill.title}, ${payerText}`}
    />
  );
}

type SheetsProps = {
  kind: SheetKind;
  onClose: () => void;
  onOpen: (kind: SheetKind) => void;
  detail: GroupDetail;
  balances: GroupBalances | undefined;
  myId: string | undefined;
  onLeave: () => void;
  leaving: boolean;
};

function GroupSheets({ kind, onClose, onOpen, detail, balances, myId, onLeave, leaving }: SheetsProps) {
  return (
    <>
      <Sheet visible={kind === 'menu'} onClose={onClose} title={detail.name}>
        <Button label="Kode undangan" variant="text" onPress={() => onOpen('code')} />
        <Button label="Anggota" variant="text" onPress={() => onOpen('members')} />
        <Button label="Keluar grup" variant="danger-text" onPress={onLeave} loading={leaving} loadingLabel="Keluar…" />
      </Sheet>
      <Sheet visible={kind === 'code'} onClose={onClose} title="Kode undangan">
        <InviteCodeCard code={detail.inviteCode} groupName={detail.name} />
      </Sheet>
      <Sheet visible={kind === 'members'} onClose={onClose} title={`Anggota (${detail.members.length})`}>
        {detail.members.map((m) => (
          <ListRow key={m.userId} title={m.userId === myId ? `${m.name} (kamu)` : m.name} subtitle={m.campus ?? undefined} />
        ))}
      </Sheet>
      <Sheet visible={kind === 'cannot-leave'} onClose={onClose} title="Selesaikan dulu patunganmu">
        <Txt variant="body">
          Kamu belum bisa keluar karena masih ada utang-piutang
          {balances && myId && counterpartiesOf(balances.entries, myId).length > 0
            ? ` dengan ${counterpartiesOf(balances.entries, myId).join(', ')}`
            : ''}
          . Lunasi atau konfirmasi tagihannya dulu.
        </Txt>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 32 },
  subhead: { marginTop: spacing.lg, marginBottom: spacing.xs },
  settled: { marginTop: spacing.md },
  badge: { marginTop: spacing.xs },
  center: { textAlign: 'center', marginTop: spacing.md },
  skeletonRow: { marginTop: spacing.md },
});
