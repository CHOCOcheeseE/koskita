import { deadlineBadge, type StudyTask } from '@/domain/study/study';
import { dateWibOf, timeWibOf } from '@/domain/shared/wib';
import { formatShortDate } from '@/shared/format';
import { StatusBadge } from '@/shared/ui/feedback';

/** Lencana deadline: "Terlambat" / "Hari ini" / "Besok", atau null (tampil tanggal saja). */
export function TaskDeadlineBadge({ task, today }: { task: StudyTask; today: string }) {
  const badge = deadlineBadge(task, today);
  if (badge === 'overdue') return <StatusBadge kind="overdue" label="Terlambat" />;
  if (badge === 'today') return <StatusBadge kind="due_soon" label="Hari ini" />;
  if (badge === 'tomorrow') return <StatusBadge kind="due_soon" label="Besok" />;
  if (badge === 'soon') return <StatusBadge kind="due_soon" label="Segera" />;
  return null;
}

export function deadlineText(task: StudyTask): string {
  return `${formatShortDate(dateWibOf(task.deadline))} ${timeWibOf(task.deadline)}`;
}

/** Label baris tugas untuk pembaca layar. */
export function taskSpeech(task: StudyTask, today: string): string {
  const badge = deadlineBadge(task, today);
  const when =
    badge === 'overdue'
      ? 'terlambat'
      : badge === 'today'
        ? `deadline hari ini jam ${timeWibOf(task.deadline)}`
        : badge === 'tomorrow'
          ? `deadline besok jam ${timeWibOf(task.deadline)}`
          : `deadline ${deadlineText(task)}`;
  const course = task.courseName ? `, ${task.courseName}` : '';
  return `${task.title}${course}, ${when}, ${task.status === 'selesai' ? 'selesai' : 'belum selesai'}`;
}
