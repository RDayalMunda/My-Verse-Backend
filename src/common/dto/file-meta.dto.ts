import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

const PROFILE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PROFILE_MAX_BYTES = 5 * 1024 * 1024;

export class FileMetaDto {
  @IsMongoId()
  mediaId: string;

  @IsString()
  @IsNotEmpty()
  url: string;

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
