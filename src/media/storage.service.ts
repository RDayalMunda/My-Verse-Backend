import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const PROFILE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

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

  async saveProfileImage(file: Express.Multer.File) {
    this.validateProfileImage(file);
    const ext = this.extensionFromMime(file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `profiles/${filename}`;
    const absolutePath = join(this.uploadsRoot, relativePath);
    await writeFile(absolutePath, file.buffer);
    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
    };
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
