import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Roles } from '../common/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto, CreateProductDto, CreateVariantDto, UpdateProductDto } from './admin.dto';

const saleStatuses: OrderStatus[] = ['PAID', 'PROCESSING', 'DISPATCHED', 'DELIVERED'];

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard() {
    const [products, activeProducts, variants, orders, revenue, customers, openMessages, pendingOffers, views, saves, basket] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.productVariant.findMany({ where: { active: true }, select: { inventory: { select: { quantity: true } } } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ where: { status: { in: saleStatuses } }, _sum: { totalPence: true } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.supportThread.count({ where: { status: 'OPEN' } }),
      this.prisma.offer.count({ where: { status: 'PENDING' } }),
      this.prisma.productView.count(),
      this.prisma.favourite.count(),
      this.prisma.cartItem.aggregate({ where: { cart: { active: true } }, _sum: { quantity: true } }),
    ]);
    const quantities = variants.map((variant) => variant.inventory?.quantity ?? 0);
    return { data: {
      products,
      activeProducts,
      totalStock: quantities.reduce((sum, quantity) => sum + quantity, 0),
      lowStock: quantities.filter((quantity) => quantity <= 2).length,
      orders,
      revenuePence: revenue._sum.totalPence ?? 0,
      customers,
      openMessages,
      pendingOffers,
      views,
      saves,
      basketUnits: basket._sum.quantity ?? 0,
    } };
  }

  @Get('products')
  async list() {
    const products = await this.prisma.product.findMany({ include: { brand: true, category: true, images: { orderBy: { position: 'asc' } }, variants: { include: { inventory: true } } }, orderBy: { createdAt: 'desc' } });
    const data = await Promise.all(products.map(async (product) => {
      const [views, saves, basket, ordered] = await Promise.all([
        this.prisma.productView.count({ where: { productId: product.id } }),
        this.prisma.favourite.count({ where: { productId: product.id } }),
        this.prisma.cartItem.aggregate({ where: { cart: { active: true }, variant: { productId: product.id } }, _sum: { quantity: true } }),
        this.prisma.orderItem.aggregate({ where: { variant: { productId: product.id }, order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } }, _sum: { quantity: true, totalPricePence: true } }),
      ]);
      return { ...product, metrics: { views, saves, basketUnits: basket._sum.quantity ?? 0, orderedUnits: ordered._sum.quantity ?? 0, revenuePence: ordered._sum.totalPricePence ?? 0 } };
    }));
    return { data };
  }

  @Post('products')
  async create(@Body() dto: CreateProductDto) {
    const { brandId, categoryId, brandName, categoryName, ...product } = dto;
    const brandSlug = (brandName ?? 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const categorySlug = (categoryName ?? 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { data: await this.prisma.product.create({ data: { ...product, brand: brandId ? { connect: { id: brandId } } : { connectOrCreate: { where: { slug: brandSlug }, create: { name: brandName ?? 'Unbranded', slug: brandSlug } } }, category: categoryId ? { connect: { id: categoryId } } : { connectOrCreate: { where: { slug: categorySlug }, create: { name: categoryName ?? 'Other', slug: categorySlug } } } } }) };
  }

  @Patch('products/:id') async update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return { data: await this.prisma.product.update({ where: { id }, data: dto }) }; }
  @Post('products/:id/images') async image(@Param('id') productId: string, @Body() dto: CreateImageDto) { return { data: await this.prisma.productImage.create({ data: { productId, ...dto } }) }; }
  @Post('products/:id/variants') async variant(@Param('id') productId: string, @Body() dto: CreateVariantDto) { return { data: await this.prisma.productVariant.create({ data: { productId, size: dto.size, sku: dto.sku, inventory: { create: { quantity: dto.quantity } } }, include: { inventory: true } }) }; }
}
