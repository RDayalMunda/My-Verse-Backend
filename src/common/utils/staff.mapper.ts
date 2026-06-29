import { StaffProfileDocument } from '../../staff/schemas/staff-profile.schema';

export function toStaffProfileDto(profile: StaffProfileDocument) {
  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    stageName: profile.stageName,
    bio: profile.bio,
    dateOfBirth: profile.dateOfBirth?.toISOString(),
    location: profile.location,
    skills: profile.skills,
    socialLinks: profile.socialLinks,
    profileImage: profile.profileImage,
    isProfileComplete: profile.isProfileComplete,
    createdAt: profile.createdAt?.toISOString(),
    updatedAt: profile.updatedAt?.toISOString(),
  };
}
