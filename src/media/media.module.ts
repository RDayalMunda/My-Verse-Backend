import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageMedia, ImageMediaSchema } from './schemas/image-media.schema';
import { StorageService } from './storage.service';
import { MediaController } from './media.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageMedia.name, schema: ImageMediaSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [StorageService],
  exports: [StorageService],
})
export class MediaModule {}
