import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageMediaDocument = HydratedDocument<
  ImageMedia & { base64?: string; dataUri?: string }
>;

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

@Schema({ timestamps: false, collection: 'media' })
export class ImageMedia {
  @Prop({ required: true, select: false })
  data: Buffer;

  @Prop({ required: true, enum: IMAGE_MIMES })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  uploadedAt: Date;
}

export const ImageMediaSchema = SchemaFactory.createForClass(ImageMedia);

ImageMediaSchema.virtual('base64').get(function (this: ImageMediaDocument) {
  if (!this.data) {
    return undefined;
  }
  return this.data.toString('base64');
});

ImageMediaSchema.virtual('dataUri').get(function (this: ImageMediaDocument) {
  if (!this.data) {
    return undefined;
  }
  return `data:${this.mimeType};base64,${this.data.toString('base64')}`;
});

ImageMediaSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    const result = ret as unknown as Record<string, unknown>;
    delete result.data;
    return result;
  },
});

ImageMediaSchema.set('toObject', { virtuals: true });
