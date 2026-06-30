import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';
import { Public } from '../common/decorators/public.decorator';
import { toImageFileMetaDto } from '../common/utils/file-meta.mapper';
import { toVideoFileMetaDto } from '../common/utils/project-file-meta.mapper';

@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Get('images/:id')
  async getImage(
    @Param('id') id: string,
    @Query('format') format: string | undefined,
  ) {
    const media = await this.storageService.findImageMediaByIdOrFail(id);

    if (format === 'json') {
      return {
        id: media._id.toString(),
        mimeType: media.mimeType,
        size: media.size,
        uploadedAt: media.uploadedAt.toISOString(),
        url: this.storageService.imageUrl(media._id),
        base64: media.base64,
        dataUri: media.dataUri,
      };
    }

    return new StreamableFile(media.data, {
      type: media.mimeType,
      disposition: 'inline',
    });
  }

  @Public()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const meta = await this.storageService.saveProfileImage(file);
    return toImageFileMetaDto(meta);
  }

  @Public()
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const meta = await this.storageService.saveProjectImage(file);
    return toImageFileMetaDto(meta);
  }

  @Public()
  @Post('upload/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('durationSeconds') durationSeconds: string,
  ) {
    const duration = Number(durationSeconds);
    const meta = await this.storageService.saveProjectVideo(file, duration);
    return {
      ...toVideoFileMetaDto(meta),
      durationSeconds: meta.durationSeconds,
    };
  }
}
