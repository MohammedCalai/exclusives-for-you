import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsString() @Length(1, 60) firstName!: string;
  @IsString() @Length(1, 60) lastName!: string;
  @IsEmail() email!: string;
  @IsString() @Length(10, 128) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'Password must include upper, lower, and numeric characters' }) password!: string;
}
export class LoginDto { @IsEmail() email!: string; @IsString() @IsNotEmpty() password!: string; }
export class RefreshDto { @IsString() @IsNotEmpty() refreshToken!: string; }
export class EmailDto { @IsEmail() email!: string; }
export class TokenDto { @IsString() @IsNotEmpty() token!: string; }
export class ResetPasswordDto extends TokenDto { @IsString() @Length(10, 128) password!: string; }
