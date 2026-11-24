import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { container } from '@/data/container';
import type { Page } from '@/domain/shared/page';
import type { ScheduleInput, StudyTask, TaskInput, TaskStatus } from '@/domain/study/study';

import { queryKeys } from '../shared/query-keys';

const study = container.study;

export function useSchedules() {
  return useQuery({ queryKey: queryKeys.study.schedules, queryFn: () => study.listSchedules() });
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.study.schedule(id ?? ''),
    queryFn: () => study.getSchedule(id as string),
    enabled: !!id,
  });
}

export function useTasks(status: TaskStatus) {
  return useInfiniteQuery({
    queryKey: queryKeys.study.tasks(status),
    queryFn: ({ pageParam }) => study.listTasks(status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.study.task(id ?? ''), queryFn: () => study.getTask(id as string), enabled: !!id });
}

/** Setelah mutasi jadwal/tugas: muat ulang Kuliah dan Beranda. */
function useInvalidateStudy() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.study.all }),
      qc.invalidateQueries({ queryKey: queryKeys.home }),
    ]);
}

export function useSaveSchedule(id?: string) {
  const invalidate = useInvalidateStudy();
  return useMutation({
    mutationFn: (input: ScheduleInput) => (id ? study.updateSchedule(id, input) : study.createSchedule(input)),
    onSuccess: invalidate,
  });
}

export function useDeleteSchedule() {
  const invalidate = useInvalidateStudy();
  return useMutation({ mutationFn: (id: string) => study.deleteSchedule(id), onSuccess: invalidate });
}

export function useSaveTask(id?: string) {
  const invalidate = useInvalidateStudy();
  return useMutation({
    mutationFn: (input: TaskInput) => (id ? study.updateTask(id, input) : study.createTask(input)),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateStudy();
  return useMutation({ mutationFn: (id: string) => study.deleteTask(id), onSuccess: invalidate });
}

type TaskPages = InfiniteData<Page<StudyTask>, string | null>;

/** Centang tugas dengan pembaruan optimistis: baris keluar dari daftar, kembali jika gagal. */
export function useToggleTask(listStatus: TaskStatus) {
  const qc = useQueryClient();
  const invalidate = useInvalidateStudy();
  const key = queryKeys.study.tasks(listStatus);
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => study.setTaskStatus(id, status),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskPages>(key);
      if (previous) {
        qc.setQueryData<TaskPages>(key, {
          ...previous,
          pages: previous.pages.map((p) => ({ ...p, items: p.items.filter((t) => t.id !== id) })),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: invalidate,
  });
}
