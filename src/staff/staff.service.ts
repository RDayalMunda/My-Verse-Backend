import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StaffProfile,
  StaffProfileDocument,
  computeProfileComplete,
} from './schemas/staff-profile.schema';
import {
  CreateStaffProfileDto,
  UpdateStaffProfileDto,
} from './dto/staff-profile.dto';
import { UsersService } from '../users/users.service';
import {
  extractStaffProfileBody,
  sanitizeGenderSpecificFields,
  validateStaffProfileBody,
} from './staff-profile.validation';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    private usersService: UsersService,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateStaffProfileDto,
  ): Promise<StaffProfileDocument> {
    const bodyErrors = validateStaffProfileBody(dto);
    if (bodyErrors.length) {
      throw new BadRequestException(bodyErrors[0]);
    }

    const user = await this.usersService.findByIdOrFail(userId);
    const bodyFields = sanitizeGenderSpecificFields(
      dto.gender,
      extractStaffProfileBody(dto),
    );
    const isProfileComplete = computeProfileComplete({
      stageName: dto.stageName,
      bio: dto.bio,
      hasProfilePicture: Boolean(user.profilePicture),
      ...bodyFields,
      gender: dto.gender,
    });
    const profile = new this.staffModel({
      userId,
      stageName: dto.stageName,
      bio: dto.bio,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      location: dto.location,
      skills: dto.skills ?? [],
      socialLinks: dto.socialLinks ?? [],
      ...bodyFields,
      gender: dto.gender,
      likes: dto.likes,
      isProfileComplete,
    });
    return profile.save();
  }

  async findByUserId(userId: string): Promise<StaffProfileDocument | null> {
    return this.staffModel.findOne({ userId }).exec();
  }

  async findById(id: string): Promise<StaffProfileDocument | null> {
    return this.staffModel.findById(id).exec();
  }

  async findByIdOrFail(id: string): Promise<StaffProfileDocument> {
    const profile = await this.findById(id);
    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }
    return profile;
  }

  async findAll(
    completeOnly = true,
    skip = 0,
    perPage = 20,
  ): Promise<{ profiles: StaffProfileDocument[]; total: number }> {
    const filter = completeOnly ? { isProfileComplete: true } : {};
    const [profiles, total] = await Promise.all([
      this.staffModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.staffModel.countDocuments(filter).exec(),
    ]);
    return { profiles, total };
  }

  async updateForUser(
    userId: string,
    dto: UpdateStaffProfileDto,
  ): Promise<StaffProfileDocument> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Staff profile not found');
    }
    const user = await this.usersService.findByIdOrFail(userId);

    const mergedGender = dto.gender ?? existing.gender;
    const mergedBody = sanitizeGenderSpecificFields(mergedGender, {
      gender: mergedGender,
      heightCm: dto.heightCm ?? existing.heightCm,
      weightG: dto.weightG ?? existing.weightG,
      likes: dto.likes ?? existing.likes,
      chestCm: dto.chestCm ?? existing.chestCm,
      waistCm: dto.waistCm ?? existing.waistCm,
      hipsCm: dto.hipsCm ?? existing.hipsCm,
      cupSize: dto.cupSize ?? existing.cupSize,
      lengthLimpMm: dto.lengthLimpMm ?? existing.lengthLimpMm,
      lengthErectMm: dto.lengthErectMm ?? existing.lengthErectMm,
      girthMm: dto.girthMm ?? existing.girthMm,
      loadCapacityMl: dto.loadCapacityMl ?? existing.loadCapacityMl,
    });

    const bodyErrors = validateStaffProfileBody(mergedBody);
    if (bodyErrors.length) {
      throw new BadRequestException(bodyErrors[0]);
    }

    const mergedStageName = dto.stageName ?? existing.stageName;
    const mergedBio = dto.bio ?? existing.bio;
    const isProfileComplete = computeProfileComplete({
      stageName: mergedStageName,
      bio: mergedBio,
      hasProfilePicture: Boolean(user.profilePicture),
      ...mergedBody,
      gender: mergedGender,
    });

    const updated = await this.staffModel
      .findOneAndUpdate(
        { userId },
        {
          ...(dto.stageName !== undefined ? { stageName: dto.stageName } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          ...(dto.location !== undefined ? { location: dto.location } : {}),
          ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
          ...(dto.socialLinks !== undefined
            ? { socialLinks: dto.socialLinks }
            : {}),
          ...(dto.dateOfBirth
            ? { dateOfBirth: new Date(dto.dateOfBirth) }
            : {}),
          gender: mergedGender,
          heightCm: mergedBody.heightCm,
          weightG: mergedBody.weightG,
          likes: mergedBody.likes ?? [],
          chestCm: mergedBody.chestCm,
          waistCm: mergedBody.waistCm,
          hipsCm: mergedBody.hipsCm,
          cupSize: mergedBody.cupSize,
          lengthLimpMm: mergedBody.lengthLimpMm,
          lengthErectMm: mergedBody.lengthErectMm,
          girthMm: mergedBody.girthMm,
          loadCapacityMl: mergedBody.loadCapacityMl,
          isProfileComplete,
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('Staff profile not found');
    }
    return updated;
  }

  async refreshProfileComplete(userId: string): Promise<void> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return;
    }
    const user = await this.usersService.findByIdOrFail(userId);
    await this.staffModel
      .updateOne(
        { userId },
        {
          isProfileComplete: computeProfileComplete({
            stageName: existing.stageName,
            bio: existing.bio,
            hasProfilePicture: Boolean(user.profilePicture),
            gender: existing.gender,
            heightCm: existing.heightCm,
            weightG: existing.weightG,
            likes: existing.likes,
            chestCm: existing.chestCm,
            waistCm: existing.waistCm,
            hipsCm: existing.hipsCm,
            cupSize: existing.cupSize,
            lengthLimpMm: existing.lengthLimpMm,
            lengthErectMm: existing.lengthErectMm,
            girthMm: existing.girthMm,
            loadCapacityMl: existing.loadCapacityMl,
          }),
        },
      )
      .exec();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.staffModel.deleteOne({ userId }).exec();
  }
}
