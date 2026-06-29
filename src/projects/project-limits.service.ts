import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SectionItem, SectionItemDocument } from '../section-items/schemas/section-item.schema';
import { SectionItemKind } from '../common/enums/section-item-kind.enum';
import { ProjectType } from '../common/enums/project-type.enum';

export const PROJECT_LIMITS = {
  maxTextChars: 5_000_000,
  maxImages: 120,
  maxImageBytes: 60 * 1024 * 1024,
  maxVideoBytes: 500 * 1024 * 1024,
  maxVideoSeconds: 7200,
  maxImagesPerPhotoshootSection: 120,
};

@Injectable()
export class ProjectLimitsService {
  constructor(
    @InjectModel(SectionItem.name)
    private sectionItemModel: Model<SectionItemDocument>,
  ) {}

  async validateProjectAggregate(projectId: string): Promise<void> {
    const items = await this.sectionItemModel.find({ projectId }).exec();
    let textChars = 0;
    let imageCount = 0;
    let imageBytes = 0;
    let videoBytes = 0;
    let videoSeconds = 0;

    for (const item of items) {
      if (item.kind === SectionItemKind.TEXT && item.textContent) {
        textChars += item.textContent.length;
      }
      if (item.kind === SectionItemKind.IMAGE && item.file) {
        imageCount += 1;
        imageBytes += item.file.size;
      }
      if (item.kind === SectionItemKind.VIDEO && item.file) {
        videoBytes += item.file.size;
        videoSeconds += item.durationSeconds ?? 0;
      }
    }

    if (textChars > PROJECT_LIMITS.maxTextChars) {
      throw new BadRequestException(
        `Project text exceeds ${PROJECT_LIMITS.maxTextChars} characters`,
      );
    }
    if (imageCount > PROJECT_LIMITS.maxImages) {
      throw new BadRequestException(
        `Project exceeds ${PROJECT_LIMITS.maxImages} images`,
      );
    }
    if (imageBytes > PROJECT_LIMITS.maxImageBytes) {
      throw new BadRequestException('Project image total exceeds 60MB');
    }
    if (videoBytes > PROJECT_LIMITS.maxVideoBytes) {
      throw new BadRequestException('Project video total exceeds 500MB');
    }
    if (videoSeconds > PROJECT_LIMITS.maxVideoSeconds) {
      throw new BadRequestException('Project video duration exceeds 120 minutes');
    }
  }

  async validateSectionItem(
    projectType: ProjectType,
    sectionId: string,
    kind: SectionItemKind,
    excludeItemId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { sectionId };
    if (excludeItemId) {
      filter._id = { $ne: excludeItemId };
    }
    const sectionItems = await this.sectionItemModel.find(filter).exec();
    const imageCount = sectionItems.filter(
      (i) => i.kind === SectionItemKind.IMAGE,
    ).length;
    const videoCount = sectionItems.filter(
      (i) => i.kind === SectionItemKind.VIDEO,
    ).length;

    if (projectType === ProjectType.PHOTOSHOOT) {
      if (kind !== SectionItemKind.IMAGE) {
        throw new BadRequestException(
          'Photoshoot sections only support IMAGE items',
        );
      }
      if (imageCount >= PROJECT_LIMITS.maxImagesPerPhotoshootSection) {
        throw new BadRequestException(
          `Section exceeds ${PROJECT_LIMITS.maxImagesPerPhotoshootSection} images`,
        );
      }
    }

    if (projectType === ProjectType.SHOW && kind === SectionItemKind.VIDEO) {
      if (videoCount >= 1) {
        throw new BadRequestException(
          'Show sections support at most one VIDEO item',
        );
      }
    }
  }
}
