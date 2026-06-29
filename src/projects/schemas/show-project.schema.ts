import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShowProjectDocument = HydratedDocument<ShowProject>;

@Schema({ timestamps: true, collection: 'showprojects' })
export class ShowProject {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, unique: true })
  projectId: Types.ObjectId;

  @Prop({ trim: true })
  genre?: string;
}

export const ShowProjectSchema = SchemaFactory.createForClass(ShowProject);
