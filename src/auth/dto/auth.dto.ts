import {
  IsArray,
  IsDateString,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SocialLinkDto,
  StaffProfileBodyDto,
} from '../../staff/dto/staff-profile.dto';
import { StaffProfileBodyConstraint } from '../../staff/validators/staff-profile-body.validator';
import { FileMetaDto } from '../../common/dto/file-meta.dto';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterStaffDto extends StaffProfileBodyDto {
  @Validate(StaffProfileBodyConstraint)
  private readonly _staffProfileBodyCheck?: undefined;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => FileMetaDto)
  profilePicture: FileMetaDto;

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
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
