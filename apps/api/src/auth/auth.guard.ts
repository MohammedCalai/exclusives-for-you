import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { IS_PUBLIC, ROLES } from '../common/auth.decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new UnauthorizedException('Authentication required');
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new UnauthorizedException('Authentication is not configured');
    try { request.user = await this.jwt.verifyAsync(token, { secret }); } catch { throw new UnauthorizedException('Session is invalid or expired'); }
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, [context.getHandler(), context.getClass()]);
    if (roles && !roles.includes(request.user.role)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
