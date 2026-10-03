import { Controller, Get } from '@nestjs/common';
import { Public } from './common/auth.decorators';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { data: { status: 'ok', database: 'connected', checkedAt: new Date().toISOString() } };
  }
}
