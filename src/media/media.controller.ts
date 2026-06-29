import {
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
}
