import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { hasCode } from '@/domain/shared/errors';
import { manualSplitGap, type GroupDetail, type SplitMethod } from '@/domain/split-bill/split-bill';
import { formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { ErrorPanel, InfoBar, ScreenSkeleton, useToast } from '@/shared/ui/feedback';
import { AmountField, ChipGroup, Segmented, TextField } from '@/shared/ui/fields';
import { Gap, Screen, ScreenHeader } from '@/shared/ui/layout';
import { TaskCheckbox } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { useMyId } from '../auth/hooks';
import { errorMessage } from '../shared/error-messages';
import { rupiahField } from '../wallet/forms';
import { useCreateBill, useGroup } from './hooks';

const titleSchema = z
  .string()
  .trim()
  .min(3, { error: 'Judul minimal 3 karakter' })
  .max(60, { error: 'Judul maksimal 60 karakter' });

/** P5 · Buat tagihan */
export function CreateBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useGroup(id);
  const myId = useMyId();
  const header = <ScreenHeader title="Tagihan baru" left={{ label: 'Batal', onPress: () => router.back() }} />;

  if (group.isPending || !myId) {
    return (
      <Screen header={header}>
        {group.isError ? (
          <ErrorPanel message={errorMessage(group.error)} onRetry={() => group.refetch()} />
        ) : (
          <ScreenSkeleton label="anggota grup" rows={5} />
        )}
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
  return (
    <Screen header={header}>
      <BillForm group={group.data} myId={myId} onReloadMembers={() => group.refetch()} />
    </Screen>
  );
}

function BillForm({ group, myId, onReloadMembers }: { group: GroupDetail; myId: string; onReloadMembers: () => void }) {
  const toast = useToast();
  const create = useCreateBill(group.id);
  const members = group.members; // sudah urut joinedAt
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [payerId, setPayerId] = useState(myId);
  const [method, setMethod] = useState<SplitMethod>('equal');
  const [checked, setChecked] = useState<string[]>(members.map((m) => m.userId));
  const [manual, setManual] = useState<Record<string, number | null>>({});
  const [errors, setErrors] = useState<{ title?: string; total?: string; participants?: string }>({});

  // Anggota bisa berubah setelah muat ulang: peserta yang sudah keluar tidak ikut dikirim.
  const memberIds = new Set(members.map((m) => m.userId));
  const participants = checked.filter((x) => memberIds.has(x));

  const manualAmounts = members.map((m) => manual[m.userId] ?? 0);
  const gap = manualSplitGap(total ?? 0, manualAmounts);
  const manualShares = members
    .filter((m) => (manual[m.userId] ?? 0) > 0)
    .map((m) => ({ userId: m.userId, amount: manual[m.userId] as number }));

  const nameOf = (userId: string) => (userId === myId ? 'Kamu' : (members.find((m) => m.userId === userId)?.name ?? ''));

  const toggle = (userId: string) =>
    setChecked((p) => (p.includes(userId) ? p.filter((x) => x !== userId) : [...p, userId]));

  const submit = () => {
    const next: typeof errors = {};
    const t = titleSchema.safeParse(title);
    if (!t.success) next.title = t.error.issues[0]?.message;
    const a = rupiahField.safeParse(total);
    if (!a.success) next.total = a.error.issues[0]?.message;
    if (method === 'equal' && participants.length < 2) next.participants = 'Minimal 2 orang ikut patungan';
    if (method === 'manual' && manualShares.length < 2) next.participants = 'Minimal 2 orang ikut patungan';
    if (method === 'manual' && total !== null && gap !== 0) next.participants = 'Jumlah bagian belum sama dengan total';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    create.mutate(
      method === 'equal'
        ? { title, totalAmount: total as number, payerId, splitMethod: 'equal', participantIds: participants }
        : { title, totalAmount: total as number, payerId, splitMethod: 'manual', shares: manualShares },
      {
        onSuccess: (bill) => {
          toast.show('Tagihan dibuat');
          router.replace({ pathname: '/tagihan/[id]', params: { id: bill.id } });
        },
        onError: (error) => {
          if (hasCode(error, 'PARTICIPANT_NOT_MEMBER')) onReloadMembers();
        },
      },
    );
  };

  const approxEach = total && participants.length >= 2 ? Math.floor(total / participants.length) : null;
  const gapText =
    gap === 0 ? 'pas' : gap > 0 ? `kurang ${formatRupiah(gap)}` : `lebih ${formatRupiah(-gap)}`;

  return (
    <>
      <TextField
        label="Judul"
        placeholder="Wifi November"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
        showCounter
        error={errors.title}
      />
      <AmountField label="Total" value={total} onChange={setTotal} error={errors.total} />
      <Txt variant="label" color="inkMuted" style={styles.label}>
        Yang bayar dulu
      </Txt>
      <ChipGroup
        accessibilityLabel="Yang bayar dulu"
        value={payerId}
        onChange={setPayerId}
        options={members.map((m) => ({ value: m.userId, label: nameOf(m.userId) }))}
      />
      <Gap />
      <Txt variant="label" color="inkMuted" style={styles.label}>
        Cara bagi
      </Txt>
      <Segmented<SplitMethod>
        accessibilityLabel="Cara bagi"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'equal', label: 'Rata' },
          { value: 'manual', label: 'Manual' },
        ]}
      />
      <Gap />
      {method === 'equal' ? (
        <>
          <View style={styles.pair}>
            <Txt variant="bodyStrong">Ikut patungan</Txt>
            <Txt variant="label" color="inkMuted">
              {participants.length} orang
            </Txt>
          </View>
          {members.map((m) => (
            <View key={m.userId} style={styles.memberRow}>
              <TaskCheckbox
                checked={participants.includes(m.userId)}
                onPress={() => toggle(m.userId)}
                label={`${nameOf(m.userId)} ikut patungan`}
              />
              <Txt variant="body" style={styles.flex}>
                {nameOf(m.userId)}
              </Txt>
            </View>
          ))}
          {approxEach !== null ? (
            <Txt variant="label" color="inkMuted">
              Kira-kira ± {formatRupiah(approxEach)} per orang. Angka pasti muncul setelah tagihan dibuat.
            </Txt>
          ) : null}
        </>
      ) : (
        <>
          {members.map((m) => (
            <AmountField
              key={m.userId}
              label={nameOf(m.userId)}
              value={manual[m.userId] ?? null}
              onChange={(v) => setManual((s) => ({ ...s, [m.userId]: v }))}
            />
          ))}
          <Txt
            variant="bodyStrong"
            color={gap === 0 ? 'statusPaid' : 'statusUnpaid'}
            accessibilityLiveRegion="polite"
          >
            Terbagi {formatRupiah((total ?? 0) - gap)} dari {formatRupiah(total ?? 0)} · {gapText}
          </Txt>
        </>
      )}
      {errors.participants ? (
        <Txt variant="label" color="statusUnpaid" style={styles.error}>
          ! {errors.participants}
        </Txt>
      ) : null}
      <Gap />
      {create.isError ? (
        <InfoBar
          message={errorMessage(create.error, { gap: method === 'manual' ? gap : undefined })}
          tone="unpaid"
        />
      ) : null}
      <Button
        label="Buat tagihan"
        onPress={submit}
        loading={create.isPending}
        loadingLabel="Membuat…"
        disabled={method === 'manual' && (total === null || gap !== 0)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { marginBottom: spacing.xs },
  pair: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  error: { marginTop: spacing.sm },
});
