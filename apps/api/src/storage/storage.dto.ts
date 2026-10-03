import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export class CreateUploadDto {
  @IsString()
  fileName!: string;

  @IsIn(imageTypes)
  contentType!: (typeof imageTypes)[number];

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size!: number;
}
