import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators';
import { CreateAdminNotificationDto, RegisterPushTokenDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Post('push-token') async register(@CurrentUser() user: { sub: string }, @Body() dto: RegisterPushTokenDto) { return { data: await this.notifications.registerToken(user.sub, dto) }; }
  @Roles('ADMIN') @Post('admin/send') async send(@Body() dto: CreateAdminNotificationDto) { return { data: await this.notifications.sendAdminNotification(dto) }; }
}
