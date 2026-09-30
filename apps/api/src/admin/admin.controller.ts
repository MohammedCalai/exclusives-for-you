import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto, CreateProductDto, CreateVariantDto, UpdateProductDto } from './admin.dto';

@Roles('ADMIN')
@Controller('admin/products')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}
  @Post() async create(@Body() dto: CreateProductDto) { return { data: await this.prisma.product.create({ data: dto }) }; }
  @Patch(':id') async update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return { data: await this.prisma.product.update({ where: { id }, data: dto }) }; }
  @Post(':id/images') async image(@Param('id') productId: string, @Body() dto: CreateImageDto) { return { data: await this.prisma.productImage.create({ data: { productId, ...dto } }) }; }
  @Post(':id/variants') async variant(@Param('id') productId: string, @Body() dto: CreateVariantDto) { return { data: await this.prisma.productVariant.create({ data: { productId, size: dto.size, sku: dto.sku, inventory: { create: { quantity: dto.quantity } } }, include: { inventory: true } }) }; }
}
