import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { Permission, roleHasPermission } from '../constants/permissions';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: UserDocument }>();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    const hasAll = requiredPermissions.every((p) =>
      roleHasPermission(user.role, p),
    );
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
