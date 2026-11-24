import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { hasCode } from '@/domain/shared/errors';
import { paidCount, shareActionsFor, type Bill, type BillShare, type ShareAction } from '@/domain/split-bill/split-bill';
import { formatRupiah } from '@/shared/format';
import { motion, spacing } from '@/shared/theme/tokens';
import { useReduceMotion } from '@/shared/theme/use-theme';
import { Amount } from '@/shared/ui/amount';
import { Button } from '@/shared/ui/button';
import { confirmAction, EmptyState, ErrorPanel, InfoBar, ScreenSkeleton, StatusBadge, useToast } from '@/shared/ui/feedback';
import { Screen, ScreenHeader, SectionDivider } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { useMyId } from '../auth/hooks';
import { errorMessage } from '../shared/error-messages';
import { useBill, useChangeShare, useDeleteBill } from './hooks';
import { SHARE_STATUS_LABEL } from './share-labels';

/** P6 · Detail tagihan */
export function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bill = useBill(id);
  const myId = useMyId();
  const back = () => router.back();

  const header = (
    <ScreenHeader title={bill.data?.title ?? 'Tagihan'} left={{ label: '‹ Kembali', onPress: back, accessibilityLabel: 'Kembali' }} />
  );

  if (bill.isPending || (!bill.isError && !myId)) {
    return (
      <Screen header={header}>
        <ScreenSkeleton label="tagihan" rows={5} />
      </Screen>
    );
  }
  if (bill.isError) {
    return (
      <Screen header={header}>
        {hasCode(bill.error, 'NOT_FOUND') ? (
          <EmptyState message="Tagihan ini sudah dihapus." actionLabel="Kembali" onAction={back} />
        ) : hasCode(bill.error, 'NOT_GROUP_MEMBER') ? (
          <EmptyState message="Kamu bukan anggota grup ini lagi." actionLabel="Kembali ke Patungan" onAction={() => router.replace('/patungan')} />
        ) : (
          <ErrorPanel message={errorMessage(bill.error)} onRetry={() => bill.refetch()} />
        )}
      </Screen>
    );
  }

  return (
    <Screen header={header} refreshing={bill.isRefetching} onRefresh={() => bill.refetch()}>
      <BillBody bill={bill.data} myId={myId as string} onRefetch={() => bill.refetch()} />
    </Screen>
  );
}

