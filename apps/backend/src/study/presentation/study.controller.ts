import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { components } from '../../contract/schema';
import { CurrentUser, UuidParamPipe } from '../../common/presentation/auth';
import { DEFAULT_LIMIT } from '../../common/presentation/pagination.dto';
import { assertHasFields } from '../../common/presentation/validation';
import { StudyUseCases } from '../domain/study.use-cases';
import {
  ListSchedulesQueryDto,
  ListTasksQueryDto,
  ScheduleInputDto,
  SchedulePatchDto,
  TaskInputDto,
  TaskPatchDto,
} from './study.dto';
import { toScheduleResponse, toTaskResponse } from './study.mapper';

type Schemas = components['schemas'];

@Controller('study')
export class StudyController {
  constructor(private readonly study: StudyUseCases) {}

  @Get('schedules')
  async listSchedules(
    @CurrentUser() userId: string,
    @Query() query: ListSchedulesQueryDto,
  ): Promise<{ items: Schemas['ClassSchedule'][] }> {
    return { items: (await this.study.listSchedules(userId, query.dayOfWeek)).map(toScheduleResponse) };
  }

  @Post('schedules')
  @HttpCode(201)
  async createSchedule(@CurrentUser() userId: string, @Body() body: ScheduleInputDto): Promise<Schemas['ClassSchedule']> {
    return toScheduleResponse(await this.study.createSchedule(userId, body));
  }

  @Get('schedules/:scheduleId')
  async getSchedule(
    @CurrentUser() userId: string,
    @Param('scheduleId', UuidParamPipe) id: string,
  ): Promise<Schemas['ClassSchedule']> {
    return toScheduleResponse(await this.study.getSchedule(userId, id));
  }

  @Patch('schedules/:scheduleId')
  async updateSchedule(
    @CurrentUser() userId: string,
    @Param('scheduleId', UuidParamPipe) id: string,
    @Body() body: SchedulePatchDto,
  ): Promise<Schemas['ClassSchedule']> {
    assertHasFields(body);
    return toScheduleResponse(await this.study.updateSchedule(userId, id, body));
  }

  @Delete('schedules/:scheduleId')
  @HttpCode(204)
  async deleteSchedule(@CurrentUser() userId: string, @Param('scheduleId', UuidParamPipe) id: string): Promise<void> {
    await this.study.deleteSchedule(userId, id);
  }

  @Get('tasks')
  async listTasks(@CurrentUser() userId: string, @Query() query: ListTasksQueryDto): Promise<Schemas['TaskPage']> {
    const page = await this.study.listTasks(userId, query.status ?? 'belum', query.cursor, query.limit ?? DEFAULT_LIMIT);
    return { items: page.items.map(toTaskResponse), nextCursor: page.nextCursor };
  }

  @Post('tasks')
  @HttpCode(201)
  async createTask(@CurrentUser() userId: string, @Body() body: TaskInputDto): Promise<Schemas['StudyTask']> {
    return toTaskResponse(await this.study.createTask(userId, body));
  }

  @Get('tasks/:taskId')
  async getTask(@CurrentUser() userId: string, @Param('taskId', UuidParamPipe) id: string): Promise<Schemas['StudyTask']> {
    return toTaskResponse(await this.study.getTask(userId, id));
  }

  @Patch('tasks/:taskId')
  async updateTask(
    @CurrentUser() userId: string,
    @Param('taskId', UuidParamPipe) id: string,
    @Body() body: TaskPatchDto,
  ): Promise<Schemas['StudyTask']> {
    assertHasFields(body);
    return toTaskResponse(await this.study.updateTask(userId, id, body));
  }

  @Delete('tasks/:taskId')
  @HttpCode(204)
  async deleteTask(@CurrentUser() userId: string, @Param('taskId', UuidParamPipe) id: string): Promise<void> {
    await this.study.deleteTask(userId, id);
  }
}
