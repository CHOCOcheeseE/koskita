import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { container } from '@/data/container';
import { formatMonthName, formatRupiah } from '@/shared/format';
import { Button } from '@/shared/ui/button';
import { ErrorPanel, InfoBar, ScreenSkeleton, useToast } from '@/shared/ui/feedback';
import { AmountField } from '@/shared/ui/fields';
import { Gap, Screen, ScreenHeader } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { budgetSchema, type BudgetForm } from './forms';
import { useBudget, useSetBudget } from './hooks';

/** D3 · Atur anggaran (hanya bulan berjalan). */
export function BudgetScreen() {
  const month = container.wallet.currentMonth();
  const budget = useBudget(month);
  const header = (
    <ScreenHeader title={`Anggaran ${formatMonthName(month)}`} left={{ label: 'Batal', onPress: () => router.back() }} />
  );

  if (budget.isPending) {
    return (
      <Screen header={header}>
        <ScreenSkeleton label="anggaran" rows={2} />
      </Screen>
    );
  }
  if (budget.isError) {
    return (
      <Screen header={header}>
        <ErrorPanel message={errorMessage(budget.error)} onRetry={() => budget.refetch()} />
      </Screen>
    );
  }
  return (
    <Screen header={header}>
      <BudgetFormBody initial={budget.data?.amount ?? null} totalExpense={budget.data?.totalExpense ?? null} />
    </Screen>
  );
}

function BudgetFormBody({ initial, totalExpense }: { initial: number | null; totalExpense: number | null }) {
  const toast = useToast();
  const setBudget = useSetBudget();
  const form = useForm<BudgetForm>({ resolver: zodResolver(budgetSchema), defaultValues: { amount: initial } });
  const submit = form.handleSubmit((values) =>
    setBudget.mutate(values.amount as number, {
      onSuccess: (status) => {
        toast.show(
          status.today
            ? `Anggaran disimpan, jatah hari ini ${formatRupiah(status.today.dailyAllowance)}`
            : 'Anggaran disimpan',
        );
        router.back();
      },
    }),
  );
  return (
    <>
      <Txt variant="heading">Berapa jatah pengeluaranmu bulan ini?</Txt>
      <Gap />
      <Controller
        control={form.control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountField
            label="Anggaran bulan ini"
            large
            autoFocus
            value={field.value}
            onChange={field.onChange}
            inputRef={field.ref}
            error={fieldState.error?.message}
          />
        )}
      />
      {totalExpense ? (
        <Txt variant="body" color="inkMuted">
          Sudah keluar {formatRupiah(totalExpense)}.
        </Txt>
      ) : null}
      <Txt variant="body" color="inkMuted">
        Jatah harian langsung dihitung ulang setelah disimpan.
      </Txt>
      <Gap />
      {setBudget.isError ? <InfoBar message={errorMessage(setBudget.error)} tone="unpaid" /> : null}
      <Button label="Simpan anggaran" onPress={submit} loading={setBudget.isPending} />
    </>
  );
}
