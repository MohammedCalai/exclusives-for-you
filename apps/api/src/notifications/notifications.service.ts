import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminNotificationDto, RegisterPushTokenDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.pushToken.upsert({ where: { token: dto.token }, update: { userId, platform: dto.platform }, create: { userId, token: dto.token, platform: dto.platform } });
  }

  async sendAdminNotification(dto: CreateAdminNotificationDto) {
    const where = dto.audience && dto.audience !== 'all' ? { userId: dto.audience } : undefined;
    const tokens = await this.prisma.pushToken.findMany({ ...(where ? { where } : {}), select: { token: true } });
    const messages = tokens.map(({ token }) => ({ to: token, sound: 'default', title: dto.title, body: dto.body, data: { deeplink: dto.deeplink ?? '/(tabs)/shop' } }));
    if (!messages.length) return { sent: 0, message: 'No registered devices yet' };
    const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages) });
    if (!response.ok) { this.logger.error(`Expo notification request failed: ${response.status}`); throw new Error('Notification provider unavailable'); }
    return { sent: messages.length };
  }
}
