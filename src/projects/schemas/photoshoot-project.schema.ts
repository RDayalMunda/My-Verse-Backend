import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PhotoshootProjectDocument = HydratedDocument<PhotoshootProject>;

@Schema({ timestamps: true, collection: 'photoshootprojects' })
export class PhotoshootProject {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, unique: true })
  projectId: Types.ObjectId;

  @Prop({ trim: true })
  theme?: string;

  @Prop({ trim: true })
  location?: string;
}

export const PhotoshootProjectSchema =
  SchemaFactory.createForClass(PhotoshootProject);
