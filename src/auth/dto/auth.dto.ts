import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RegisterPublicDto } from '../../users/dto/user.dto';
import { SocialLinkDto } from '../../staff/dto/staff-profile.dto';
import { FileMetaDto } from '../../common/dto/file-meta.dto';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterStaffDto extends RegisterPublicDto {
  @IsString()
  @IsNotEmpty()
  declare displayName: string;

  @IsString()
  @IsNotEmpty()
  stageName: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @IsDefined()
  @ValidateNested()
  @Type(() => FileMetaDto)
  declare profilePicture: FileMetaDto;
}
