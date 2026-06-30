import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
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
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { toStaffProfileDto } from '../common/utils/staff.mapper';
import { toUserDto } from '../common/utils/user.mapper';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../common/utils/pagination';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Public()
  async list(@Query() query: ListStaffQueryDto) {
    const { page, perPage, skip } = resolvePagination(query);
    const { profiles, total } = await this.staffService.findAll(
      true,
      skip,
      perPage,
    );
    const userIds = profiles.map((p) => p.userId.toString());
    const users = await this.usersService.findByIds(userIds);
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    const data = profiles.map((profile) => {
      const user = usersById.get(profile.userId.toString());
      return {
        ...toStaffProfileDto(profile),
        user: user ? toUserDto(user) : undefined,
      };
    });

    return {
      data,
      meta: buildPaginationMeta(page, perPage, total),
    };
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
