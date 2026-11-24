import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../common/presentation/pagination.dto';
import { isPresent, Trim } from '../../common/presentation/validation';
import type { BillStatus, SplitMethod } from '../domain/ports';

const MAX_RUPIAH = 100_000_000;

export class CreateGroupDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  name: string;
}

export class JoinGroupDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  inviteCode: string;
}

export class ShareInputDto {
  @IsDefined()
  @IsUUID()
  userId: string;

  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(MAX_RUPIAH)
  amount: number;
}

export class CreateBillDto {
  @IsDefined()
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  title: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(MAX_RUPIAH)
  totalAmount: number;

  @ValidateIf(isPresent('payerId'))
  @IsUUID()
  payerId?: string;

  @IsDefined()
  @IsIn(['equal', 'manual'])
  splitMethod: SplitMethod;

  @ValidateIf(isPresent('participantIds'))
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  participantIds?: string[];

  @ValidateIf(isPresent('shares'))
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ShareInputDto)
  shares?: ShareInputDto[];
}

export class ListBillsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(['open', 'settled'])
  status?: BillStatus;
}
