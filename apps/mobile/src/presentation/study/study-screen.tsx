import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { clock } from '@/data/container';
import { isoDayOfWeekWib, todayWib } from '@/domain/shared/wib';
import { conflictText, schedulesOfDay, type StudyTask, type TaskStatus } from '@/domain/study/study';
import { DAY_NAMES, DAY_SHORT } from '@/shared/format';
import { spacing } from '@/shared/theme/tokens';
import { Fab } from '@/shared/ui/button';
import { EmptyState, ErrorPanel, ScreenSkeleton, useToast } from '@/shared/ui/feedback';
import { ChipGroup, Segmented } from '@/shared/ui/fields';
import { Gap, Screen } from '@/shared/ui/layout';
import { ListRow, TaskCheckbox } from '@/shared/ui/misc';
import { Txt } from '@/shared/ui/text';

import { errorMessage } from '../shared/error-messages';
import { useSchedules, useTasks, useToggleTask } from './hooks';
import { deadlineText, TaskDeadlineBadge, taskSpeech } from './task-badge';

type Segment = 'jadwal' | 'tugas';

// Segmen terakhir diingat selama aplikasi terbuka.
let lastSegment: Segment = 'jadwal';
let lastTaskStatus: TaskStatus = 'belum';

/** K1 · Kuliah (Jadwal / Tugas) */
export function StudyScreen() {
  const params = useLocalSearchParams<{ segmen?: string }>();
  const requested: Segment | null = params.segmen === 'jadwal' || params.segmen === 'tugas' ? params.segmen : null;
  const [segment, setSegment] = useState<Segment>(requested ?? lastSegment);
  const [seenRequest, setSeenRequest] = useState(requested);

  // Dibuka dari Beranda dengan ?segmen=…: ikuti permintaan itu.
  if (requested !== seenRequest) {
    setSeenRequest(requested);
    if (requested) setSegment(requested);
  }

  useEffect(() => {
    lastSegment = segment;
  }, [segment]);

  return segment === 'jadwal' ? (
    <ScheduleView segment={segment} onSegment={setSegment} />
  ) : (
    <TaskView segment={segment} onSegment={setSegment} />
  );
}

function Top({ segment, onSegment }: { segment: Segment; onSegment: (s: Segment) => void }) {
  return (
    <>
      <Txt variant="title" accessibilityRole="header" style={styles.title}>
        Kuliah
      </Txt>
      <Segmented<Segment>
        accessibilityLabel="Jadwal atau tugas"
        value={segment}
        onChange={onSegment}
        options={[
          { value: 'jadwal', label: 'Jadwal' },
          { value: 'tugas', label: 'Tugas' },
        ]}
      />
      <Gap />
    </>
  );
}

function ScheduleView({ segment, onSegment }: { segment: Segment; onSegment: (s: Segment) => void }) {
  const schedules = useSchedules();
  const [day, setDay] = useState(() => isoDayOfWeekWib(clock.now()));
  const items = schedulesOfDay(schedules.data ?? [], day);

  return (
    <Screen
      testID="screen-kuliah-jadwal"
      refreshing={schedules.isRefetching}
      onRefresh={() => schedules.refetch()}
      floating={<Fab label="+ Jadwal" onPress={() => router.push({ pathname: '/jadwal/baru', params: { hari: String(day) } })} />}
    >
      <Top segment={segment} onSegment={onSegment} />
      {schedules.isPending ? (
        <ScreenSkeleton label="jadwal" rows={5} />
      ) : schedules.isError ? (
        <ErrorPanel message={errorMessage(schedules.error)} onRetry={() => schedules.refetch()} />
      ) : schedules.data.length === 0 ? (
        <EmptyState
          message="Masukkan jadwal kuliahmu sekali, nanti kelas hari ini muncul di Beranda."
          actionLabel="+ Jadwal"
          onAction={() => router.push({ pathname: '/jadwal/baru', params: { hari: String(day) } })}
        />
      ) : (
        <>
          <ChipGroup
            compact
            accessibilityLabel="Pilih hari"
            value={day}
            onChange={setDay}
            options={DAY_SHORT.map((d, i) => ({ value: i + 1, label: d, accessibilityLabel: DAY_NAMES[i] }))}
          />
          <Gap />
          {items.length === 0 ? (
            <EmptyState message={`Tidak ada kelas di hari ${DAY_NAMES[day - 1]}.`} />
          ) : (
            items.map((s) => {
              const conflict = conflictText(s);
              return (
                <ListRow
                  key={s.id}
                  title={`${s.startTime}–${s.endTime}  ${s.courseName}`}
                  subtitle={s.room ?? undefined}
                  below={
                    conflict ? (
                      <Txt variant="label" color="statusPending">
                        ⚠ {conflict}
                      </Txt>
                    ) : undefined
                  }
                  onPress={() => router.push({ pathname: '/jadwal/[id]', params: { id: s.id } })}
                  accessibilityLabel={`${s.courseName}, jam ${s.startTime} sampai ${s.endTime}${s.room ? `, ruang ${s.room}` : ''}${conflict ? `, ${conflict}` : ''}. Ketuk untuk ubah`}
                />
              );
            })
          )}
        </>
      )}
    </Screen>
  );
}

