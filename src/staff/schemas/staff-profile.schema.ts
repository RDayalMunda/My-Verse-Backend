import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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

  @Prop({ required: true })
  profileImage: string;

  @Prop({ default: false })
  isProfileComplete: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StaffProfileSchema = SchemaFactory.createForClass(StaffProfile);

StaffProfileSchema.index({ userId: 1 }, { unique: true });
StaffProfileSchema.index({ isProfileComplete: 1 });

export function computeProfileComplete(profile: {
  profileImage?: string;
  stageName?: string;
  bio?: string;
}): boolean {
  return Boolean(
    profile.profileImage?.trim() &&
      profile.stageName?.trim() &&
      profile.bio?.trim(),
  );
}
