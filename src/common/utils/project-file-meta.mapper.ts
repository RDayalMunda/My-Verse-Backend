import { FileMeta } from '../schemas/file-meta.schema';
import { ProjectImageMetaDto } from '../dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../dto/project-video-meta.dto';

export function fileMetaDtoToDocument(
  dto: ProjectImageMetaDto | ProjectVideoMetaDto,
): FileMeta {
  return {
    path: dto.path,
    url: dto.url,
    filename: dto.filename,
    mimeType: dto.mimeType,
    size: dto.size,
    uploadedAt: new Date(dto.uploadedAt),
  };
}
