import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { UsersService } from '../users/users.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { UserDocument } from '../users/schemas/user.schema';
import { UpdateStaffProfileDto } from './dto/staff-profile.dto';
import { toStaffProfileDto } from '../common/utils/staff.mapper';
import { toUserDto } from '../common/utils/user.mapper';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Public()
  async list() {
    const profiles = await this.staffService.findAll(true);
    const result = await Promise.all(
      profiles.map(async (profile) => {
        const user = await this.usersService.findById(
          profile.userId.toString(),
        );
        return {
          ...toStaffProfileDto(profile),
          user: user ? toUserDto(user) : undefined,
        };
      }),
    );
    return result;
  }

  @Get(':id')
  @Public()
  async getOne(@Param('id') id: string) {
    const profile = await this.staffService.findByIdOrFail(id);
    const user = await this.usersService.findById(profile.userId.toString());
    return {
      ...toStaffProfileDto(profile),
      user: user ? toUserDto(user) : undefined,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  async updateMe(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    const profile = await this.staffService.updateForUser(
      user._id.toString(),
      dto,
    );
    return toStaffProfileDto(profile);
  }
}
