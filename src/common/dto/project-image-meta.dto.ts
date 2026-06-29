import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const SINGLE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export class ProjectImageMetaDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsIn([...IMAGE_MIMES])
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(SINGLE_IMAGE_MAX_BYTES)
  size: number;

  @IsDateString()
  uploadedAt: string;
}
