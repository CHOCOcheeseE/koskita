import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { clock } from '@/data/container';
import { hasCode } from '@/domain/shared/errors';
import { addDays, dateWibOf, timeWibOf, todayWib, wibToUtcIso } from '@/domain/shared/wib';
import { DAY_SHORT, formatDayShortDate } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { confirmAction, EmptyState, ErrorPanel, InfoBar, ScreenSkeleton, Skeleton, useToast } from '@/shared/ui/feedback';
import { ChipGroup, PickerField, TextField } from '@/shared/ui/fields';
import { Screen, ScreenHeader } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { taskSchema, type TaskForm } from './forms';
import { useDeleteTask, useSaveTask, useSchedules, useTask } from './hooks';

const NO_COURSE = '__none__';

/** K3 · Form tugas (tambah / ubah) */
export function TaskFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const existing = useTask(id);
  const close = () => router.back();
  const title = id ? 'Ubah tugas' : 'Tugas baru';

  if (id && existing.isPending) {
    return (
      <Screen header={<ScreenHeader title={title} left={{ label: 'Batal', onPress: close }} />}>
        <ScreenSkeleton label="tugas" rows={4} />
      </Screen>
    );
  }
  if (id && existing.isError) {
    return (
      <Screen header={<ScreenHeader title={title} left={{ label: 'Kembali', onPress: close }} />}>
        {hasCode(existing.error, 'NOT_FOUND') ? (
          <EmptyState message="Tugas ini sudah tidak ada." actionLabel="Kembali" onAction={close} />
        ) : (
          <ErrorPanel message={errorMessage(existing.error)} onRetry={() => existing.refetch()} />
        )}
      </Screen>
    );
  }

  const today = todayWib(clock.now());
  const initial: TaskForm = existing.data
    ? {
        title: existing.data.title,
        scheduleId: existing.data.scheduleId,
        date: dateWibOf(existing.data.deadline),
        time: timeWibOf(existing.data.deadline),
        note: existing.data.note ?? '',
      }
    : { title: '', scheduleId: null, date: addDays(today, 1), time: '23:59', note: '' };

  return <TaskFormBody id={id} title={title} initial={initial} />;
}

function TaskFormBody({ id, title, initial }: { id?: string; title: string; initial: TaskForm }) {
  const toast = useToast();
  const schedules = useSchedules();
  const save = useSaveTask(id);
  const remove = useDeleteTask();
  const form = useForm<TaskForm>({ resolver: zodResolver(taskSchema), defaultValues: initial });
  const [date, time] = useWatch({ control: form.control, name: ['date', 'time'] });
  const isPast = new Date(wibToUtcIso(date, time)).getTime() < clock.now().getTime();

  const refetchSchedules = schedules.refetch;
  useEffect(() => {
    if (hasCode(save.error, 'SCHEDULE_NOT_FOUND')) {
      form.setValue('scheduleId', null);
      form.setError('scheduleId', { message: 'Jadwal yang dipilih sudah dihapus. Pilih lagi.' });
      refetchSchedules();
    }
  }, [save.error, form, refetchSchedules]);

  const submit = form.handleSubmit((values) =>
    save.mutate(
      {
        title: values.title,
        scheduleId: values.scheduleId,
        deadline: wibToUtcIso(values.date, values.time),
        note: values.note,
      },
      {
        onSuccess: () => {
          toast.show('Tugas disimpan');
          router.back();
        },
      },
    ),
  );

  const onDelete = async () => {
    const ok = await confirmAction({ title: `Hapus tugas ${initial.title}?`, confirmLabel: 'Hapus', destructive: true });
    if (!ok || !id) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.show('Tugas dihapus');
        router.back();
      },
    });
  };

  const courseOptions = [
    { value: NO_COURSE, label: 'Tanpa mata kuliah' },
    ...(schedules.data ?? []).map((s) => ({
      value: s.id,
      label: `${s.courseName} · ${DAY_SHORT[s.dayOfWeek - 1]} ${s.startTime}`,
    })),
  ];

  return (
    <Screen header={<ScreenHeader title={title} left={{ label: 'Batal', onPress: () => router.back() }} />}>
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            label="Judul"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            maxLength={80}
            showCounter
          />
        )}
      />
      <Txt variant="label" color="inkMuted" style={styles.label}>
        Mata kuliah (boleh kosong)
      </Txt>
      {schedules.isPending ? (
        <Skeleton height={48} />
      ) : schedules.isError ? (
        <ErrorPanel bar message={errorMessage(schedules.error)} onRetry={() => schedules.refetch()} />
      ) : (
        <Controller
          control={form.control}
          name="scheduleId"
          render={({ field, fieldState }) => (
            <ChipGroup
              accessibilityLabel="Mata kuliah"
              value={field.value ?? NO_COURSE}
              onChange={(v) => field.onChange(v === NO_COURSE ? null : v)}
              options={courseOptions}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
      <View style={styles.deadline}>
        <View style={styles.flex}>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => (
              <PickerField
                label="Deadline"
                mode="date"
                value={field.value}
                display={formatDayShortDate(field.value)}
                onChange={field.onChange}
              />
            )}
          />
        </View>
        <View style={styles.flex}>
          <Controller
            control={form.control}
            name="time"
            render={({ field, fieldState }) => (
              <PickerField
                label="Jam"
                mode="time"
                value={field.value}
                display={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>
      {isPast ? (
        <Txt variant="label" color="statusPending" style={styles.pastHint}>
          Deadline sudah lewat, tugas akan berlabel Terlambat.
        </Txt>
      ) : null}
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
            maxLength={300}
            showCounter
            multiline
          />
        )}
      />
      {save.isError && !hasCode(save.error, 'SCHEDULE_NOT_FOUND') ? (
        <InfoBar message={errorMessage(save.error)} tone="unpaid" />
      ) : null}
      <Button label="Simpan tugas" onPress={submit} loading={save.isPending} />
      {id ? (
        <View style={styles.delete}>
          {remove.isError ? <InfoBar message={errorMessage(remove.error)} tone="unpaid" /> : null}
          <Button label="Hapus tugas" variant="danger-text" onPress={onDelete} loading={remove.isPending} loadingLabel="Menghapus…" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { marginBottom: spacing.xs },
  deadline: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  pastHint: { marginTop: -spacing.sm, marginBottom: spacing.md },
  delete: { marginTop: spacing.xl },
});
