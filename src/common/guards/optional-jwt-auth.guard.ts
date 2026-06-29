import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = super.canActivate(context);
      if (isObservable(result)) {
        return await firstValueFrom(result);
      }
      return await Promise.resolve(result);
    } catch {
      return true;
    }
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
