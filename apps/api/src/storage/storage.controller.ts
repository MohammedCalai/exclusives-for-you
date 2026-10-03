import { Body, Controller, Inject, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Roles } from '../common/auth.decorators';
import { CreateUploadDto } from './storage.dto';
import { STORAGE_SERVICE, StorageService } from './storage';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

@Roles('ADMIN')
@Controller('admin/uploads')
export class StorageController {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  @Post('presign')
  async presign(@Body() dto: CreateUploadDto) {
    const safeStem =
      dto.fileName
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'product';
    const key = `products/${new Date().toISOString().slice(0, 7)}/${safeStem}-${randomUUID()}.${extensions[dto.contentType]}`;
    return { data: await this.storage.signedUploadUrl(key, dto.contentType, dto.size) };
  }
}
