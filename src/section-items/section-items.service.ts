import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SectionItem,
  SectionItemDocument,
} from './schemas/section-item.schema';
import { SectionItemKind } from '../common/enums/section-item-kind.enum';
import { ProjectType } from '../common/enums/project-type.enum';
import { CreateSectionItemDto, UpdateSectionItemDto } from './dto/section-item.dto';
import { StorageService } from '../media/storage.service';
import { ProjectLimitsService } from '../projects/project-limits.service';
import { fileMetaDtoToDocument } from '../common/utils/project-file-meta.mapper';
import { ProjectImageMetaDto } from '../common/dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../common/dto/project-video-meta.dto';

@Injectable()
export class SectionItemsService {
  constructor(
    @InjectModel(SectionItem.name)
    private sectionItemModel: Model<SectionItemDocument>,
    private storageService: StorageService,
    private projectLimitsService: ProjectLimitsService,
  ) {}

  async create(
    projectId: string,
    sectionId: string,
    projectType: ProjectType,
    dto: CreateSectionItemDto,
  ): Promise<SectionItemDocument> {
    await this.validateItemDto(dto);
    await this.projectLimitsService.validateSectionItem(
      projectType,
      sectionId,
      dto.kind,
    );

    const maxOrder = await this.sectionItemModel
      .findOne({ sectionId })
      .sort({ sortOrder: -1 })
      .exec();
    const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

    const item = new this.sectionItemModel({
      projectId,
      sectionId,
      kind: dto.kind,
      label: dto.label,
      textContent: dto.kind === SectionItemKind.TEXT ? dto.textContent : undefined,
      file:
        dto.kind !== SectionItemKind.TEXT && dto.file
          ? fileMetaDtoToDocument(dto.file)
          : undefined,
      durationSeconds:
        dto.kind === SectionItemKind.VIDEO ? dto.durationSeconds : undefined,
      sortOrder,
    });
    const saved = await item.save();
    await this.projectLimitsService.validateProjectAggregate(projectId);
    return saved;
  }

  async findBySection(sectionId: string): Promise<SectionItemDocument[]> {
    return this.sectionItemModel
      .find({ sectionId })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findByIdForSection(
    projectId: string,
    sectionId: string,
    itemId: string,
  ): Promise<SectionItemDocument> {
    const item = await this.sectionItemModel
      .findOne({ _id: itemId, projectId, sectionId })
      .exec();
    if (!item) throw new NotFoundException('Section item not found');
    return item;
  }

  async update(
    projectId: string,
    sectionId: string,
    itemId: string,
    projectType: ProjectType,
    dto: UpdateSectionItemDto,
  ): Promise<SectionItemDocument> {
    const existing = await this.findByIdForSection(projectId, sectionId, itemId);
    if (dto.file) {
      if (existing.kind === SectionItemKind.IMAGE) {
        await this.storageService.assertProjectImageMeta(
          dto.file as ProjectImageMetaDto,
        );
      } else if (existing.kind === SectionItemKind.VIDEO) {
        await this.storageService.assertProjectVideoMeta({
          ...(dto.file as unknown as ProjectVideoMetaDto),
          durationSeconds: dto.durationSeconds ?? existing.durationSeconds ?? 1,
        });
      }
    }

    const item = await this.sectionItemModel
      .findOneAndUpdate(
        { _id: itemId, projectId, sectionId },
        {
          ...(dto.label !== undefined ? { label: dto.label } : {}),
          ...(dto.textContent !== undefined ? { textContent: dto.textContent } : {}),
          ...(dto.file ? { file: fileMetaDtoToDocument(dto.file) } : {}),
          ...(dto.durationSeconds !== undefined
            ? { durationSeconds: dto.durationSeconds }
            : {}),
        },
        { new: true },
      )
      .exec();
    if (!item) throw new NotFoundException('Section item not found');
    await this.projectLimitsService.validateProjectAggregate(projectId);
    return item;
  }

  async delete(
    projectId: string,
    sectionId: string,
    itemId: string,
  ): Promise<void> {
    const result = await this.sectionItemModel
      .deleteOne({ _id: itemId, projectId, sectionId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Section item not found');
    }
  }

  async reorder(
    projectId: string,
    sectionId: string,
    itemIds: string[],
  ): Promise<void> {
    await Promise.all(
      itemIds.map((id, index) =>
        this.sectionItemModel
          .updateOne({ _id: id, projectId, sectionId }, { sortOrder: index })
          .exec(),
      ),
    );
  }

  private async validateItemDto(dto: CreateSectionItemDto) {
    if (dto.kind === SectionItemKind.TEXT) {
      if (!dto.textContent?.trim()) {
        throw new BadRequestException('textContent is required for TEXT items');
      }
      return;
    }
    if (dto.kind === SectionItemKind.IMAGE) {
      if (!dto.file) {
        throw new BadRequestException('file is required for IMAGE items');
      }
      await this.storageService.assertProjectImageMeta(
        dto.file as ProjectImageMetaDto,
      );
      return;
    }
    if (dto.kind === SectionItemKind.VIDEO) {
      if (!dto.file) {
        throw new BadRequestException('file is required for VIDEO items');
      }
      if (!dto.durationSeconds) {
        throw new BadRequestException('durationSeconds is required for VIDEO items');
      }
      await this.storageService.assertProjectVideoMeta({
        ...(dto.file as unknown as ProjectVideoMetaDto),
        durationSeconds: dto.durationSeconds,
      });
    }
  }
}
