import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('me') async me(@CurrentUser() auth: any) { return { data: await this.prisma.user.findUnique({ where: { id: auth.sub }, select: { id: true, firstName: true, lastName: true, email: true, emailVerifiedAt: true, createdAt: true } }) }; }
  @Patch('me') async update(@CurrentUser() auth: any, @Body() dto: UpdateMeDto) { return { data: await this.prisma.user.update({ where: { id: auth.sub }, data: { ...dto, ...(dto.email ? { email: dto.email.toLowerCase(), emailVerifiedAt: null } : {}) }, select: { id: true, firstName: true, lastName: true, email: true, emailVerifiedAt: true } }) }; }
}
