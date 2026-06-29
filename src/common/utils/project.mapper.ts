import { ProjectDocument } from '../../projects/schemas/project.schema';
import { BookProjectDocument } from '../../projects/schemas/book-project.schema';
import { PhotoshootProjectDocument } from '../../projects/schemas/photoshoot-project.schema';
import { ShowProjectDocument } from '../../projects/schemas/show-project.schema';
import { SectionDocument } from '../../sections/schemas/section.schema';
import { SectionItemDocument } from '../../section-items/schemas/section-item.schema';
import { toFileMetaDto } from './file-meta.mapper';

export function toProjectDto(
  project: ProjectDocument,
  typeDetails?: BookProjectDocument | PhotoshootProjectDocument | ShowProjectDocument,
  sections?: ReturnType<typeof toSectionDto>[],
) {
  return {
    id: project._id.toString(),
    type: project.type,
    title: project.title,
    slug: project.slug,
    description: project.description,
    status: project.status,
    visibility: project.visibility,
    isAdult: project.isAdult,
    createdBy: project.createdBy.toString(),
    publishedAt: project.publishedAt?.toISOString(),
    bookDetails:
      typeDetails && 'summary' in typeDetails
        ? { summary: typeDetails.summary }
        : undefined,
    photoshootDetails:
      typeDetails && 'theme' in typeDetails
        ? { theme: typeDetails.theme, location: typeDetails.location }
        : undefined,
    showDetails:
      typeDetails && 'genre' in typeDetails
        ? { genre: typeDetails.genre }
        : undefined,
    sections,
    createdAt: project.createdAt?.toISOString(),
    updatedAt: project.updatedAt?.toISOString(),
  };
}

export function toSectionDto(
  section: SectionDocument,
  items?: ReturnType<typeof toSectionItemDto>[],
) {
  return {
    id: section._id.toString(),
    projectId: section.projectId.toString(),
    label: section.label,
    description: section.description,
    sortOrder: section.sortOrder,
    status: section.status,
    publishedAt: section.publishedAt?.toISOString(),
    items,
    createdAt: section.createdAt?.toISOString(),
    updatedAt: section.updatedAt?.toISOString(),
  };
}

export function toSectionItemDto(item: SectionItemDocument) {
  return {
    id: item._id.toString(),
    sectionId: item.sectionId.toString(),
    projectId: item.projectId.toString(),
    kind: item.kind,
    label: item.label,
    textContent: item.textContent,
    file: item.file ? toFileMetaDto(item.file) : undefined,
    durationSeconds: item.durationSeconds,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}
