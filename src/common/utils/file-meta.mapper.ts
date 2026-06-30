import { ImageFileMeta } from '../schemas/file-meta.schema';
import { FileMetaDto } from '../dto/file-meta.dto';
import { Types } from 'mongoose';

export function toImageFileMetaDto(meta: ImageFileMeta) {
  return {
    mediaId: meta.mediaId.toString(),
    url: meta.url,
    mimeType: meta.mimeType,
    size: meta.size,
    uploadedAt:
      meta.uploadedAt instanceof Date
        ? meta.uploadedAt.toISOString()
        : meta.uploadedAt,
  };
}

export function imageFileMetaDtoToDocument(dto: FileMetaDto): ImageFileMeta {
  return {
    mediaId: new Types.ObjectId(dto.mediaId),
    url: dto.url,
    mimeType: dto.mimeType,
    size: dto.size,
    uploadedAt: new Date(dto.uploadedAt),
  };
}

/** @deprecated Use toImageFileMetaDto */
export const toFileMetaDto = toImageFileMetaDto;

/** @deprecated Use imageFileMetaDtoToDocument */
export const fileMetaDtoToDocument = imageFileMetaDtoToDocument;
