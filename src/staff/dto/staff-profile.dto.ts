import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StaffGender } from '../../common/enums/staff-gender.enum';
import { StaffProfileBodyConstraint } from '../validators/staff-profile-body.validator';

export class SocialLinkDto {
  @IsString()
  platform: string;

  @IsUrl()
  url: string;
}

export class StaffProfileBodyDto {
  @IsEnum(StaffGender)
  gender: StaffGender;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  heightCm: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  weightG: number;

  @IsArray()
  @IsString({ each: true })
  likes: string[];

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.FEMALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chestCm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.FEMALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  waistCm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.FEMALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hipsCm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.FEMALE)
  @IsString()
  @Length(4, 4)
  cupSize?: string;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.MALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lengthLimpMm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.MALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lengthErectMm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.MALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  girthMm?: number;

  @ValidateIf((o: StaffProfileBodyDto) => o.gender === StaffGender.MALE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loadCapacityMl?: number;
}

export class UpdateStaffProfileBodyDto {
  @IsOptional()
  @IsEnum(StaffGender)
  gender?: StaffGender;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weightG?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  likes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chestCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  waistCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hipsCm?: number;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  cupSize?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lengthLimpMm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lengthErectMm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  girthMm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loadCapacityMl?: number;
}

export class UpdateStaffProfileDto extends UpdateStaffProfileBodyDto {
  @IsOptional()
  @IsString()
  stageName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}

export class CreateStaffProfileDto extends StaffProfileBodyDto {
  @Validate(StaffProfileBodyConstraint)
  private readonly _staffProfileBodyCheck?: undefined;

  @IsOptional()
  @IsString()
  stageName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
