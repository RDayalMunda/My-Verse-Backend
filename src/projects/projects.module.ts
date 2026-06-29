import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { BookProject, BookProjectSchema } from './schemas/book-project.schema';
import {
  PhotoshootProject,
  PhotoshootProjectSchema,
} from './schemas/photoshoot-project.schema';
import { ShowProject, ShowProjectSchema } from './schemas/show-project.schema';
import {
  SectionItem,
  SectionItemSchema,
} from '../section-items/schemas/section-item.schema';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectLimitsService } from './project-limits.service';
import { AccessModule } from '../access/access.module';
import { SectionsModule } from '../sections/sections.module';
import { SectionItemsModule } from '../section-items/section-items.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: BookProject.name, schema: BookProjectSchema },
      { name: PhotoshootProject.name, schema: PhotoshootProjectSchema },
      { name: ShowProject.name, schema: ShowProjectSchema },
      { name: SectionItem.name, schema: SectionItemSchema },
    ]),
    AccessModule,
    forwardRef(() => SectionsModule),
    forwardRef(() => SectionItemsModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectLimitsService],
  exports: [ProjectsService, ProjectLimitsService],
})
export class ProjectsModule {}
