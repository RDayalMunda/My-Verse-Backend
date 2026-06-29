import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Section, SectionDocument } from './schemas/section.schema';
import { SectionStatus } from '../common/enums/section-status.enum';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
  ) {}

  async create(
    projectId: string,
    dto: CreateSectionDto,
  ): Promise<SectionDocument> {
    const maxOrder = await this.sectionModel
      .findOne({ projectId })
      .sort({ sortOrder: -1 })
      .exec();
    const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;
    const section = new this.sectionModel({
      projectId,
      label: dto.label,
      description: dto.description,
      sortOrder,
      status: SectionStatus.DRAFT,
    });
    return section.save();
  }

  async findByProject(
    projectId: string,
    publishedOnly = false,
  ): Promise<SectionDocument[]> {
    const filter: Record<string, unknown> = { projectId };
    if (publishedOnly) {
      filter.status = SectionStatus.PUBLISHED;
    }
    return this.sectionModel.find(filter).sort({ sortOrder: 1 }).exec();
  }

  async findById(sectionId: string): Promise<SectionDocument | null> {
    return this.sectionModel.findById(sectionId).exec();
  }

  async findByIdOrFail(sectionId: string): Promise<SectionDocument> {
    const section = await this.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async findByIdForProject(
    projectId: string,
    sectionId: string,
  ): Promise<SectionDocument> {
    const section = await this.sectionModel
      .findOne({ _id: sectionId, projectId })
      .exec();
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async update(
    projectId: string,
    sectionId: string,
    dto: UpdateSectionDto,
  ): Promise<SectionDocument> {
    const section = await this.sectionModel
      .findOneAndUpdate({ _id: sectionId, projectId }, dto, { new: true })
      .exec();
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async delete(projectId: string, sectionId: string): Promise<void> {
    const result = await this.sectionModel
      .deleteOne({ _id: sectionId, projectId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Section not found');
    }
  }

  async reorder(projectId: string, sectionIds: string[]): Promise<void> {
    await Promise.all(
      sectionIds.map((id, index) =>
        this.sectionModel
          .updateOne({ _id: id, projectId }, { sortOrder: index })
          .exec(),
      ),
    );
  }

  async publish(projectId: string, sectionId: string): Promise<SectionDocument> {
    const section = await this.sectionModel
      .findOneAndUpdate(
        { _id: sectionId, projectId },
        { status: SectionStatus.PUBLISHED, publishedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async unpublish(
    projectId: string,
    sectionId: string,
  ): Promise<SectionDocument> {
    const section = await this.sectionModel
      .findOneAndUpdate(
        { _id: sectionId, projectId },
        { status: SectionStatus.UNPUBLISHED },
        { new: true },
      )
      .exec();
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }
}
