import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { BookProject, BookProjectDocument } from './schemas/book-project.schema';
import {
  PhotoshootProject,
  PhotoshootProjectDocument,
} from './schemas/photoshoot-project.schema';
import { ShowProject, ShowProjectDocument } from './schemas/show-project.schema';
import { ProjectType } from '../common/enums/project-type.enum';
import { ProjectStatus } from '../common/enums/project-status.enum';
import { Visibility } from '../common/enums/visibility.enum';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectLimitsService } from './project-limits.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(BookProject.name)
    private bookProjectModel: Model<BookProjectDocument>,
    @InjectModel(PhotoshootProject.name)
    private photoshootProjectModel: Model<PhotoshootProjectDocument>,
    @InjectModel(ShowProject.name)
    private showProjectModel: Model<ShowProjectDocument>,
    private projectLimitsService: ProjectLimitsService,
  ) {}

  slugify(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateProjectDto, adminUserId: string): Promise<ProjectDocument> {
    const slug = dto.slug?.toLowerCase() ?? this.slugify(dto.title);
    try {
      const project = await this.projectModel.create({
        type: dto.type,
        title: dto.title,
        slug,
        description: dto.description,
        visibility: dto.visibility ?? Visibility.PUBLIC,
        isAdult: dto.isAdult ?? false,
        status: ProjectStatus.DRAFT,
        createdBy: adminUserId,
      });
      await this.createTypeExtension(project._id.toString(), dto);
      return project;
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Slug already taken');
      }
      throw error;
    }
  }

  private async createTypeExtension(
    projectId: string,
    dto: CreateProjectDto,
  ): Promise<void> {
    switch (dto.type) {
      case ProjectType.BOOK:
        await this.bookProjectModel.create({
          projectId,
          summary: dto.bookDetails?.summary,
        });
        break;
      case ProjectType.PHOTOSHOOT:
        await this.photoshootProjectModel.create({
          projectId,
          theme: dto.photoshootDetails?.theme,
          location: dto.photoshootDetails?.location,
        });
        break;
      case ProjectType.SHOW:
        await this.showProjectModel.create({
          projectId,
          genre: dto.showDetails?.genre,
        });
        break;
    }
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    return this.projectModel.findById(id).exec();
  }

  async findByIdOrFail(id: string): Promise<ProjectDocument> {
    const project = await this.findById(id);
    if (!project || project.status === ProjectStatus.DELETED) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async findAll(
    filter: { type?: ProjectType; status?: ProjectStatus | { $ne: ProjectStatus } },
    skip = 0,
    perPage = 20,
  ) {
    const query = { ...filter, status: filter.status ?? { $ne: ProjectStatus.DELETED } };
    const [projects, total] = await Promise.all([
      this.projectModel
        .find(query)
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 })
        .exec(),
      this.projectModel.countDocuments(query).exec(),
    ]);
    return { projects, total };
  }

  async getTypeDetails(project: ProjectDocument) {
    switch (project.type) {
      case ProjectType.BOOK:
        return this.bookProjectModel.findOne({ projectId: project._id }).exec();
      case ProjectType.PHOTOSHOOT:
        return this.photoshootProjectModel.findOne({ projectId: project._id }).exec();
      case ProjectType.SHOW:
        return this.showProjectModel.findOne({ projectId: project._id }).exec();
    }
  }

  async update(projectId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel
        .findByIdAndUpdate(
          projectId,
          {
            ...(dto.title ? { title: dto.title } : {}),
            ...(dto.slug ? { slug: dto.slug.toLowerCase() } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.visibility ? { visibility: dto.visibility } : {}),
            ...(dto.isAdult !== undefined ? { isAdult: dto.isAdult } : {}),
          },
          { new: true },
        )
        .exec();
      if (!project) throw new NotFoundException('Project not found');
      await this.updateTypeExtension(project, dto);
      return project;
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Slug already taken');
      }
      throw error;
    }
  }

  private async updateTypeExtension(
    project: ProjectDocument,
    dto: UpdateProjectDto,
  ) {
    switch (project.type) {
      case ProjectType.BOOK:
        if (dto.bookDetails) {
          await this.bookProjectModel
            .updateOne({ projectId: project._id }, dto.bookDetails)
            .exec();
        }
        break;
      case ProjectType.PHOTOSHOOT:
        if (dto.photoshootDetails) {
          await this.photoshootProjectModel
            .updateOne({ projectId: project._id }, dto.photoshootDetails)
            .exec();
        }
        break;
      case ProjectType.SHOW:
        if (dto.showDetails) {
          await this.showProjectModel
            .updateOne({ projectId: project._id }, dto.showDetails)
            .exec();
        }
        break;
    }
  }

  async softDelete(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findByIdAndUpdate(projectId, { status: ProjectStatus.DELETED }, { new: true })
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async publish(projectId: string): Promise<ProjectDocument> {
    await this.projectLimitsService.validateProjectAggregate(projectId);
    const project = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { status: ProjectStatus.PUBLISHED, publishedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async unpublish(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { status: ProjectStatus.UNPUBLISHED },
        { new: true },
      )
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateVisibility(
    projectId: string,
    visibility: Visibility,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findByIdAndUpdate(projectId, { visibility }, { new: true })
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
