import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { StaffService } from '../staff/staff.service';
import { StorageService } from '../media/storage.service';
import { UserRole } from '../common/enums/user-role.enum';
import { RegisterPublicDto } from '../users/dto/user.dto';
import { LoginDto, RegisterStaffDto } from './dto/auth.dto';
import { toUserDto } from '../common/utils/user.mapper';
import { fileMetaDtoToDocument } from '../common/utils/file-meta.mapper';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private staffService: StaffService,
    private jwtService: JwtService,
    private storageService: StorageService,
  ) {}

  async register(dto: RegisterPublicDto) {
    if (dto.profilePicture) {
      await this.storageService.assertProfileFileMeta(dto.profilePicture);
    }
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      displayName: dto.displayName,
      role: UserRole.PUBLIC,
      profilePicture: dto.profilePicture
        ? fileMetaDtoToDocument(dto.profilePicture)
        : undefined,
    });
    return this.buildAuthResponse(user);
  }

  async registerStaff(dto: RegisterStaffDto) {
    await this.storageService.assertProfileFileMeta(dto.profilePicture);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      displayName: dto.displayName,
      role: UserRole.STAFF,
      profilePicture: fileMetaDtoToDocument(dto.profilePicture),
    });
    try {
      const staffProfile = await this.staffService.createForUser(
        user._id.toString(),
        {
          stageName: dto.stageName,
          bio: dto.bio,
          location: dto.location,
          skills: dto.skills,
          dateOfBirth: dto.dateOfBirth,
          socialLinks: dto.socialLinks,
        },
      );
      return this.buildAuthResponse(user, staffProfile);
    } catch (error) {
      await this.usersService.deleteById(user._id.toString());
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.usersService.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account deactivated');
    }
    const staffProfile =
      user.role === UserRole.STAFF
        ? await this.staffService.findByUserId(user._id.toString())
        : undefined;
    return this.buildAuthResponse(user, staffProfile ?? undefined);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findByIdOrFail(userId);
    const staffProfile =
      user.role === UserRole.STAFF
        ? await this.staffService.findByUserId(user._id.toString())
        : undefined;
    return toUserDto(user, staffProfile ?? undefined);
  }

  private async buildAuthResponse(
    user: Awaited<ReturnType<UsersService['create']>>,
    staffProfile?: Awaited<ReturnType<StaffService['createForUser']>>,
  ) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: toUserDto(user, staffProfile),
    };
  }
}
