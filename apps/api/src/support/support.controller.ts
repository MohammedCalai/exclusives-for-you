import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators';
import { CreateSupportMessageDto, CreateSupportThreadDto, UpdateSupportThreadDto } from './support.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}
  @Get('threads') async threads(@CurrentUser() user: { sub: string }) { return { data: await this.support.threads(user.sub) }; }
  @Post('threads') async create(@CurrentUser() user: { sub: string }, @Body() dto: CreateSupportThreadDto) { return { data: await this.support.createThread(user.sub, dto) }; }
  @Get('threads/:id') async thread(@CurrentUser() user: { sub: string; role: string }, @Param('id') id: string) { return { data: await this.support.thread(id, user.sub, user.role === 'ADMIN') }; }
  @Post('threads/:id/messages') async message(@CurrentUser() user: { sub: string; role: string }, @Param('id') id: string, @Body() dto: CreateSupportMessageDto) { return { data: await this.support.sendMessage(id, user.sub, user.role === 'ADMIN', dto) }; }
  @Roles('ADMIN') @Get('admin/threads') async adminThreads() { return { data: await this.support.adminThreads() }; }
  @Roles('ADMIN') @Patch('admin/threads/:id/status') async status(@Param('id') id: string, @Body() dto: UpdateSupportThreadDto) { return { data: await this.support.setStatus(id, dto.status) }; }
}
