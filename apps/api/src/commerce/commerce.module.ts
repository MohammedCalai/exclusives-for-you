import { Module } from '@nestjs/common';
import { SupportModule } from '../support/support.module';
import { CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';
@Module({ imports: [SupportModule], controllers: [CommerceController], providers: [CommerceService] })
export class CommerceModule {}
