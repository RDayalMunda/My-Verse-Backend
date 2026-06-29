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
import { ProjectImageMetaDto } from '../common/dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../common/dto/project-video-meta.dto';

const PROFILE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/webm'];
const PROFILE_PATH_PREFIX = 'profiles/';
const IMAGE_PATH_PREFIX = 'images/';
const VIDEO_PATH_PREFIX = 'videos/';

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
    if (!IMAGE_MIMES.includes(file.mimetype)) {
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
    if (!IMAGE_MIMES.includes(meta.mimeType)) {
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

  async saveProjectImage(file: Express.Multer.File): Promise<FileMeta> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpeg, png, webp',
      );
    }
    if (file.size > IMAGE_MAX_BYTES) {
      throw new BadRequestException('File exceeds 10MB limit');
    }
    return this.saveFile(file, IMAGE_PATH_PREFIX);
  }

  async saveProjectVideo(
    file: Express.Multer.File,
    durationSeconds: number,
  ): Promise<FileMeta & { durationSeconds: number }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!VIDEO_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: mp4, webm');
    }
    if (file.size > VIDEO_MAX_BYTES) {
      throw new BadRequestException('File exceeds 500MB limit');
    }
    if (!durationSeconds || durationSeconds < 1) {
      throw new BadRequestException('durationSeconds is required');
    }
    const meta = await this.saveFile(file, VIDEO_PATH_PREFIX, file.mimetype);
    return { ...meta, durationSeconds };
  }

  async assertProjectImageMeta(meta: ProjectImageMetaDto): Promise<void> {
    await this.assertFileMeta(meta, IMAGE_PATH_PREFIX, IMAGE_MIMES, IMAGE_MAX_BYTES);
  }

  async assertProjectVideoMeta(meta: ProjectVideoMetaDto): Promise<void> {
    await this.assertFileMeta(meta, VIDEO_PATH_PREFIX, VIDEO_MIMES, VIDEO_MAX_BYTES);
  }

  private async saveFile(
    file: Express.Multer.File,
    prefix: string,
    mime?: string,
  ): Promise<FileMeta> {
    const ext = this.extensionFromMime(mime ?? file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `${prefix}${filename}`;
    const absolutePath = join(this.uploadsRoot, relativePath);
    await writeFile(absolutePath, file.buffer);
    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  private async assertFileMeta(
    meta: { path: string; url: string; filename: string; mimeType: string; size: number },
    pathPrefix: string,
    allowedMimes: string[],
    maxBytes: number,
  ): Promise<void> {
    if (!meta.path.startsWith(pathPrefix)) {
      throw new BadRequestException(`file.path must be under ${pathPrefix}`);
    }
    if (meta.path.includes('..') || meta.path.includes('\\')) {
      throw new BadRequestException('Invalid file.path');
    }
    if (!allowedMimes.includes(meta.mimeType)) {
      throw new BadRequestException('Invalid file.mimeType');
    }
    if (meta.size > maxBytes) {
      throw new BadRequestException('file.size exceeds limit');
    }
    const expectedUrl = `/uploads/${meta.path}`;
    if (meta.url !== expectedUrl) {
      throw new BadRequestException('file.url does not match file.path');
    }
    if (!meta.filename || meta.path !== `${pathPrefix}${meta.filename}`) {
      throw new BadRequestException('file.filename does not match file.path');
    }
    const absolutePath = join(this.uploadsRoot, meta.path);
    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile() || fileStat.size !== meta.size) {
        throw new BadRequestException('Uploaded file not found or size mismatch');
      }
      await access(absolutePath);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'Uploaded file not found. Upload first via media/upload endpoint',
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
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      default:
        return '';
    }
  }
}
