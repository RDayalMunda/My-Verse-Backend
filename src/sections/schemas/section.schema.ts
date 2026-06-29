import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SectionStatus } from '../../common/enums/section-status.enum';

export type SectionDocument = HydratedDocument<Section>;

@Schema({ timestamps: true, collection: 'sections' })
export class Section {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ required: true, enum: SectionStatus, default: SectionStatus.DRAFT })
  status: SectionStatus;

  @Prop()
  publishedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SectionSchema = SchemaFactory.createForClass(Section);

SectionSchema.index({ projectId: 1, sortOrder: 1 });
SectionSchema.index({ projectId: 1, status: 1 });
