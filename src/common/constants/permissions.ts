import { UserRole } from '../enums/user-role.enum';

export const Permission = {
  USERS_MANAGE: 'users:manage',
  USERS_READ_SELF: 'users:read:self',
  USERS_UPDATE_SELF: 'users:update:self',
  STAFF_READ: 'staff:read',
  STAFF_UPDATE_SELF: 'staff:update:self',
  POSTS_CRUD: 'posts:crud',
  POSTS_PUBLISH: 'posts:publish',
  POSTS_READ: 'posts:read',
  CAST_RESPOND: 'cast:respond',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.STAFF]: [
    Permission.USERS_READ_SELF,
    Permission.USERS_UPDATE_SELF,
    Permission.STAFF_READ,
    Permission.STAFF_UPDATE_SELF,
    Permission.POSTS_READ,
    Permission.CAST_RESPOND,
  ],
  [UserRole.PUBLIC]: [
    Permission.USERS_READ_SELF,
    Permission.USERS_UPDATE_SELF,
    Permission.STAFF_READ,
    Permission.POSTS_READ,
  ],
};

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
