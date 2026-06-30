import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SectionItemKind } from '../../common/enums/section-item-kind.enum';
import { ProjectImageMetaDto } from '../../common/dto/project-image-meta.dto';
import { ProjectVideoMetaDto } from '../../common/dto/project-video-meta.dto';

export class CreateSectionItemDto {
  @IsEnum(SectionItemKind)
  kind: SectionItemKind;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @ValidateNested()
  file?: ProjectImageMetaDto | ProjectVideoMetaDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}

export class UpdateSectionItemDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @ValidateNested()
  file?: ProjectImageMetaDto | ProjectVideoMetaDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}

export class ReorderSectionItemsDto {
  @IsString({ each: true })
  itemIds: string[];
}

// For video items, validate with ProjectVideoMetaDto in service when kind is VIDEO
export { ProjectVideoMetaDto };
