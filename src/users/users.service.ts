import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/enums/user-role.enum';
import { ImageFileMeta } from '../common/schemas/file-meta.schema';

const BCRYPT_ROUNDS = 12;

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  role: UserRole;
  nsfwEnabled?: boolean;
  defaultVisibility?: string;
  profilePicture?: ImageFileMeta;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    try {
      const passwordHash = await this.hashPassword(input.password);
      const user = new this.userModel({
        email: input.email.toLowerCase(),
        username: input.username,
        passwordHash,
        displayName: input.displayName,
        profilePicture: input.profilePicture,
        role: input.role,
        nsfwEnabled: input.nsfwEnabled ?? false,
        defaultVisibility: input.defaultVisibility,
      });
      return user.save();
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email or username already taken');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIds(ids: string[]): Promise<UserDocument[]> {
    if (!ids.length) {
      return [];
    }
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  async findAll(
    skip = 0,
    perPage = 20,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);
    return { users, total };
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      username: string;
      displayName: string;
      role: UserRole;
      nsfwEnabled: boolean;
      defaultVisibility: string;
      profilePicture: ImageFileMeta;
    }>,
  ): Promise<UserDocument> {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            ...data,
            ...(data.email ? { email: data.email.toLowerCase() } : {}),
          },
          { new: true },
        )
        .exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email or username already taken');
      }
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteById(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async existsByRole(role: UserRole): Promise<boolean> {
    const count = await this.userModel.countDocuments({ role }).exec();
    return count > 0;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
