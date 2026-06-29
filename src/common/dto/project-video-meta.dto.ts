import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

const VIDEO_MIMES = ['video/mp4', 'video/webm'] as const;
const SINGLE_VIDEO_MAX_BYTES = 500 * 1024 * 1024;

export class ProjectVideoMetaDto {
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
  @IsIn([...VIDEO_MIMES])
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(SINGLE_VIDEO_MAX_BYTES)
  size: number;

  @IsDateString()
  uploadedAt: string;

  @IsInt()
  @Min(1)
  @Max(7200)
  durationSeconds: number;
}
