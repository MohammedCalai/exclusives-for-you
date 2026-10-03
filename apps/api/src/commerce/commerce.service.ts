import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { OfferStatus, OrderStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto, CreateOfferDto } from './commerce.dto';
import { EmailService } from '../email/email.service';
import { SupportService } from '../support/support.service';

@Injectable()
export class CommerceService {
  constructor(private readonly prisma: PrismaService, private readonly email: EmailService, private readonly support: SupportService) {}
  private cartInclude = { items: { include: { variant: { include: { inventory: true, product: { include: { brand: true, images: { orderBy: { position: 'asc' as const }, take: 1 } } } } } } } };
  async cart(userId: string) {
    const cart = await this.prisma.cart.upsert({ where: { id: (await this.prisma.cart.findFirst({ where: { userId, active: true } }))?.id ?? 'new' }, update: {}, create: { userId }, include: this.cartInclude });
    return this.priceCart(cart);
  }
  async addCartItem(userId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, active: true, product: { status: 'ACTIVE' } }, include: { inventory: true } });
    if (!variant) throw new NotFoundException('Product size not found');
    if ((variant.inventory?.quantity ?? 0) < quantity) throw new ConflictException('Requested quantity is not available');
    const cart = await this.prisma.cart.findFirst({ where: { userId, active: true } }) ?? await this.prisma.cart.create({ data: { userId } });
    await this.prisma.cartItem.upsert({ where: { cartId_variantId: { cartId: cart.id, variantId } }, update: { quantity: { increment: quantity } }, create: { cartId: cart.id, variantId, quantity } });
    return this.cart(userId);
  }
  async updateCartItem(userId: string, id: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({ where: { id, cart: { userId, active: true } }, include: { variant: { include: { inventory: true } } } });
    if (!item) throw new NotFoundException('Basket item not found');
    if ((item.variant.inventory?.quantity ?? 0) < quantity) throw new ConflictException('Requested quantity is not available');
    await this.prisma.cartItem.update({ where: { id }, data: { quantity } });
    return this.cart(userId);
  }
  async removeCartItem(userId: string, id: string) { await this.prisma.cartItem.deleteMany({ where: { id, cart: { userId, active: true } } }); return this.cart(userId); }
  async favourites(userId: string) { return this.prisma.favourite.findMany({ where: { userId }, include: { product: { include: { brand: true, images: { orderBy: { position: 'asc' }, take: 1 }, variants: { where: { inventory: { quantity: { gt: 0 } } } } } } }, orderBy: { createdAt: 'desc' } }); }
  async addFavourite(userId: string, productId: string) { return this.prisma.favourite.upsert({ where: { userId_productId: { userId, productId } }, update: {}, create: { userId, productId } }); }
  async removeFavourite(userId: string, productId: string) { await this.prisma.favourite.deleteMany({ where: { userId, productId } }); return { success: true }; }
  async createOffer(userId: string, dto: CreateOfferDto) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, status: 'ACTIVE' } });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.variantId && !(await this.prisma.productVariant.findFirst({ where: { id: dto.variantId, productId: product.id } }))) throw new NotFoundException('Selected size not found');
    return this.prisma.offer.create({ data: { offerNumber: `OFR-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`, userId, productId: product.id, ...(dto.variantId ? { variantId: dto.variantId } : {}), amountPence: dto.amountPence, ...(dto.message ? { message: dto.message } : {}), expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) }, include: { product: { select: { name: true, slug: true } }, variant: { select: { size: true } } } });
  }
  async offers(userId: string) { return this.prisma.offer.findMany({ where: { userId }, include: { product: { select: { name: true, slug: true } }, variant: { select: { size: true } } }, orderBy: { createdAt: 'desc' } }); }
  async adminOffers() { return this.prisma.offer.findMany({ include: { user: { select: { email: true, firstName: true, lastName: true } }, product: { select: { name: true, slug: true } }, variant: { select: { size: true } } }, orderBy: { createdAt: 'desc' } }); }
  async setOfferStatus(id: string, status: OfferStatus) { return this.prisma.offer.update({ where: { id }, data: { status } }); }
  async checkout(userId: string, dto: CheckoutDto) {
    if (dto.countryCode !== 'GB') throw new BadRequestException('Only UK delivery is available in Phase 1');
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key?.startsWith('sk_test_') || key.includes('replace_me')) throw new ServiceUnavailableException('Stripe test mode is not configured');
    const result = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({ where: { userId, active: true }, include: this.cartInclude });
      if (!cart?.items.length) throw new BadRequestException('Basket is empty');
      for (const item of cart.items) {
        const changed = await tx.inventory.updateMany({ where: { variantId: item.variantId, quantity: { gte: item.quantity } }, data: { quantity: { decrement: item.quantity }, version: { increment: 1 } } });
        if (changed.count !== 1) throw new ConflictException(`${item.variant.product.name} in size ${item.variant.size} is no longer available`);
      }
      const subtotal = cart.items.reduce((sum, item) => sum + item.variant.product.pricePence * item.quantity, 0);
      const delivery = dto.deliveryMethodId === 'express' ? 799 : subtotal >= 10000 ? 0 : 499;
      const order = await tx.order.create({ data: { orderNumber: `EFY-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`, userId, subtotalPence: subtotal, deliveryPence: delivery, totalPence: subtotal + delivery, deliveryAddress: dto as unknown as Prisma.InputJsonValue, items: { create: cart.items.map((item) => ({ variantId: item.variantId, productName: item.variant.product.name, brandName: item.variant.product.brand.name, sku: item.variant.sku, size: item.variant.size, quantity: item.quantity, unitPricePence: item.variant.product.pricePence, totalPricePence: item.variant.product.pricePence * item.quantity })) } }, include: { items: true } });
      await tx.cart.update({ where: { id: cart.id }, data: { active: false } });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    try {
      const stripe = new Stripe(key);
      const intent = await stripe.paymentIntents.create({ amount: result.totalPence, currency: 'gbp', automatic_payment_methods: { enabled: true }, metadata: { orderId: result.id, orderNumber: result.orderNumber, userId } }, { idempotencyKey: result.id });
      await this.prisma.payment.create({ data: { orderId: result.id, stripePaymentIntentId: intent.id, amountPence: result.totalPence } });
      const customer = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (customer) await this.email.sendOrderPlaced({ orderNumber: result.orderNumber, email: customer.email, firstName: customer.firstName, totalPence: result.totalPence, itemCount: result.items.length }).catch(() => undefined);
      return { orderNumber: result.orderNumber, clientSecret: intent.client_secret };
    } catch (error) {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: result.id }, include: { items: true } });
        if (order?.status === 'PENDING_PAYMENT') { await this.releaseReservedInventory(tx, order.items); await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } }); }
      });
      throw error;
    }
  }
  async orders(userId: string) { return this.prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' } }); }
  async order(userId: string, orderNumber: string) { const order = await this.prisma.order.findFirst({ where: { userId, orderNumber }, include: { items: true, payments: true } }); if (!order) throw new NotFoundException('Order not found'); return order; }
  async stripeWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET; const key = process.env.STRIPE_SECRET_KEY;
    if (!secret || !key) throw new ServiceUnavailableException('Stripe is not configured');
    const stripe = new Stripe(key); const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    await this.prisma.$transaction(async (tx) => {
      if (await tx.stripeEvent.findUnique({ where: { id: event.id } })) return;
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = intent.id ? await tx.payment.findUnique({ where: { stripePaymentIntentId: intent.id } }) : null;
      if (payment) {
        const paymentStatus = event.type === 'payment_intent.succeeded' ? 'SUCCEEDED' : event.type === 'payment_intent.payment_failed' ? 'FAILED' : event.type === 'payment_intent.canceled' ? 'CANCELLED' : null;
        if (paymentStatus) await tx.payment.update({ where: { id: payment.id }, data: { status: paymentStatus } });
        if (paymentStatus === 'SUCCEEDED') await tx.order.updateMany({ where: { id: payment.orderId, status: 'PENDING_PAYMENT' }, data: { status: 'PAID' } });
        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          const order = await tx.order.findUnique({ where: { id: payment.orderId }, include: { items: true } });
          if (order?.status === 'PENDING_PAYMENT') { await this.releaseReservedInventory(tx, order.items); await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } }); }
        }
      }
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type, payload: event as unknown as Prisma.InputJsonValue } });
    });
    return { received: true };
  }
  private priceCart(cart: any) { const items = cart.items.map((item: any) => ({ id: item.id, variantId: item.variantId, name: item.variant.product.name, brand: item.variant.product.brand.name, size: item.variant.size, quantity: item.quantity, stock: item.variant.inventory?.quantity ?? 0, unitPricePence: item.variant.product.pricePence, imageUrl: item.variant.product.images[0]?.url ?? '' })); const subtotalPence = items.reduce((s: number, i: any) => s + i.unitPricePence * i.quantity, 0); const deliveryPence = subtotalPence >= 10000 ? 0 : 499; return { id: cart.id, items, subtotalPence, deliveryPence, discountPence: 0, totalPence: subtotalPence + deliveryPence }; }
  private async releaseReservedInventory(tx: Prisma.TransactionClient, items: Array<{ variantId: string; quantity: number }>) { for (const item of items) await tx.inventory.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity }, version: { increment: 1 } } }); }
  async adminOrders() { return this.prisma.order.findMany({ include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, items: true }, orderBy: { createdAt: 'desc' } }); }
  async setOrderStatus(id: string, status: OrderStatus) { return this.prisma.order.update({ where: { id }, data: { status } }); }
  async sendOrderMessage(id: string, adminId: string, body: string) { return this.support.sendOrderMessage(id, adminId, body); }
  async users() { return this.prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true, emailVerifiedAt: true, createdAt: true } }); }
  async setStock(variantId: string, quantity: number) { return this.prisma.inventory.upsert({ where: { variantId }, update: { quantity, version: { increment: 1 } }, create: { variantId, quantity } }); }
}
