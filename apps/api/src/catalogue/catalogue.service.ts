import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto, ProductSort } from './catalogue.dto';

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}
  async products(query: ProductQueryDto) {
    const pricePence: Prisma.IntFilter | undefined = query.minPrice !== undefined || query.maxPrice !== undefined
      ? { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) }
      : undefined;
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { brand: { name: { contains: query.q, mode: 'insensitive' } } }, { description: { contains: query.q, mode: 'insensitive' } }] } : {}),
      ...(query.brand ? { brand: { slug: query.brand } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(pricePence ? { pricePence } : {}),
      ...(query.size || query.inStock ? { variants: { some: { ...(query.size ? { size: query.size } : {}), active: true, ...(query.inStock ? { inventory: { quantity: { gt: 0 } } } : {}) } } } : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput = query.sort === ProductSort.PRICE_ASC ? { pricePence: 'asc' } : query.sort === ProductSort.PRICE_DESC ? { pricePence: 'desc' } : { dateAdded: 'desc' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit, include: { brand: true, images: { orderBy: { position: 'asc' }, take: 1 }, variants: { where: { active: true, inventory: { quantity: { gt: 0 } } }, select: { size: true } } } }),
      this.prisma.product.count({ where }),
    ]);
    const mapped = items.map((p) => this.summary(p));
    if (query.sort === ProductSort.SAVING) mapped.sort((a, b) => ((b.retailPricePence ?? b.pricePence) - b.pricePence) - ((a.retailPricePence ?? a.pricePence) - a.pricePence));
    return { items: mapped, total, page: query.page, pageSize: query.limit };
  }
  async product(slug: string) {
    const p = await this.prisma.product.findFirst({ where: { slug, status: 'ACTIVE' }, include: { brand: true, category: true, images: { orderBy: { position: 'asc' } }, variants: { where: { active: true }, include: { inventory: true } } } });
    if (!p) throw new NotFoundException('Product not found');
    return { ...this.summary(p), description: p.description, colour: p.colour, images: p.images.map((i) => i.url), category: p.category.name, variants: p.variants.map((v) => ({ id: v.id, size: v.size, sku: v.sku, stock: v.inventory?.quantity ?? 0 })), delivery: 'Free UK delivery over £100. Standard delivery in 2–4 working days.', returns: 'Returns accepted within 14 days in original condition.' };
  }
  async trackView(productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, status: 'ACTIVE' }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.productView.create({ data: { productId } });
    return { recorded: true };
  }
  async brands() { return this.prisma.brand.findMany({ orderBy: { name: 'asc' } }); }
  async categories() { return this.prisma.category.findMany({ where: { parentId: null }, include: { children: true }, orderBy: { name: 'asc' } }); }
  private summary(p: any) { return { id: p.id, slug: p.slug, name: p.name, brand: p.brand.name, imageUrl: p.images[0]?.url ?? '', pricePence: p.pricePence, retailPricePence: p.retailPricePence, currency: 'GBP' as const, featured: p.featured, availableSizes: p.variants.map((v: { size: string }) => v.size) }; }
}
