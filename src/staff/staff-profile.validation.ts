import { StaffGender } from '../common/enums/staff-gender.enum';

export interface StaffProfileBodyFields {
  gender?: StaffGender;
  heightCm?: number;
  weightG?: number;
  likes?: string[];
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  cupSize?: string;
  lengthLimpMm?: number;
  lengthErectMm?: number;
  girthMm?: number;
  loadCapacityMl?: number;
}

export function validateStaffProfileBody(
  profile: StaffProfileBodyFields,
): string[] {
  const errors: string[] = [];

  if (!profile.gender) {
    errors.push('gender is required');
    return errors;
  }

  if (profile.heightCm == null || profile.heightCm < 1) {
    errors.push('heightCm is required and must be at least 1');
  }
  if (profile.weightG == null || profile.weightG < 1) {
    errors.push('weightG is required and must be at least 1');
  }
  if (!Array.isArray(profile.likes)) {
    errors.push('likes is required and must be an array of strings');
  }

  if (profile.gender === StaffGender.FEMALE) {
    if (profile.chestCm == null || profile.chestCm < 1) {
      errors.push('chestCm is required for female profiles');
    }
    if (profile.waistCm == null || profile.waistCm < 1) {
      errors.push('waistCm is required for female profiles');
    }
    if (profile.hipsCm == null || profile.hipsCm < 1) {
      errors.push('hipsCm is required for female profiles');
    }
    if (
      !profile.cupSize ||
      profile.cupSize.length < 1 ||
      profile.cupSize.length > 4
    ) {
      errors.push(
        'cupSize is required for female profiles (1 to 4 characters)',
      );
    }
  }

  if (profile.gender === StaffGender.MALE) {
    if (profile.lengthLimpMm == null || profile.lengthLimpMm < 1) {
      errors.push('lengthLimpMm is required for male profiles');
    }
    if (profile.lengthErectMm == null || profile.lengthErectMm < 1) {
      errors.push('lengthErectMm is required for male profiles');
    }
    if (profile.girthMm == null || profile.girthMm < 1) {
      errors.push('girthMm is required for male profiles');
    }
    if (profile.loadCapacityMl == null || profile.loadCapacityMl < 1) {
      errors.push('loadCapacityMl is required for male profiles');
    }
  }

  return errors;
}

export function sanitizeGenderSpecificFields(
  gender: StaffGender,
  fields: StaffProfileBodyFields,
): StaffProfileBodyFields {
  const base = { ...fields, gender };
  if (gender === StaffGender.MALE) {
    return {
      ...base,
      chestCm: undefined,
      waistCm: undefined,
      hipsCm: undefined,
      cupSize: undefined,
    };
  }
  if (gender === StaffGender.FEMALE) {
    return {
      ...base,
      lengthLimpMm: undefined,
      lengthErectMm: undefined,
      girthMm: undefined,
      loadCapacityMl: undefined,
    };
  }
  return {
    ...base,
    chestCm: undefined,
    waistCm: undefined,
    hipsCm: undefined,
    cupSize: undefined,
    lengthLimpMm: undefined,
    lengthErectMm: undefined,
    girthMm: undefined,
    loadCapacityMl: undefined,
  };
}

export function extractStaffProfileBody(
  source: StaffProfileBodyFields,
): StaffProfileBodyFields {
  return {
    gender: source.gender,
    heightCm: source.heightCm,
    weightG: source.weightG,
    likes: source.likes,
    chestCm: source.chestCm,
    waistCm: source.waistCm,
    hipsCm: source.hipsCm,
    cupSize: source.cupSize,
    lengthLimpMm: source.lengthLimpMm,
    lengthErectMm: source.lengthErectMm,
    girthMm: source.girthMm,
    loadCapacityMl: source.loadCapacityMl,
  };
}
