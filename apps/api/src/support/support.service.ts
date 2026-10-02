import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportSenderType, SupportThreadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportMessageDto, CreateSupportThreadDto } from './support.dto';

const messageInclude = { sender: { select: { firstName: true, lastName: true, role: true } } } as const;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}
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
    return this.thread(id, thread.userId, isAdmin);
  }
  async setStatus(id: string, status: SupportThreadStatus) { return this.prisma.supportThread.update({ where: { id }, data: { status } }); }
}
