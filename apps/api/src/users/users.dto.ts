import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
export class UpdateMeDto {
  @IsOptional() @IsString() @Length(1, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
}
