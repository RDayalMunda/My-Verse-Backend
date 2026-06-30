import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { SectionsService } from '../sections/sections.service';
import { SectionItemsService } from '../section-items/section-items.service';
import { ProjectAccessService } from '../access/project-access.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ProjectStatus } from '../common/enums/project-status.enum';
import type { UserDocument } from '../users/schemas/user.schema';
import {
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateProjectDto,
  UpdateProjectVisibilityDto,
} from './dto/project.dto';
import {
  toProjectDto,
  toSectionDto,
  toSectionItemDto,
} from '../common/utils/project.mapper';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../common/utils/pagination';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly sectionsService: SectionsService,
    private readonly sectionItemsService: SectionItemsService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: UserDocument,
  ) {
    const project = await this.projectsService.create(dto, user._id.toString());
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }

  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @Query() query: ListProjectsQueryDto,
    @OptionalUser() user: UserDocument | null,
  ) {
    const { page, perPage, skip } = resolvePagination(query);
    const isAdmin = this.projectAccessService.canViewAdminList(user);

    const filter: {
      type?: typeof query.type;
      status?: ProjectStatus | { $ne: ProjectStatus };
    } = {};
    if (query.type) filter.type = query.type;
    if (isAdmin) {
      filter.status = { $ne: ProjectStatus.DELETED };
    } else {
      filter.status = ProjectStatus.PUBLISHED;
    }

    const { projects, total } = await this.projectsService.findAll(
      filter,
      skip,
      perPage,
    );

    const visible = isAdmin
      ? projects
      : projects.filter((p) =>
          this.projectAccessService.canViewProject(p, user),
        );

    const data = await Promise.all(
      visible.map(async (project) => {
        const typeDetails = await this.projectsService.getTypeDetails(project);
        return toProjectDto(project, typeDetails ?? undefined);
      }),
    );

    return {
      data,
      meta: buildPaginationMeta(
        page,
        perPage,
        isAdmin ? total : visible.length,
      ),
    };
  }

  @Get(':id')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(
    @Param('id') id: string,
    @OptionalUser() user: UserDocument | null,
  ) {
    const project = await this.projectsService.findByIdOrFail(id);
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && !this.projectAccessService.canViewProject(project, user)) {
      throw new NotFoundException('Project not found');
    }

    const typeDetails = await this.projectsService.getTypeDetails(project);
    const publishedOnly = !isAdmin;
    const sections = await this.sectionsService.findByProject(
      project._id.toString(),
      publishedOnly,
    );

    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const items = await this.sectionItemsService.findBySection(
          section._id.toString(),
        );
        return toSectionDto(
          section,
          items.map((item) => toSectionItemDto(item)),
        );
      }),
    );

    return toProjectDto(
      project,
      typeDetails ?? undefined,
      sectionsWithItems,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const project = await this.projectsService.update(id, dto);
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    const project = await this.projectsService.softDelete(id);
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async publish(@Param('id') id: string) {
    const project = await this.projectsService.publish(id);
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async unpublish(@Param('id') id: string) {
    const project = await this.projectsService.unpublish(id);
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }

  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateProjectVisibilityDto,
  ) {
    const project = await this.projectsService.updateVisibility(
      id,
      dto.visibility,
    );
    const typeDetails = await this.projectsService.getTypeDetails(project);
    return toProjectDto(project, typeDetails ?? undefined);
  }
}
