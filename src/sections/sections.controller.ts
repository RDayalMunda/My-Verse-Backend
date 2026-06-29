import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import {
  CreateSectionDto,
  ReorderSectionsDto,
  UpdateSectionDto,
} from './dto/section.dto';
import { toSectionDto } from '../common/utils/project.mapper';

@Controller('projects/:projectId/sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SectionsController {
  constructor(
    private readonly sectionsService: SectionsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSectionDto,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    const section = await this.sectionsService.create(projectId, dto);
    return toSectionDto(section);
  }

  @Patch('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderSectionsDto,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.reorder(projectId, dto.sectionIds);
    return { reordered: true };
  }

  @Patch(':sectionId')
  async update(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    const section = await this.sectionsService.update(
      projectId,
      sectionId,
      dto,
    );
    return toSectionDto(section);
  }

  @Delete(':sectionId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    await this.sectionsService.delete(projectId, sectionId);
    return { deleted: true };
  }

  @Post(':sectionId/publish')
  async publish(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    const section = await this.sectionsService.publish(projectId, sectionId);
    return toSectionDto(section);
  }

  @Post(':sectionId/unpublish')
  async unpublish(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.projectsService.findByIdOrFail(projectId);
    const section = await this.sectionsService.unpublish(projectId, sectionId);
    return toSectionDto(section);
  }
}
