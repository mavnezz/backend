import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../JwtPayload';

/**
 * Liefert den authentifizierten Nutzer (JWT-Payload) aus dem Request,
 * optional ein einzelnes Feld: `@CurrentUser('sub')`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    return field ? user?.[field] : user;
  },
);
