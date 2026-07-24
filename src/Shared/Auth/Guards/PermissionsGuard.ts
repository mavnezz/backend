import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../Decorators/RequirePermission';
import { JwtPayload } from '../JwtPayload';

/**
 * Globaler Guard: prüft die per `@RequirePermission(...)` geforderten
 * Permissions gegen die im JWT aufgelösten Permissions des Nutzers.
 * Ohne Anforderung wird die Route durchgelassen.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as JwtPayload | undefined;
    const granted = new Set(user?.permissions ?? []);
    const hasAll = required.every((permission) => granted.has(permission));

    if (!hasAll) {
      throw new ForbiddenException('Missing required permission');
    }
    return true;
  }
}
