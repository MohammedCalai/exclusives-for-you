import { PrismaClient, ProductStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const products = [
  { name: 'Air Max 95 Essential', brand: 'Nike', category: 'Trainers', colour: 'Black / Anthracite', sku: 'NK-AM95-BLK', retail: 17499, price: 12999, featured: true, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', sizes: ['7', '8', '9', '10', '11'] },
  { name: 'Samba OG', brand: 'adidas', category: 'Trainers', colour: 'Cloud White / Core Black', sku: 'AD-SAMBA-WHT', retail: 9499, price: 7999, featured: true, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200', sizes: ['6', '7', '8', '9', '10'] },
  { name: 'Premium Wool Overshirt', brand: 'Carhartt WIP', category: 'Clothing', colour: 'Hamilton Brown', sku: 'CW-OVR-BRN', retail: 17900, price: 11900, featured: true, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Archive Logo Hoodie', brand: 'Stone Island', category: 'Clothing', colour: 'Sage', sku: 'SI-HOOD-SGE', retail: 31500, price: 23900, featured: false, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200', sizes: ['S', 'M', 'L', 'XL'] },
  { name: '2002R Protection Pack', brand: 'New Balance', category: 'Trainers', colour: 'Rain Cloud', sku: 'NB-2002-GRY', retail: 16000, price: 12499, featured: true, image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200', sizes: ['7', '8', '9', '10', '11'] },
  { name: 'Half-Zip Fleece', brand: 'The North Face', category: 'Clothing', colour: 'Midnight Navy', sku: 'TNF-FLC-NVY', retail: 12000, price: 8500, featured: false, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200', sizes: ['S', 'M', 'L', 'XL'] },
];

async function main() {
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  if (adminPassword) {
    await prisma.user.upsert({
      where: { email: 'admin@exclusivesforyou.local' },
      update: {},
      create: { firstName: 'Development', lastName: 'Admin', email: 'admin@exclusivesforyou.local', passwordHash: await argon2.hash(adminPassword), role: 'ADMIN', emailVerifiedAt: new Date() },
    });
  }
  for (const item of products) {
    const brand = await prisma.brand.upsert({ where: { slug: item.brand.toLowerCase().replaceAll(' ', '-') }, update: {}, create: { name: item.brand, slug: item.brand.toLowerCase().replaceAll(' ', '-') } });
    const category = await prisma.category.upsert({ where: { slug: item.category.toLowerCase() }, update: {}, create: { name: item.category, slug: item.category.toLowerCase() } });
    await prisma.product.upsert({
      where: { baseSku: item.sku },
      update: {},
      create: {
        name: item.name, slug: `${item.brand}-${item.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: `${item.name} in ${item.colour}. Authenticated premium stock, selected for Exclusives for You.`, brandId: brand.id, categoryId: category.id, colour: item.colour, baseSku: item.sku, retailPricePence: item.retail, pricePence: item.price, featured: item.featured, status: ProductStatus.ACTIVE,
        images: { create: [{ url: item.image, altText: `${item.brand} ${item.name}`, position: 0 }] },
        variants: { create: item.sizes.map((size, index) => ({ size, sku: `${item.sku}-${size}`, inventory: { create: { quantity: index === 2 ? 0 : 3 + index } } })) },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
