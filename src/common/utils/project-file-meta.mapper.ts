import {
  ImageFileMeta,
  VideoFileMeta,
} from '../schemas/file-meta.schema';
import { ProjectImageMetaDto } from '../dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../dto/project-video-meta.dto';
import { imageFileMetaDtoToDocument } from './file-meta.mapper';

export function projectImageMetaDtoToDocument(
  dto: ProjectImageMetaDto,
): ImageFileMeta {
  return imageFileMetaDtoToDocument(dto);
}

export function projectVideoMetaDtoToDocument(
  dto: ProjectVideoMetaDto,
): VideoFileMeta {
  return {
    path: dto.path,
    url: dto.url,
    filename: dto.filename,
    mimeType: dto.mimeType,
    size: dto.size,
    uploadedAt: new Date(dto.uploadedAt),
  };
}

export function toVideoFileMetaDto(meta: VideoFileMeta) {
  return {
    path: meta.path,
    url: meta.url,
    filename: meta.filename,
    mimeType: meta.mimeType,
    size: meta.size,
    uploadedAt:
      meta.uploadedAt instanceof Date
        ? meta.uploadedAt.toISOString()
        : meta.uploadedAt,
  };
}

export function fileMetaDtoToDocument(
  dto: ProjectImageMetaDto | ProjectVideoMetaDto,
): ImageFileMeta | VideoFileMeta {
  if ('mediaId' in dto) {
    return projectImageMetaDtoToDocument(dto);
  }
  return projectVideoMetaDtoToDocument(dto);
}
