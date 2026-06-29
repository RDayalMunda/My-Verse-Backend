import { UserDocument } from '../../users/schemas/user.schema';
import { StaffProfileDocument } from '../../staff/schemas/staff-profile.schema';
import { toStaffProfileDto } from './staff.mapper';

export function toUserDto(user: UserDocument, staffProfile?: StaffProfileDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    nsfwEnabled: user.nsfwEnabled,
    defaultVisibility: user.defaultVisibility,
    staffProfile: staffProfile ? toStaffProfileDto(staffProfile) : undefined,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}
