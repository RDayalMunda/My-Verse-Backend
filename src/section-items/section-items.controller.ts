import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SectionItemsService } from './section-items.service';
import { ProjectsService } from '../projects/projects.service';
import { SectionsService } from '../sections/sections.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import {
  CreateSectionItemDto,
  ReorderSectionItemsDto,
  UpdateSectionItemDto,
} from './dto/section-item.dto';
import { toSectionItemDto } from '../common/utils/project.mapper';

@Controller('projects/:projectId/sections/:sectionId/items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SectionItemsController {
  constructor(
    private readonly sectionItemsService: SectionItemsService,
    private readonly projectsService: ProjectsService,
    private readonly sectionsService: SectionsService,
  ) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateSectionItemDto,
  ) {
    const project = await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.findByIdForProject(projectId, sectionId);
    const item = await this.sectionItemsService.create(
      projectId,
      sectionId,
      project.type,
      dto,
    );
    return toSectionItemDto(item);
  }

  @Patch('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderSectionItemsDto,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.findByIdForProject(projectId, sectionId);
    await this.sectionItemsService.reorder(projectId, sectionId, dto.itemIds);
    return { reordered: true };
  }

  @Patch(':itemId')
  async update(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSectionItemDto,
  ) {
    const project = await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.findByIdForProject(projectId, sectionId);
    const item = await this.sectionItemsService.update(
      projectId,
      sectionId,
      itemId,
      project.type,
      dto,
    );
    return toSectionItemDto(item);
  }

  @Delete(':itemId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.findByIdForProject(projectId, sectionId);
    await this.sectionItemsService.delete(projectId, sectionId, itemId);
    return { deleted: true };
  }
}
