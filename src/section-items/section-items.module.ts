import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SectionItem,
  SectionItemSchema,
} from './schemas/section-item.schema';
import { SectionItemsService } from './section-items.service';
import { SectionItemsController } from './section-items.controller';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SectionItem.name, schema: SectionItemSchema },
    ]),
    MediaModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => SectionsModule),
  ],
  controllers: [SectionItemsController],
  providers: [SectionItemsService],
  exports: [SectionItemsService],
})
export class SectionItemsModule {}
