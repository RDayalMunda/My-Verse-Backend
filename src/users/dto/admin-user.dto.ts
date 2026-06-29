import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { Visibility } from '../../common/enums/visibility.enum';
import { FileMetaDto } from '../../common/dto/file-meta.dto';

export class StaffProfileInputDto {
  @IsOptional()
  @IsString()
  stageName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => FileMetaDto)
  profilePicture?: FileMetaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StaffProfileInputDto)
  staffProfile?: StaffProfileInputDto;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

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

export class ListUsersQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
