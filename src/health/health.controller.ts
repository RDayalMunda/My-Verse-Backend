import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  @Public()
  check() {
    const dbState = this.connection.readyState;
    const database =
      dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
    };
  }
}