function TaskView({ segment, onSegment }: { segment: Segment; onSegment: (s: Segment) => void }) {
  const [status, setStatus] = useState<TaskStatus>(lastTaskStatus);
  useEffect(() => {
    lastTaskStatus = status;
  }, [status]);
  const tasks = useTasks(status);
  const toggle = useToggleTask(status);
  const toast = useToast();
  const today = todayWib(clock.now());
  const items = tasks.data?.pages.flatMap((p) => p.items) ?? [];

  const onToggle = (task: StudyTask) =>
    toggle.mutate(
      { id: task.id, status: task.status === 'belum' ? 'selesai' : 'belum' },
      { onError: () => toast.show('Gagal menandai tugas, coba lagi') },
    );

  return (
    <Screen
      testID="screen-kuliah-tugas"
      refreshing={tasks.isRefetching}
      onRefresh={() => tasks.refetch()}
      onEndReached={() => tasks.hasNextPage && !tasks.isFetchingNextPage && tasks.fetchNextPage()}
      floating={<Fab label="+ Tugas" onPress={() => router.push('/tugas/baru')} />}
    >
      <Top segment={segment} onSegment={onSegment} />
      <Segmented<TaskStatus>
        accessibilityLabel="Status tugas"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'belum', label: 'Belum' },
          { value: 'selesai', label: 'Selesai' },
        ]}
      />
      <Gap />
      {tasks.isPending ? (
        <ScreenSkeleton label="tugas" rows={5} />
      ) : tasks.isError ? (
        <ErrorPanel message={errorMessage(tasks.error)} onRetry={() => tasks.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          message={status === 'belum' ? 'Tidak ada tugas yang menunggu. Mantap.' : 'Tugas yang kamu centang muncul di sini.'}
        />
      ) : (
        items.map((t) => (
          <View key={t.id} style={styles.taskRow}>
            <TaskCheckbox
              checked={t.status === 'selesai'}
              onPress={() => onToggle(t)}
              label={`${t.status === 'selesai' ? 'Kembalikan ke belum' : 'Tandai selesai'}: ${t.title}`}
            />
            <View style={styles.flex}>
              <ListRow
                title={t.title}
                subtitle={`${t.courseName ? `${t.courseName} · ` : ''}${deadlineText(t)}`}
                below={
                  t.status === 'belum' ? (
                    <View style={styles.badge}>
                      <TaskDeadlineBadge task={t} today={today} />
                    </View>
                  ) : undefined
                }
                onPress={() => router.push({ pathname: '/tugas/[id]', params: { id: t.id } })}
                accessibilityLabel={`${taskSpeech(t, today)}. Ketuk untuk ubah`}
              />
            </View>
          </View>
        ))
      )}
      {tasks.isFetchingNextPage ? (
        <Txt variant="label" color="inkMuted" style={styles.center}>
          Memuat…
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: spacing.md, marginBottom: spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  badge: { marginTop: spacing.xs },
  center: { textAlign: 'center', marginTop: spacing.md },
});
