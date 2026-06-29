import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

const PROFILE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PROFILE_MAX_BYTES = 5 * 1024 * 1024;

export class FileMetaDto {
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
  @IsIn([...PROFILE_MIMES])
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(PROFILE_MAX_BYTES)
  size: number;

  @IsDateString()
  uploadedAt: string;
}
