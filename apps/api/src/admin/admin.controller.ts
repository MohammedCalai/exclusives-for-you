import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto, CreateProductDto, CreateVariantDto, UpdateProductDto } from './admin.dto';

@Roles('ADMIN')
@Controller('admin/products')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async list() { return { data: await this.prisma.product.findMany({ include: { brand: true, category: true, images: true, variants: { include: { inventory: true } } }, orderBy: { createdAt: 'desc' } }) }; }
  @Post() async create(@Body() dto: CreateProductDto) {
    const { brandId, categoryId, brandName, categoryName, ...product } = dto;
    return { data: await this.prisma.product.create({ data: { ...product, brand: brandId ? { connect: { id: brandId } } : { connectOrCreate: { where: { slug: (brandName ?? 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }, create: { name: brandName ?? 'Unbranded', slug: (brandName ?? 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') } } }, category: categoryId ? { connect: { id: categoryId } } : { connectOrCreate: { where: { slug: (categoryName ?? 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }, create: { name: categoryName ?? 'Other', slug: (categoryName ?? 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') } } } } }) };
  }
  @Patch(':id') async update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return { data: await this.prisma.product.update({ where: { id }, data: dto }) }; }
  @Post(':id/images') async image(@Param('id') productId: string, @Body() dto: CreateImageDto) { return { data: await this.prisma.productImage.create({ data: { productId, ...dto } }) }; }
  @Post(':id/variants') async variant(@Param('id') productId: string, @Body() dto: CreateVariantDto) { return { data: await this.prisma.productVariant.create({ data: { productId, size: dto.size, sku: dto.sku, inventory: { create: { quantity: dto.quantity } } }, include: { inventory: true } }) }; }
}
