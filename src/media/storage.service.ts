import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { access, mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ImageFileMeta, VideoFileMeta } from '../common/schemas/file-meta.schema';
import { FileMetaDto } from '../common/dto/file-meta.dto';
import { ProjectImageMetaDto } from '../common/dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../common/dto/project-video-meta.dto';
import {
  ImageMedia,
  ImageMediaDocument,
} from './schemas/image-media.schema';

const PROFILE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/webm'];
const VIDEO_PATH_PREFIX = 'videos/';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly uploadsRoot = join(process.cwd(), '.uploads');
  private readonly videosDir = join(this.uploadsRoot, 'videos');

  constructor(
    @InjectModel(ImageMedia.name)
    private imageMediaModel: Model<ImageMediaDocument>,
  ) {}

  async onModuleInit() {
    await mkdir(this.videosDir, { recursive: true });
  }

  imageUrl(mediaId: string | Types.ObjectId): string {
    return `/api/v1/media/images/${mediaId.toString()}`;
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

  async saveProfileImage(file: Express.Multer.File): Promise<ImageFileMeta> {
    this.validateProfileImage(file);
    return this.saveImageToMongo(file);
  }

  async saveProjectImage(file: Express.Multer.File): Promise<ImageFileMeta> {
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
    return this.saveImageToMongo(file);
  }

  async saveProjectVideo(
    file: Express.Multer.File,
    durationSeconds: number,
  ): Promise<VideoFileMeta & { durationSeconds: number }> {
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
    const meta = await this.saveVideoToDisk(file);
    return { ...meta, durationSeconds };
  }

  async assertProfileFileMeta(meta: FileMetaDto): Promise<void> {
    await this.assertImageFileMeta(meta, PROFILE_MAX_BYTES, 'profilePicture');
  }

  async assertProjectImageMeta(meta: ProjectImageMetaDto): Promise<void> {
    await this.assertImageFileMeta(meta, IMAGE_MAX_BYTES, 'file');
  }

  async assertProjectVideoMeta(meta: ProjectVideoMetaDto): Promise<void> {
    await this.assertVideoFileMeta(meta);
  }

  async findImageMediaById(id: string): Promise<ImageMediaDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.imageMediaModel.findById(id).select('+data').exec();
  }

  async findImageMediaByIdOrFail(id: string): Promise<ImageMediaDocument> {
    const media = await this.findImageMediaById(id);
    if (!media) {
      throw new NotFoundException('Image not found');
    }
    return media;
  }

  private async saveImageToMongo(
    file: Express.Multer.File,
  ): Promise<ImageFileMeta> {
    const uploadedAt = new Date();
    const doc = await this.imageMediaModel.create({
      data: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt,
    });
    return {
      mediaId: doc._id,
      url: this.imageUrl(doc._id),
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt,
    };
  }

  private async assertImageFileMeta(
    meta: FileMetaDto | ProjectImageMetaDto,
    maxBytes: number,
    fieldPrefix: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(meta.mediaId)) {
      throw new BadRequestException(`Invalid ${fieldPrefix}.mediaId`);
    }
    if (!IMAGE_MIMES.includes(meta.mimeType)) {
      throw new BadRequestException(`Invalid ${fieldPrefix}.mimeType`);
    }
    if (meta.size > maxBytes) {
      throw new BadRequestException(`${fieldPrefix}.size exceeds limit`);
    }
    const expectedUrl = this.imageUrl(meta.mediaId);
    if (meta.url !== expectedUrl) {
      throw new BadRequestException(
        `${fieldPrefix}.url does not match ${fieldPrefix}.mediaId`,
      );
    }

    const stored = await this.imageMediaModel.findById(meta.mediaId).exec();
    if (!stored) {
      throw new BadRequestException(
        'Uploaded image not found. Upload first via media/upload endpoint',
      );
    }
    if (stored.mimeType !== meta.mimeType) {
      throw new BadRequestException(
        `${fieldPrefix}.mimeType does not match uploaded image`,
      );
    }
    if (stored.size !== meta.size) {
      throw new BadRequestException(
        `${fieldPrefix}.size does not match uploaded image`,
      );
    }
  }

  private async saveVideoToDisk(
    file: Express.Multer.File,
  ): Promise<VideoFileMeta> {
    const ext = this.extensionFromMime(file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `${VIDEO_PATH_PREFIX}${filename}`;
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

  private async assertVideoFileMeta(meta: ProjectVideoMetaDto): Promise<void> {
    if (!meta.path.startsWith(VIDEO_PATH_PREFIX)) {
      throw new BadRequestException(`file.path must be under ${VIDEO_PATH_PREFIX}`);
    }
    if (meta.path.includes('..') || meta.path.includes('\\')) {
      throw new BadRequestException('Invalid file.path');
    }
    if (!VIDEO_MIMES.includes(meta.mimeType)) {
      throw new BadRequestException('Invalid file.mimeType');
    }
    if (meta.size > VIDEO_MAX_BYTES) {
      throw new BadRequestException('file.size exceeds limit');
    }
    const expectedUrl = `/uploads/${meta.path}`;
    if (meta.url !== expectedUrl) {
      throw new BadRequestException('file.url does not match file.path');
    }
    if (!meta.filename || meta.path !== `${VIDEO_PATH_PREFIX}${meta.filename}`) {
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
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      default:
        return '';
    }
  }
}
