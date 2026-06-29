import { FileMeta } from '../schemas/file-meta.schema';
import { FileMetaDto } from '../dto/file-meta.dto';

export function toFileMetaDto(meta: FileMeta) {
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

export function fileMetaDtoToDocument(dto: FileMetaDto): FileMeta {
  return {
    path: dto.path,
    url: dto.url,
    filename: dto.filename,
    mimeType: dto.mimeType,
    size: dto.size,
    uploadedAt: new Date(dto.uploadedAt),
  };
}
