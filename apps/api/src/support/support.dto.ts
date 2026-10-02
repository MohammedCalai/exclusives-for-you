import { IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { SupportThreadStatus } from '@prisma/client';

export class CreateSupportThreadDto { @IsString() @Length(2, 120) subject!: string; @IsString() @Length(1, 2000) body!: string; }
export class CreateSupportMessageDto { @IsString() @Length(1, 2000) body!: string; }
export class UpdateSupportThreadDto { @IsEnum(SupportThreadStatus) status!: SupportThreadStatus; }
