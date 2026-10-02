import { IsIn, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString() @MaxLength(512) token!: string;
  @IsIn(['ios', 'android', 'web']) platform!: string;
}

export class CreateAdminNotificationDto {
  @IsString() @Length(2, 80) title!: string;
  @IsString() @Length(2, 240) body!: string;
  @IsOptional() @IsUrl({ require_tld: false }) deeplink?: string;
  @IsOptional() @IsString() audience?: 'all' | string;
}
