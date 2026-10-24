import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserContext } from './auth.types.js';

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;
    return data ? user?.[data] : user;
  },
);
