import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateStaffProfileDto,
  ): Promise<StaffProfileDocument> {
    const isProfileComplete = computeProfileComplete(dto);
    const profile = new this.staffModel({
      userId,
      stageName: dto.stageName,
      bio: dto.bio,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      location: dto.location,
      skills: dto.skills ?? [],
      socialLinks: dto.socialLinks ?? [],
      profileImage: dto.profileImage,
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

  async findAll(completeOnly = true): Promise<StaffProfileDocument[]> {
    const filter = completeOnly ? { isProfileComplete: true } : {};
    return this.staffModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateForUser(
    userId: string,
    dto: UpdateStaffProfileDto,
  ): Promise<StaffProfileDocument> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Staff profile not found');
    }
    const merged = {
      profileImage: dto.profileImage ?? existing.profileImage,
      stageName: dto.stageName ?? existing.stageName,
      bio: dto.bio ?? existing.bio,
    };
    const updated = await this.staffModel
      .findOneAndUpdate(
        { userId },
        {
          ...dto,
          ...(dto.dateOfBirth
            ? { dateOfBirth: new Date(dto.dateOfBirth) }
            : {}),
          isProfileComplete: computeProfileComplete(merged),
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('Staff profile not found');
    }
    return updated;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.staffModel.deleteOne({ userId }).exec();
  }
}
