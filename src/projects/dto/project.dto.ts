import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectType } from '../../common/enums/project-type.enum';
import { Visibility } from '../../common/enums/visibility.enum';

export class BookDetailsDto {
  @IsOptional()
  @IsString()
  summary?: string;
}

export class PhotoshootDetailsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class ShowDetailsDto {
  @IsOptional()
  @IsString()
  genre?: string;
}

export class CreateProjectDto {
  @IsEnum(ProjectType)
  type: ProjectType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookDetailsDto)
  bookDetails?: BookDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoshootDetailsDto)
  photoshootDetails?: PhotoshootDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShowDetailsDto)
  showDetails?: ShowDetailsDto;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookDetailsDto)
  bookDetails?: BookDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoshootDetailsDto)
  photoshootDetails?: PhotoshootDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShowDetailsDto)
  showDetails?: ShowDetailsDto;
}

export class UpdateProjectVisibilityDto {
  @IsEnum(Visibility)
  visibility: Visibility;
}

export class ListProjectsQueryDto {
  @IsOptional()
  type?: ProjectType;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
