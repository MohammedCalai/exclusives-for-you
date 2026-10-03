import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportSenderType, SupportThreadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSupportMessageDto, CreateSupportThreadDto } from './support.dto';

const messageInclude = { sender: { select: { firstName: true, lastName: true, role: true } } } as const;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}
  async threads(userId: string) { return this.prisma.supportThread.findMany({ where: { userId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } }); }
  async adminThreads() { return this.prisma.supportThread.findMany({ include: { user: { select: { email: true, firstName: true, lastName: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } }); }
  async thread(id: string, userId: string, isAdmin: boolean) {
    const thread = await this.prisma.supportThread.findFirst({ where: isAdmin ? { id } : { id, userId }, include: { user: { select: { email: true, firstName: true, lastName: true } }, messages: { include: messageInclude, orderBy: { createdAt: 'asc' } } } });
    if (!thread) throw new NotFoundException('Support conversation not found');
    return thread;
  }
  async createThread(userId: string, dto: CreateSupportThreadDto) {
    return this.prisma.supportThread.create({ data: { userId, subject: dto.subject, messages: { create: { senderId: userId, senderType: SupportSenderType.CUSTOMER, body: dto.body } } }, include: { messages: { include: messageInclude } } });
  }
  async sendMessage(id: string, userId: string, isAdmin: boolean, dto: CreateSupportMessageDto) {
    const thread = await this.prisma.supportThread.findFirst({ where: isAdmin ? { id } : { id, userId } });
    if (!thread) throw new NotFoundException('Support conversation not found');
    if (!isAdmin && thread.status === SupportThreadStatus.CLOSED) throw new ForbiddenException('This conversation is closed');
    await this.prisma.supportMessage.create({ data: { threadId: id, senderId: userId, senderType: isAdmin ? SupportSenderType.ADMIN : SupportSenderType.CUSTOMER, body: dto.body } });
    if (thread.status === SupportThreadStatus.CLOSED) await this.prisma.supportThread.update({ where: { id }, data: { status: SupportThreadStatus.OPEN } });
    if (isAdmin) await this.notifications.sendToUser(thread.userId, 'Message from Xclusivez Studio', dto.body, `/support/${id}`).catch(() => undefined);
    return this.thread(id, thread.userId, isAdmin);
  }
  async sendOrderMessage(orderId: string, adminId: string, body: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, orderNumber: true } });
    if (!order) throw new NotFoundException('Order not found');
    const subject = `Order ${order.orderNumber}`;
    let thread = await this.prisma.supportThread.findFirst({ where: { userId: order.userId, subject } });
    if (!thread) {
      thread = await this.prisma.supportThread.create({ data: { userId: order.userId, subject, messages: { create: { senderId: adminId, senderType: SupportSenderType.ADMIN, body } } } });
    } else {
      await this.prisma.supportMessage.create({ data: { threadId: thread.id, senderId: adminId, senderType: SupportSenderType.ADMIN, body } });
      if (thread.status === SupportThreadStatus.CLOSED) thread = await this.prisma.supportThread.update({ where: { id: thread.id }, data: { status: SupportThreadStatus.OPEN } });
    }
    await this.notifications.sendToUser(order.userId, `Update for ${order.orderNumber}`, body, `/support/${thread.id}`).catch(() => undefined);
    return this.thread(thread.id, order.userId, true);
  }
  async setStatus(id: string, status: SupportThreadStatus) { return this.prisma.supportThread.update({ where: { id }, data: { status } }); }
}
