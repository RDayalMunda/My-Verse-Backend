import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { access, mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { FileMeta } from '../common/schemas/file-meta.schema';
import { FileMetaDto } from '../common/dto/file-meta.dto';

const PROFILE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_PATH_PREFIX = 'profiles/';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly uploadsRoot = join(process.cwd(), '.uploads');
  private readonly profilesDir = join(this.uploadsRoot, 'profiles');

  async onModuleInit() {
    await mkdir(this.profilesDir, { recursive: true });
    await mkdir(join(this.uploadsRoot, 'images'), { recursive: true });
    await mkdir(join(this.uploadsRoot, 'videos'), { recursive: true });
  }

  validateProfileImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpeg, png, webp',
      );
    }
    if (file.size > PROFILE_MAX_BYTES) {
      throw new BadRequestException('File exceeds 5MB limit');
    }
  }

  async saveProfileImage(file: Express.Multer.File): Promise<FileMeta> {
    this.validateProfileImage(file);
    const ext = this.extensionFromMime(file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `${PROFILE_PATH_PREFIX}${filename}`;
    const absolutePath = join(this.uploadsRoot, relativePath);
    await writeFile(absolutePath, file.buffer);
    const uploadedAt = new Date();
    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt,
    };
  }

  async assertProfileFileMeta(meta: FileMetaDto): Promise<void> {
    if (!meta.path.startsWith(PROFILE_PATH_PREFIX)) {
      throw new BadRequestException(
        'profilePicture.path must be under profiles/',
      );
    }
    if (meta.path.includes('..') || meta.path.includes('\\')) {
      throw new BadRequestException('Invalid profilePicture.path');
    }
    if (!ALLOWED_MIMES.includes(meta.mimeType)) {
      throw new BadRequestException('Invalid profilePicture.mimeType');
    }
    if (meta.size > PROFILE_MAX_BYTES) {
      throw new BadRequestException('profilePicture.size exceeds 5MB limit');
    }
    const expectedUrl = `/uploads/${meta.path}`;
    if (meta.url !== expectedUrl) {
      throw new BadRequestException(
        'profilePicture.url does not match profilePicture.path',
      );
    }
    if (!meta.filename || meta.path !== `${PROFILE_PATH_PREFIX}${meta.filename}`) {
      throw new BadRequestException(
        'profilePicture.filename does not match profilePicture.path',
      );
    }

    const absolutePath = join(this.uploadsRoot, meta.path);
    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile()) {
        throw new BadRequestException('Uploaded file not found');
      }
      if (fileStat.size !== meta.size) {
        throw new BadRequestException(
          'profilePicture.size does not match uploaded file',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Uploaded file not found. Upload first via POST /media/upload',
      );
    }

    try {
      await access(absolutePath);
    } catch {
      throw new BadRequestException(
        'Uploaded file not found. Upload first via POST /media/upload',
      );
    }
  }

  private extensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '';
    }
  }
}