function SettledBadge({ settled }: { settled: boolean }) {
  const reduceMotion = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const wasSettled = useRef(settled);
  useEffect(() => {
    if (settled && !wasSettled.current && !reduceMotion) {
      scale.setValue(0.6);
      Animated.timing(scale, { toValue: 1, duration: motion.base, useNativeDriver: true }).start();
    }
    wasSettled.current = settled;
  }, [settled, reduceMotion, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {settled ? <StatusBadge kind="settled" label="Selesai" /> : <StatusBadge kind="open" label="Belum selesai" />}
    </Animated.View>
  );
}

function BillBody({ bill, myId, onRefetch }: { bill: Bill; myId: string; onRefetch: () => void }) {
  const toast = useToast();
  const change = useChangeShare(bill.id);
  const remove = useDeleteBill();
  const payerName = bill.payer.userId === myId ? 'kamu' : bill.payer.name;
  const creatorName = bill.createdBy.userId === myId ? 'kamu' : bill.createdBy.name;

  const run = async (share: BillShare, action: ShareAction) => {
    if (action === 'confirm' && share.status === 'belum_bayar') {
      const ok = await confirmAction({
        title: `Tandai bagian ${share.user.name} ${formatRupiah(share.amount)} lunas?`,
        message: 'Pakai ini kalau dibayar tunai.',
        confirmLabel: 'Tandai lunas',
      });
      if (!ok) return;
    }
    change.mutate(
      { shareId: share.id, action },
      {
        onSuccess: (updated) => {
          if (updated.status === 'settled') toast.show('Semua bagian lunas, tagihan selesai');
          else if (action === 'mark-paid') toast.show('Ditandai sudah transfer');
          else if (action === 'confirm') toast.show('Bagian ditandai lunas');
          else toast.show('Dikembalikan ke belum bayar');
        },
        onError: (error) => {
          if (hasCode(error, 'INVALID_SHARE_TRANSITION')) onRefetch();
        },
      },
    );
  };

  const onDelete = async () => {
    const ok = await confirmAction({
      title: `Hapus tagihan ${bill.title}?`,
      message: 'Semua bagian ikut terhapus.',
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(bill.id, {
      onSuccess: () => {
        toast.show('Tagihan dihapus');
        router.back();
      },
    });
  };

  const changeErrorActor = hasCode(change.error, 'NOT_BILL_PAYER')
    ? bill.payer.name
    : hasCode(change.error, 'NOT_SHARE_OWNER')
      ? 'pemilik bagian'
      : undefined;

  return (
    <>
      <Amount value={bill.totalAmount} variant="amountL" />
      <Txt variant="body" color="inkMuted">
        {bill.splitMethod === 'equal' ? 'bagi rata' : 'bagi manual'} · Dibayar {payerName} · dibuat {creatorName}
      </Txt>
      <View style={styles.statusRow}>
        <Txt variant="body">
          {paidCount(bill)} dari {bill.shares.length} lunas
        </Txt>
        <SettledBadge settled={bill.status === 'settled'} />
      </View>
      {change.isError ? (
        <InfoBar message={errorMessage(change.error, { actorName: changeErrorActor })} tone="unpaid" />
      ) : null}
      <SectionDivider />
      {bill.shares.map((share) => {
        const isMe = share.user.userId === myId;
        const isPayer = share.user.userId === bill.payer.userId;
        const actions = shareActionsFor(bill, share, myId);
        const pending = change.isPending && change.variables?.shareId === share.id;
        const name = `${isMe ? 'Kamu' : share.user.name}${isPayer ? ' (pembayar)' : ''}`;
        return (
          <View key={share.id} style={styles.share}>
            <View style={styles.pair}>
              <Txt variant="bodyStrong" style={styles.flex}>
                {name}
              </Txt>
              <Amount value={share.amount} />
            </View>
            <View style={styles.pair}>
              <StatusBadge kind={share.status} label={SHARE_STATUS_LABEL[share.status]} />
              {isMe && !isPayer && share.status === 'menunggu_konfirmasi' ? (
                <Txt variant="label" color="inkMuted">
                  Menunggu {bill.payer.name} mengecek
                </Txt>
              ) : null}
            </View>
            {actions.length > 0 ? (
              <View style={styles.actions}>
                {actions.includes('mark-paid') ? (
                  <Button label="Aku sudah transfer" onPress={() => run(share, 'mark-paid')} loading={pending} style={styles.grow} />
                ) : null}
                {actions.includes('confirm') && share.status === 'menunggu_konfirmasi' ? (
                  <Button label="Terima" onPress={() => run(share, 'confirm')} loading={pending} />
                ) : null}
                {actions.includes('reject') ? (
                  <Button label="Belum masuk" variant="secondary" onPress={() => run(share, 'reject')} disabled={pending} />
                ) : null}
                {actions.includes('confirm') && share.status === 'belum_bayar' ? (
                  <Button
                    label="Tandai lunas"
                    variant="text"
                    onPress={() => run(share, 'confirm')}
                    loading={pending}
                    accessibilityLabel={`Tandai bagian ${share.user.name} lunas`}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
      {bill.canDelete ? (
        <View style={styles.delete}>
          {remove.isError ? <InfoBar message={errorMessage(remove.error)} tone="unpaid" /> : null}
          <Button label="Hapus tagihan" variant="danger-text" onPress={onDelete} loading={remove.isPending} loadingLabel="Menghapus…" />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  share: { paddingVertical: spacing.md, gap: spacing.xs },
  pair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  delete: { marginTop: spacing.xl },
});
