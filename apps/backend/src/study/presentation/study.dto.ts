import { Type } from 'class-transformer';
import { IsDefined, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { PageQueryDto } from '../../common/presentation/pagination.dto';
import { IsDateTime, isPresent, TIME_RE, Trim } from '../../common/presentation/validation';
import type { TaskStatus } from '../domain/rules';

const TIME_MESSAGE = (field: string) => ({ message: `${field} harus jam format HH:mm, contoh 08:00` });
const TASK_STATUSES: TaskStatus[] = ['belum', 'selesai'];

export class ScheduleInputDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  courseName: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsDefined()
  @IsString()
  @Matches(TIME_RE, TIME_MESSAGE('startTime'))
  startTime: string;

  @IsDefined()
  @IsString()
  @Matches(TIME_RE, TIME_MESSAGE('endTime'))
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  room?: string | null;
}

export class SchedulePatchDto {
  @ValidateIf(isPresent('courseName'))
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  courseName?: string;

  @ValidateIf(isPresent('dayOfWeek'))
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @ValidateIf(isPresent('startTime'))
  @IsString()
  @Matches(TIME_RE, TIME_MESSAGE('startTime'))
  startTime?: string;

  @ValidateIf(isPresent('endTime'))
  @IsString()
  @Matches(TIME_RE, TIME_MESSAGE('endTime'))
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  room?: string | null;
}

export class ListSchedulesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}

export class TaskInputDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string | null;

  @IsDefined()
  @IsDateTime()
  deadline: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string | null;
}

export class TaskPatchDto {
  @ValidateIf(isPresent('title'))
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string | null;

  @ValidateIf(isPresent('deadline'))
  @IsDateTime()
  deadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string | null;

  @ValidateIf(isPresent('status'))
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;
}

export class ListTasksQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;
}
