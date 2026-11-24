import { Body, Controller, Get, HttpCode, Patch } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import type { components } from '../../contract/schema';
import { CurrentUser } from '../../common/presentation/auth';
import { assertHasFields, isPresent, Trim, TrimToNull } from '../../common/presentation/validation';
import { toUserResponse } from '../../auth/presentation/auth.mapper';
import { ProfileUseCases } from '../domain/profile.use-cases';

export class UpdateProfileDto {
  @ValidateIf(isPresent('name'))
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(80)
  campus?: string | null;
}

@Controller('me')
export class ProfileController {
  constructor(private readonly profile: ProfileUseCases) {}

  @Get()
  async getMyProfile(@CurrentUser() userId: string): Promise<components['schemas']['User']> {
    return toUserResponse(await this.profile.get(userId));
  }

  @Patch()
  @HttpCode(200)
  async updateMyProfile(
    @CurrentUser() userId: string,
    @Body() body: UpdateProfileDto,
  ): Promise<components['schemas']['User']> {
    assertHasFields(body);
    return toUserResponse(await this.profile.update(userId, body));
  }
}
