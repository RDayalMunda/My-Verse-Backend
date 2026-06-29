import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Visibility } from '../../common/enums/visibility.enum';
import { FileMetaDto } from '../../common/dto/file-meta.dto';

export class RegisterPublicDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username may only contain letters, numbers, and underscores',
  })
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FileMetaDto)
  profilePicture?: FileMetaDto;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  nsfwEnabled?: boolean;

  @IsOptional()
  @IsEnum(Visibility)
  defaultVisibility?: Visibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => FileMetaDto)
  profilePicture?: FileMetaDto;
}

// Backward alias for internal imports
export { RegisterPublicDto as RegisterDto };
