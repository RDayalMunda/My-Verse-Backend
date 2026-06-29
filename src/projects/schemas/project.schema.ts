import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProjectType } from '../../common/enums/project-type.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { Visibility } from '../../common/enums/visibility.enum';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ required: true, enum: ProjectType })
  type: ProjectType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Prop({ required: true, enum: Visibility, default: Visibility.PUBLIC })
  visibility: Visibility;

  @Prop({ default: false })
  isAdult: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  publishedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ slug: 1 }, { unique: true });
ProjectSchema.index({ type: 1, status: 1 });
ProjectSchema.index({ status: 1, visibility: 1 });
