import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';
import { Public } from '../common/decorators/public.decorator';
import { toFileMetaDto } from '../common/utils/file-meta.mapper';

@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

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
    return toFileMetaDto(meta);
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
    return toFileMetaDto(meta);
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
      ...toFileMetaDto(meta),
      durationSeconds: meta.durationSeconds,
    };
  }
}
