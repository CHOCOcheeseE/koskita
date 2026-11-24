import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import type { components } from '../../contract/schema';
import { CurrentUser, Public } from '../../common/presentation/auth';
import { AuthUseCases } from '../domain/auth.use-cases';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';
import { toSessionResponse, toTokensResponse } from './auth.mapper';

type Schemas = components['schemas'];

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthUseCases) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ join: true })
  @Post('register')
  @HttpCode(201)
  async register(@Body() body: RegisterDto): Promise<Schemas['AuthSession']> {
    return toSessionResponse(await this.auth.register(body));
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ join: true })
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto): Promise<Schemas['AuthSession']> {
    return toSessionResponse(await this.auth.login(body));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshDto): Promise<Schemas['AuthTokens']> {
    return toTokensResponse(await this.auth.refresh(body.refreshToken));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() userId: string, @Body() body: RefreshDto): Promise<void> {
    await this.auth.logout(userId, body.refreshToken);
  }
}
