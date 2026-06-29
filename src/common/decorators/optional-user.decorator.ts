import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../users/schemas/user.schema';

export const OptionalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserDocument }>();
    return request.user ?? null;
  },
);
