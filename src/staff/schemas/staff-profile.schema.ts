import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StaffGender } from '../../common/enums/staff-gender.enum';
import {
  StaffProfileBodyFields,
  validateStaffProfileBody,
} from '../staff-profile.validation';

export type StaffProfileDocument = HydratedDocument<StaffProfile>;

@Schema({ _id: false })
export class SocialLink {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  url: string;
}

const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);

@Schema({ timestamps: true, collection: 'staffprofiles' })
export class StaffProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ trim: true })
  stageName?: string;

  @Prop()
  bio?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ trim: true })
  location?: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [SocialLinkSchema], default: [] })
  socialLinks: SocialLink[];

  @Prop({ required: true, enum: StaffGender })
  gender: StaffGender;

  @Prop({ required: true })
  heightCm: number;

  @Prop({ required: true })
  weightG: number;

  @Prop({ type: [String], required: true, default: [] })
  likes: string[];

  @Prop()
  chestCm?: number;

  @Prop()
  waistCm?: number;

  @Prop()
  hipsCm?: number;

  @Prop({ trim: true, maxlength: 4 })
  cupSize?: string;

  @Prop()
  lengthLimpMm?: number;

  @Prop()
  lengthErectMm?: number;

  @Prop()
  girthMm?: number;

  @Prop()
  loadCapacityMl?: number;

  @Prop({ default: false })
  isProfileComplete: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StaffProfileSchema = SchemaFactory.createForClass(StaffProfile);

StaffProfileSchema.index({ userId: 1 }, { unique: true });
StaffProfileSchema.index({ isProfileComplete: 1 });

export function computeProfileComplete(profile: {
  stageName?: string;
  bio?: string;
  hasProfilePicture?: boolean;
} & StaffProfileBodyFields): boolean {
  if (
    !profile.hasProfilePicture ||
    !profile.stageName?.trim() ||
    !profile.bio?.trim()
  ) {
    return false;
  }
  return validateStaffProfileBody(profile).length === 0;
}
