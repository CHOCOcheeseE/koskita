import type { Page } from '@/domain/shared/page';
import type {
  ClassSchedule,
  ScheduleInput,
  StudyRepository,
  StudyTask,
  TaskInput,
  TaskStatus,
} from '@/domain/study/study';

import type { ApiClient, Schemas } from '../api/client';

const toSchedule = (dto: Schemas['ClassSchedule']): ClassSchedule => dto;
const toTask = (dto: Schemas['StudyTask']): StudyTask => dto;
const enc = encodeURIComponent;

export class HttpStudyRepository implements StudyRepository {
  constructor(private readonly api: ApiClient) {}

  async listSchedules(): Promise<ClassSchedule[]> {
    const res = await this.api.request<{ items: Schemas['ClassSchedule'][] }>('GET', '/v1/study/schedules');
    return res.items.map(toSchedule);
  }

  async getSchedule(id: string): Promise<ClassSchedule> {
    return toSchedule(await this.api.request<Schemas['ClassSchedule']>('GET', `/v1/study/schedules/${enc(id)}`));
  }

  async createSchedule(input: ScheduleInput): Promise<ClassSchedule> {
    const body: Schemas['ScheduleInput'] = input;
    return toSchedule(await this.api.request<Schemas['ClassSchedule']>('POST', '/v1/study/schedules', { body }));
  }

  async updateSchedule(id: string, input: Partial<ScheduleInput>): Promise<ClassSchedule> {
    const body: Schemas['SchedulePatch'] = input;
    return toSchedule(
      await this.api.request<Schemas['ClassSchedule']>('PATCH', `/v1/study/schedules/${enc(id)}`, { body }),
    );
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.api.request<void>('DELETE', `/v1/study/schedules/${enc(id)}`);
  }

  async listTasks(status: TaskStatus, cursor?: string | null): Promise<Page<StudyTask>> {
    const res = await this.api.request<Schemas['TaskPage']>('GET', '/v1/study/tasks', {
      query: { status, cursor, limit: 20 },
    });
    return { items: res.items.map(toTask), nextCursor: res.nextCursor };
  }

  async getTask(id: string): Promise<StudyTask> {
    return toTask(await this.api.request<Schemas['StudyTask']>('GET', `/v1/study/tasks/${enc(id)}`));
  }

  async createTask(input: TaskInput): Promise<StudyTask> {
    const body: Schemas['TaskInput'] = input;
    return toTask(await this.api.request<Schemas['StudyTask']>('POST', '/v1/study/tasks', { body }));
  }

  async updateTask(id: string, patch: Partial<TaskInput> & { status?: TaskStatus }): Promise<StudyTask> {
    const body: Schemas['TaskPatch'] = patch;
    return toTask(await this.api.request<Schemas['StudyTask']>('PATCH', `/v1/study/tasks/${enc(id)}`, { body }));
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.request<void>('DELETE', `/v1/study/tasks/${enc(id)}`);
  }
}
