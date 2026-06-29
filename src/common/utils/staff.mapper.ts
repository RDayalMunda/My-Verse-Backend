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
    gender: profile.gender,
    heightCm: profile.heightCm,
    weightG: profile.weightG,
    likes: profile.likes,
    chestCm: profile.chestCm,
    waistCm: profile.waistCm,
    hipsCm: profile.hipsCm,
    cupSize: profile.cupSize,
    lengthLimpMm: profile.lengthLimpMm,
    lengthErectMm: profile.lengthErectMm,
    girthMm: profile.girthMm,
    loadCapacityMl: profile.loadCapacityMl,
    isProfileComplete: profile.isProfileComplete,
    createdAt: profile.createdAt?.toISOString(),
    updatedAt: profile.updatedAt?.toISOString(),
  };
}
