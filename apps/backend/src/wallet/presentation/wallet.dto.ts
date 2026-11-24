import { IsDefined, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PageQueryDto } from '../../common/presentation/pagination.dto';
import { IsCalendarDate, IsMonth, isPresent } from '../../common/presentation/validation';
import { Category, CATEGORY_CODES, TransactionType } from '../domain/categories';

const TYPES: TransactionType[] = ['income', 'expense'];
const MAX_RUPIAH = 100_000_000;

export class TransactionInputDto {
  @IsDefined()
  @IsIn(TYPES)
  type: TransactionType;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(MAX_RUPIAH)
  amount: number;

  @IsDefined()
  @IsIn(CATEGORY_CODES)
  category: Category;

  @IsDefined()
  @IsCalendarDate()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  note?: string | null;
}

export class TransactionPatchDto {
  @ValidateIf(isPresent('type'))
  @IsIn(TYPES)
  type?: TransactionType;

  @ValidateIf(isPresent('amount'))
  @IsInt()
  @Min(1)
  @Max(MAX_RUPIAH)
  amount?: number;

  @ValidateIf(isPresent('category'))
  @IsIn(CATEGORY_CODES)
  category?: Category;

  @ValidateIf(isPresent('date'))
  @IsCalendarDate()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  note?: string | null;
}

export class ListTransactionsQueryDto extends PageQueryDto {
  @IsDefined()
  @IsMonth()
  month: string;
}

export class MonthParamDto {
  @IsMonth()
  month: string;
}

export class BudgetInputDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(MAX_RUPIAH)
  amount: number;
}
