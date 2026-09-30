import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('An account already exists for this email');
    const user = await this.prisma.user.create({ data: { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), email, passwordHash: await argon2.hash(dto.password) } });
    await this.issueOneTimeToken(user.id, 'EMAIL_VERIFICATION', 24 * 60);
    return this.issueSession(user);
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) throw new UnauthorizedException('Email or password is incorrect');
    return this.issueSession(user);
  }
  async refresh(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } });
    if (!record || record.revokedAt || record.expiresAt <= new Date()) throw new UnauthorizedException('Refresh token is invalid');
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    return this.issueSession(record.user);
  }
  async logout(refreshToken: string) { await this.prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } }); }
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) await this.issueOneTimeToken(user.id, 'PASSWORD_RESET', Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30));
    return { accepted: true };
  }
  async resetPassword(token: string, password: string) { return this.consumeToken(token, 'PASSWORD_RESET', { passwordHash: await argon2.hash(password) }); }
  async verifyEmail(token: string) { return this.consumeToken(token, 'EMAIL_VERIFICATION', { emailVerifiedAt: new Date() }); }
  private async issueSession(user: { id: string; email: string; role: string; firstName: string; lastName: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is required');
    const accessToken = await this.jwt.signAsync(payload, { secret, expiresIn: '15m' });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400000) } });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
  }
  private async issueOneTimeToken(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET', ttlMinutes: number) {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.userToken.create({ data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMinutes * 60000) } });
    return token; // Send via an email provider adapter; never log in production.
  }
  private async consumeToken(token: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET', userData: object) {
    const record = await this.prisma.userToken.findFirst({ where: { tokenHash: hashToken(token), type, consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw new UnauthorizedException('Token is invalid or expired');
    await this.prisma.$transaction([this.prisma.userToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }), this.prisma.user.update({ where: { id: record.userId }, data: userData })]);
    return { success: true };
  }
}
