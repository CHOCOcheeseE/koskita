import { Module } from '@nestjs/common';
import { CLOCK, Clock } from '../common/domain/clock';
import { PrismaScheduleRepository, PrismaTaskRepository } from './data/prisma-study.repositories';
import { SCHEDULE_REPOSITORY, ScheduleRepository, TASK_REPOSITORY, TaskRepository } from './domain/ports';
import { StudyUseCases } from './domain/study.use-cases';
import { StudyController } from './presentation/study.controller';

@Module({
  controllers: [StudyController],
  providers: [
    { provide: SCHEDULE_REPOSITORY, useClass: PrismaScheduleRepository },
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    {
      provide: StudyUseCases,
      inject: [SCHEDULE_REPOSITORY, TASK_REPOSITORY, CLOCK],
      useFactory: (s: ScheduleRepository, t: TaskRepository, clock: Clock) => new StudyUseCases(s, t, clock),
    },
  ],
  exports: [StudyUseCases],
})
export class StudyModule {}
