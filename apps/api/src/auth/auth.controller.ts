import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/auth.decorators';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto, TokenDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Throttle({ default: { limit: 5, ttl: 60000 } }) @Post('register') async register(@Body() dto: RegisterDto) { return { data: await this.auth.register(dto) }; }
  @Public() @Throttle({ default: { limit: 8, ttl: 60000 } }) @Post('login') async login(@Body() dto: LoginDto) { return { data: await this.auth.login(dto) }; }
  @Public() @Post('refresh') async refresh(@Body() dto: RefreshDto) { return { data: await this.auth.refresh(dto.refreshToken) }; }
  @Public() @Post('logout') async logout(@Body() dto: RefreshDto) { await this.auth.logout(dto.refreshToken); return { data: { success: true } }; }
  @Public() @Throttle({ default: { limit: 3, ttl: 60000 } }) @Post('forgot-password') async forgot(@Body() dto: EmailDto) { return { data: await this.auth.forgotPassword(dto.email) }; }
  @Public() @Post('reset-password') async reset(@Body() dto: ResetPasswordDto) { return { data: await this.auth.resetPassword(dto.token, dto.password) }; }
  @Public() @Post('verify-email') async verify(@Body() dto: TokenDto) { return { data: await this.auth.verifyEmail(dto.token) }; }
}
