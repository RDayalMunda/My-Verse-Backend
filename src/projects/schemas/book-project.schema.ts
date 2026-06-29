import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookProjectDocument = HydratedDocument<BookProject>;

@Schema({ timestamps: true, collection: 'bookprojects' })
export class BookProject {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, unique: true })
  projectId: Types.ObjectId;

  @Prop()
  summary?: string;
}

export const BookProjectSchema = SchemaFactory.createForClass(BookProject);
