import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StaffProfile,
  StaffProfileSchema,
} from './schemas/staff-profile.schema';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffProfile.name, schema: StaffProfileSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
