import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { SectionItemKind } from '../../common/enums/section-item-kind.enum';
import {
  ImageFileMeta,
  VideoFileMeta,
} from '../../common/schemas/file-meta.schema';

export type SectionItemDocument = HydratedDocument<SectionItem>;

@Schema({ timestamps: true, collection: 'sectionitems' })
export class SectionItem {
  @Prop({ type: Types.ObjectId, ref: 'Section', required: true })
  sectionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, enum: SectionItemKind })
  kind: SectionItemKind;

  @Prop({ trim: true })
  label?: string;

  @Prop()
  textContent?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  file?: ImageFileMeta | VideoFileMeta;

  @Prop()
  durationSeconds?: number;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SectionItemSchema = SchemaFactory.createForClass(SectionItem);

SectionItemSchema.index({ sectionId: 1, sortOrder: 1 });
SectionItemSchema.index({ projectId: 1 });
