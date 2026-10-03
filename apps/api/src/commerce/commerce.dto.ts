import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPhoneNumber, IsString, Length, MaxLength, Min } from 'class-validator';
import { OfferStatus, OrderStatus } from '@prisma/client';
export class AddCartItemDto { @IsString() variantId!: string; @Type(() => Number) @IsInt() @Min(1) quantity!: number; }
export class UpdateCartItemDto { @Type(() => Number) @IsInt() @Min(1) quantity!: number; }
export class AddFavouriteDto { @IsString() productId!: string; }
export class CreateOfferDto {
  @IsString() productId!: string;
  @IsOptional() @IsString() variantId?: string;
  @Type(() => Number) @IsInt() @Min(100) amountPence!: number;
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}
export class UpdateOfferStatusDto { @IsEnum(OfferStatus) status!: OfferStatus; }
export class CheckoutDto {
  @IsString() @Length(1, 120) fullName!: string;
  @IsString() @Length(1, 120) line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @Length(1, 80) city!: string;
  @IsOptional() @IsString() county?: string;
  @IsString() @Length(5, 10) postcode!: string;
  @IsString() @Length(2, 2) countryCode = 'GB';
  @IsPhoneNumber() mobile!: string;
  @IsString() deliveryMethodId = 'standard';
}
export class UpdateOrderStatusDto { @IsEnum(OrderStatus) status!: OrderStatus; }
export class SendOrderMessageDto { @IsString() @Length(2, 1000) body!: string; }
export class AdjustStockDto { @IsString() variantId!: string; @Type(() => Number) @IsInt() @Min(0) quantity!: number; }
