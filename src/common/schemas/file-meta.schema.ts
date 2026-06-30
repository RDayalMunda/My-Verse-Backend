import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class ImageFileMeta {
  @Prop({ type: Types.ObjectId, required: true })
  mediaId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  uploadedAt: Date;
}

export const ImageFileMetaSchema = SchemaFactory.createForClass(ImageFileMeta);

@Schema({ _id: false })
export class VideoFileMeta {
  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  uploadedAt: Date;
}

export const VideoFileMetaSchema = SchemaFactory.createForClass(VideoFileMeta);

/** @deprecated Use ImageFileMeta or VideoFileMeta */
export type FileMeta = ImageFileMeta | VideoFileMeta;
