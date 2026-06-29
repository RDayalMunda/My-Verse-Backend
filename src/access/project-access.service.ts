import { Injectable } from '@nestjs/common';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/user-role.enum';
import { Visibility } from '../common/enums/visibility.enum';
import { ProjectStatus } from '../common/enums/project-status.enum';

@Injectable()
export class ProjectAccessService {
  canViewProject(
    project: ProjectDocument,
    user?: UserDocument | null,
  ): boolean {
    if (user?.role === UserRole.ADMIN) {
      return true;
    }
    if (project.status !== ProjectStatus.PUBLISHED) {
      return false;
    }
    if (project.isAdult) {
      if (!user || !user.nsfwEnabled) {
        return false;
      }
    }
    switch (project.visibility) {
      case Visibility.PUBLIC:
        return true;
      case Visibility.AUTHENTICATED:
        return Boolean(user);
      case Visibility.STAFF_ONLY:
        return user?.role === UserRole.STAFF;
      case Visibility.PRIVATE:
        return false;
      default:
        return false;
    }
  }

  canViewAdminList(user?: UserDocument | null): boolean {
    return user?.role === UserRole.ADMIN;
  }
}
