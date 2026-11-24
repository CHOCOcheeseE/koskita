import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  PipeTransform,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppError, notFound } from '../domain/app-error';
import { CLOCK, Clock } from '../domain/clock';

const IS_PUBLIC = 'isPublic';

/** Rute tanpa bearer token (`security: []` di kontrak). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

export interface AuthUser {
  id: string;
}

type AuthedRequest = Request & { user?: AuthUser };

/** Guard global: semua rute butuh access token JWT kecuali yang ditandai `@Public()`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Silakan masuk dulu');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; typ?: unknown }>(token, {
        clockTimestamp: Math.floor(this.clock.now().getTime() / 1000),
      });
      if (typeof payload.sub !== 'string' || payload.typ !== 'access') throw new Error('bad payload');
      req.user = { id: payload.sub };
      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Sesi habis, sedang diperbarui');
      }
      throw new AppError(401, 'UNAUTHENTICATED', 'Silakan masuk dulu');
    }
  }
}

/** ID pengguna yang sedang masuk. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Silakan masuk dulu');
  return req.user.id;
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Path param UUID. ID yang bentuknya salah pasti tidak ada, jadi dibalas 404 `NOT_FOUND`. */
@Injectable()
export class UuidParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID_RE.test(value)) throw notFound();
    return value.toLowerCase();
  }
}
