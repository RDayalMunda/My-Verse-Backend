import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { StorageService } from '../media/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { UserDocument } from './schemas/user.schema';
import { UpdateMeDto } from './dto/user.dto';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ListUsersQueryDto,
} from './dto/admin-user.dto';
import { toUserDto } from '../common/utils/user.mapper';
import { fileMetaDtoToDocument } from '../common/utils/file-meta.mapper';
import { StaffService } from '../staff/staff.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly staffService: StaffService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async list(@Query() query: ListUsersQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const { users, total } = await this.usersService.findAll(page, limit);
    return {
      data: users.map((u) => toUserDto(u)),
      meta: { page, limit, total },
    };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: AdminCreateUserDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot create ADMIN users via API');
    }
    if (dto.role === UserRole.STAFF) {
      if (!dto.staffProfile) {
        throw new BadRequestException(
          'staffProfile is required when creating STAFF users',
        );
      }
      if (!dto.profilePicture) {
        throw new BadRequestException(
          'profilePicture is required when creating STAFF users',
        );
      }
    }
    if (dto.profilePicture) {
      await this.storageService.assertProfileFileMeta(dto.profilePicture);
    }
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      displayName: dto.displayName,
      role: dto.role,
      profilePicture: dto.profilePicture
        ? fileMetaDtoToDocument(dto.profilePicture)
        : undefined,
    });
    if (dto.role === UserRole.STAFF && dto.staffProfile) {
      await this.staffService.createForUser(
        user._id.toString(),
        dto.staffProfile,
      );
    }
    const staffProfile =
      dto.role === UserRole.STAFF
        ? await this.staffService.findByUserId(user._id.toString())
        : undefined;
    return toUserDto(user, staffProfile ?? undefined);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: UserDocument, @Body() dto: UpdateMeDto) {
    const { profilePicture, ...rest } = dto;
    const updatePayload: Parameters<UsersService['update']>[1] = { ...rest };
    if (profilePicture) {
      await this.storageService.assertProfileFileMeta(profilePicture);
      updatePayload.profilePicture = fileMetaDtoToDocument(profilePicture);
    }
    const updated = await this.usersService.update(
      user._id.toString(),
      updatePayload,
    );
    if (updated.role === UserRole.STAFF) {
      await this.staffService.refreshProfileComplete(updated._id.toString());
    }
    const staffProfile =
      updated.role === UserRole.STAFF
        ? await this.staffService.findByUserId(updated._id.toString())
        : undefined;
    return toUserDto(updated, staffProfile ?? undefined);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot assign ADMIN role via API');
    }
    const { profilePicture, ...rest } = dto;
    const updatePayload: Parameters<UsersService['update']>[1] = { ...rest };
    if (profilePicture) {
      await this.storageService.assertProfileFileMeta(profilePicture);
      updatePayload.profilePicture = fileMetaDtoToDocument(profilePicture);
    }
    const updated = await this.usersService.update(id, updatePayload);
    if (updated.role === UserRole.STAFF) {
      await this.staffService.refreshProfileComplete(updated._id.toString());
    }
    const staffProfile =
      updated.role === UserRole.STAFF
        ? await this.staffService.findByUserId(updated._id.toString())
        : undefined;
    return toUserDto(updated, staffProfile ?? undefined);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    const user = await this.usersService.setActive(id, true);
    return toUserDto(user);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    const user = await this.usersService.setActive(id, false);
    return toUserDto(user);
  }
}
