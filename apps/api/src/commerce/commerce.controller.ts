import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, Public, Roles } from '../common/auth.decorators';
import { AddCartItemDto, AddFavouriteDto, AdjustStockDto, CheckoutDto, UpdateCartItemDto, UpdateOrderStatusDto } from './commerce.dto';
import { CommerceService } from './commerce.service';

@Controller()
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}
  @Get('favourites') async favourites(@CurrentUser() user: any) { return { data: await this.commerce.favourites(user.sub) }; }
  @Post('favourites') async favourite(@CurrentUser() user: any, @Body() dto: AddFavouriteDto) { return { data: await this.commerce.addFavourite(user.sub, dto.productId) }; }
  @Delete('favourites/:productId') async unfavourite(@CurrentUser() user: any, @Param('productId') id: string) { return { data: await this.commerce.removeFavourite(user.sub, id) }; }
  @Get('cart') async cart(@CurrentUser() user: any) { return { data: await this.commerce.cart(user.sub) }; }
  @Post('cart/items') async addItem(@CurrentUser() user: any, @Body() dto: AddCartItemDto) { return { data: await this.commerce.addCartItem(user.sub, dto.variantId, dto.quantity) }; }
  @Patch('cart/items/:id') async updateItem(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return { data: await this.commerce.updateCartItem(user.sub, id, dto.quantity) }; }
  @Delete('cart/items/:id') async deleteItem(@CurrentUser() user: any, @Param('id') id: string) { return { data: await this.commerce.removeCartItem(user.sub, id) }; }
  @Post('checkout/payment-intent') async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) { return { data: await this.commerce.checkout(user.sub, dto) }; }
  @Get('orders') async orders(@CurrentUser() user: any) { return { data: await this.commerce.orders(user.sub) }; }
  @Get('orders/:orderNumber') async order(@CurrentUser() user: any, @Param('orderNumber') id: string) { return { data: await this.commerce.order(user.sub, id) }; }
  @Public() @Post('payments/webhook') async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) { if (!req.rawBody) throw new Error('Raw body unavailable'); return this.commerce.stripeWebhook(req.rawBody, signature); }
  @Roles('ADMIN') @Get('admin/orders') async adminOrders() { return { data: await this.commerce.adminOrders() }; }
  @Roles('ADMIN') @Patch('admin/orders/:id/status') async status(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return { data: await this.commerce.setOrderStatus(id, dto.status) }; }
  @Roles('ADMIN') @Patch('admin/products/:id/stock') async stock(@Body() dto: AdjustStockDto) { return { data: await this.commerce.setStock(dto.variantId, dto.quantity) }; }
  @Roles('ADMIN') @Get('admin/users') async users() { return { data: await this.commerce.users() }; }
}
