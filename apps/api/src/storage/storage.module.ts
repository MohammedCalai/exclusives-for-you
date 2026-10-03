import { Module } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service';
import { STORAGE_SERVICE } from './storage';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [{ provide: STORAGE_SERVICE, useClass: S3StorageService }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
