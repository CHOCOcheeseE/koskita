import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { clock } from '@/data/container';
import { hasCode } from '@/domain/shared/errors';
import { isoDayOfWeekWib } from '@/domain/shared/wib';
import { conflictText } from '@/domain/study/study';
import { DAY_NAMES, DAY_SHORT } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/ui/button';
import { confirmAction, EmptyState, ErrorPanel, InfoBar, ScreenSkeleton, useToast } from '@/shared/ui/feedback';
import { ChipGroup, PickerField, TextField } from '@/shared/ui/fields';
import { Screen, ScreenHeader } from '@/shared/ui/layout';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { scheduleSchema, type ScheduleForm } from './forms';
import { useDeleteSchedule, useSaveSchedule, useSchedule } from './hooks';

/** K2 · Form jadwal (tambah / ubah) */
export function ScheduleFormScreen() {
  const params = useLocalSearchParams<{ id?: string; hari?: string }>();
  const id = params.id;
  const existing = useSchedule(id);
  const close = () => router.back();
  const title = id ? 'Ubah jadwal' : 'Jadwal baru';

  if (id && existing.isPending) {
    return (
      <Screen header={<ScreenHeader title={title} left={{ label: 'Batal', onPress: close }} />}>
        <ScreenSkeleton label="jadwal" rows={4} />
      </Screen>
    );
  }
  if (id && existing.isError) {
    return (
      <Screen header={<ScreenHeader title={title} left={{ label: 'Kembali', onPress: close }} />}>
        {hasCode(existing.error, 'NOT_FOUND') ? (
          <EmptyState message="Jadwal ini sudah tidak ada." actionLabel="Kembali" onAction={close} />
        ) : (
          <ErrorPanel message={errorMessage(existing.error)} onRetry={() => existing.refetch()} />
        )}
      </Screen>
    );
  }

  const hari = Number(params.hari);
  const initial: ScheduleForm = existing.data
    ? {
        courseName: existing.data.courseName,
        dayOfWeek: existing.data.dayOfWeek,
        startTime: existing.data.startTime,
        endTime: existing.data.endTime,
        room: existing.data.room ?? '',
      }
    : {
        courseName: '',
        dayOfWeek: hari >= 1 && hari <= 7 ? hari : isoDayOfWeekWib(clock.now()),
        startTime: '08:00',
        endTime: '09:40',
        room: '',
      };
  return <ScheduleFormBody id={id} title={title} initial={initial} />;
}

function ScheduleFormBody({ id, title, initial }: { id?: string; title: string; initial: ScheduleForm }) {
  const toast = useToast();
  const save = useSaveSchedule(id);
  const remove = useDeleteSchedule();
  const form = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema), defaultValues: initial });

  useEffect(() => {
    if (hasCode(save.error, 'TIME_RANGE_INVALID')) form.setError('endTime', { message: 'Jam selesai harus setelah jam mulai' });
  }, [save.error, form]);

  const submit = form.handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: (schedule) => {
        const conflict = conflictText(schedule);
        toast.show(conflict ? `Jadwal disimpan. ${conflict}.` : 'Jadwal disimpan');
        router.back();
      },
    }),
  );

  const onDelete = async () => {
    const ok = await confirmAction({
      title: `Hapus jadwal ${initial.courseName}?`,
      message: 'Tugas yang tertaut tetap ada, hanya tidak lagi punya mata kuliah.',
      confirmLabel: 'Hapus',
      destructive: true,
    });
    if (!ok || !id) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.show('Jadwal dihapus');
        router.back();
      },
    });
  };

  return (
    <Screen header={<ScreenHeader title={title} left={{ label: 'Batal', onPress: () => router.back() }} />}>
      <Controller
        control={form.control}
        name="courseName"
        render={({ field, fieldState }) => (
          <TextField
            label="Mata kuliah"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={fieldState.error?.message}
            maxLength={60}
            showCounter
          />
        )}
      />
      <Txt variant="label" color="inkMuted" style={styles.label}>
        Hari
      </Txt>
      <Controller
        control={form.control}
        name="dayOfWeek"
        render={({ field }) => (
          <ChipGroup
            compact
            accessibilityLabel="Hari"
            value={field.value}
            onChange={field.onChange}
            options={DAY_SHORT.map((d, i) => ({ value: i + 1, label: d, accessibilityLabel: DAY_NAMES[i] }))}
          />
        )}
      />
      <View style={styles.times}>
        <View style={styles.flex}>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <PickerField label="Mulai" mode="time" value={field.value} display={field.value} onChange={field.onChange} error={fieldState.error?.message} />
            )}
          />
        </View>
        <View style={styles.flex}>
          <Controller
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <PickerField label="Selesai" mode="time" value={field.value} display={field.value} onChange={field.onChange} error={fieldState.error?.message} />
            )}
          />
        </View>
      </View>
      <Controller
        control={form.control}
        name="room"
        render={({ field, fieldState }) => (
          <TextField
            label="Ruang (boleh kosong)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={30}
            showCounter
          />
        )}
      />
      {save.isError && !hasCode(save.error, 'TIME_RANGE_INVALID') ? (
        <InfoBar message={errorMessage(save.error)} tone="unpaid" />
      ) : null}
      <Button label="Simpan jadwal" onPress={submit} loading={save.isPending} />
      {id ? (
        <View style={styles.delete}>
          {remove.isError ? <InfoBar message={errorMessage(remove.error)} tone="unpaid" /> : null}
          <Button label="Hapus jadwal" variant="danger-text" onPress={onDelete} loading={remove.isPending} loadingLabel="Menghapus…" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { marginBottom: spacing.xs },
  times: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  delete: { marginTop: spacing.xl },
});
