import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { container } from '@/data/container';
import { hasCode } from '@/domain/shared/errors';
import { addDays } from '@/domain/shared/wib';
import { categoriesFor, type Category, type TransactionType } from '@/domain/wallet/wallet';
import { formatDayShortDate, formatRupiah } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { confirmAction, EmptyState, ErrorPanel, InfoBar, ScreenSkeleton, Skeleton, useToast } from '@/shared/ui/feedback';
import { AmountField, ChipGroup, PickerField, Segmented, TextField } from '@/shared/ui/fields';
import { Gap, Screen, ScreenHeader } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { transactionSchema, type TransactionForm } from './forms';
import { useCategories, useDeleteTransaction, useSaveTransaction, useTransaction } from './hooks';

/** D2 · Form transaksi (tambah / ubah). */
export function TransactionFormScreen() {
  const params = useLocalSearchParams<{ id?: string; dari?: string }>();
  const id = params.id;
  const existing = useTransaction(id);
  const close = () => router.back();

  if (id && existing.isPending) {
    return (
      <Screen header={<ScreenHeader title="Ubah transaksi" left={{ label: 'Batal', onPress: close }} />}>
        <ScreenSkeleton label="transaksi" rows={4} />
      </Screen>
    );
  }
  if (id && existing.isError) {
    const gone = hasCode(existing.error, 'NOT_FOUND');
    return (
      <Screen header={<ScreenHeader title="Ubah transaksi" left={{ label: 'Kembali', onPress: close }} />}>
        {gone ? (
          <EmptyState message="Transaksi ini sudah tidak ada." actionLabel="Kembali" onAction={close} />
        ) : (
          <ErrorPanel message={errorMessage(existing.error)} onRetry={() => existing.refetch()} />
        )}
      </Screen>
    );
  }

  const today = container.wallet.today();
  const initial: TransactionForm = existing.data
    ? {
        type: existing.data.type,
        amount: existing.data.amount,
        category: existing.data.category,
        date: existing.data.date,
        note: existing.data.note ?? '',
      }
    : { type: 'expense', amount: null, category: null, date: today, note: '' };

  return <TransactionFormBody id={id} initial={initial} today={today} focusAmount={!id} />;
}

function TransactionFormBody({ id, initial, today, focusAmount }: { id?: string; initial: TransactionForm; today: string; focusAmount: boolean }) {
  const toast = useToast();
  const categories = useCategories();
  const save = useSaveTransaction(id);
  const remove = useDeleteTransaction();
  const form = useForm<TransactionForm>({ resolver: zodResolver(transactionSchema), defaultValues: initial });
  const type = useWatch({ control: form.control, name: 'type' }) as TransactionType;
  const isEdit = !!id;

  useEffect(() => {
    if (save.error && hasCode(save.error, 'DATE_IN_FUTURE')) form.setError('date', { message: 'Tanggal tidak boleh setelah hari ini' });
    if (save.error && hasCode(save.error, 'CATEGORY_TYPE_MISMATCH')) {
      form.setError('category', { message: 'Kategori tidak cocok dengan jenis transaksi' });
    }
  }, [save.error, form]);

  const submit = form.handleSubmit((values) => {
    save.mutate(
      {
        type: values.type,
        amount: values.amount as number,
        category: values.category as Category,
        date: values.date,
        note: values.note,
      },
      {
        onSuccess: () => {
          toast.show(isEdit ? 'Transaksi disimpan' : values.type === 'expense' ? 'Pengeluaran disimpan' : 'Pemasukan disimpan');
          router.back();
        },
      },
    );
  });

  const onDelete = async () => {
    const amount = form.getValues('amount') ?? 0;
    const ok = await confirmAction({
      title: `Hapus ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} ${formatRupiah(amount)}?`,
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (!ok || !id) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.show('Transaksi dihapus');
        router.back();
      },
    });
  };

  const saveLabel = isEdit ? 'Simpan perubahan' : type === 'expense' ? 'Simpan pengeluaran' : 'Simpan pemasukan';
  const businessError =
    save.isError && !hasCode(save.error, 'DATE_IN_FUTURE', 'CATEGORY_TYPE_MISMATCH') ? errorMessage(save.error) : null;

  return (
    <Screen header={<ScreenHeader title={isEdit ? 'Ubah transaksi' : 'Catat transaksi'} left={{ label: 'Batal', onPress: () => router.back() }} />}>
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <Segmented
            accessibilityLabel="Jenis transaksi"
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              // Kategori berbeda per tipe: kosongkan supaya tidak CATEGORY_TYPE_MISMATCH.
              form.setValue('category', null);
            }}
            options={[
              { value: 'expense', label: 'Pengeluaran' },
              { value: 'income', label: 'Pemasukan' },
            ]}
          />
        )}
      />
      <Gap />
      <Controller
        control={form.control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountField
            label="Nominal"
            large
            autoFocus={focusAmount}
            value={field.value}
            onChange={field.onChange}
            inputRef={field.ref}
            error={fieldState.error?.message}
            testID="input-nominal"
          />
        )}
      />
      <Txt variant="label" color="inkMuted" style={styles.label}>
        Kategori
      </Txt>
      {categories.isPending ? (
        <Skeleton height={48} />
      ) : categories.isError ? (
        <ErrorPanel bar message={errorMessage(categories.error)} onRetry={() => categories.refetch()} />
      ) : (
        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <ChipGroup
              accessibilityLabel="Kategori"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              options={categoriesFor(type, categories.data).map((c) => ({ value: c.code, label: c.label }))}
            />
          )}
        />
      )}
      <Gap />
      <Controller
        control={form.control}
        name="date"
        render={({ field, fieldState }) => (
          <PickerField
            label="Tanggal"
            mode="date"
            value={field.value}
            maxDate={today}
            onChange={field.onChange}
            error={fieldState.error?.message}
            display={
              field.value === today
                ? `Hari ini, ${formatDayShortDate(field.value).split(', ')[1]}`
                : field.value === addDays(today, -1)
                  ? `Kemarin, ${formatDayShortDate(field.value).split(', ')[1]}`
                  : formatDayShortDate(field.value)
            }
          />
        )}
      />
      <Controller
        control={form.control}
        name="note"
        render={({ field, fieldState }) => (
          <TextField
            label="Catatan (boleh kosong)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={100}
            showCounter
          />
        )}
      />
      {businessError ? <InfoBar message={businessError} tone="unpaid" /> : null}
      <Button label={saveLabel} onPress={submit} loading={save.isPending} testID="btn-simpan-transaksi" />
      {isEdit ? (
        <View style={styles.delete}>
          {remove.isError ? <InfoBar message={errorMessage(remove.error)} tone="unpaid" /> : null}
          <Button label="Hapus transaksi" variant="danger-text" onPress={onDelete} loading={remove.isPending} loadingLabel="Menghapus…" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs },
  delete: { marginTop: spacing.xl },
});
