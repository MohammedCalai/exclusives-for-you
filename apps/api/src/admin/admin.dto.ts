import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';
export class CreateProductDto {
  @IsString() name!: string; @IsString() slug!: string; @IsString() description!: string; @IsOptional() @IsString() brandId?: string; @IsOptional() @IsString() categoryId?: string; @IsOptional() @IsString() brandName?: string; @IsOptional() @IsString() categoryName?: string; @IsString() colour!: string; @IsString() baseSku!: string;
  @Type(() => Number) @IsInt() @Min(0) pricePence!: number; @IsOptional() @Type(() => Number) @IsInt() @Min(0) retailPricePence?: number;
  @IsOptional() @IsBoolean() featured?: boolean; @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
}
export class UpdateProductDto {
  @IsOptional() @IsString() name?: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() colour?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) pricePence?: number; @IsOptional() @Type(() => Number) @IsInt() @Min(0) retailPricePence?: number;
  @IsOptional() @IsBoolean() featured?: boolean; @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
}
export class CreateImageDto { @IsString() url!: string; @IsString() altText!: string; @IsOptional() @IsString() storageKey?: string; }
export class CreateVariantDto { @IsString() size!: string; @IsString() sku!: string; @Type(() => Number) @IsInt() @Min(0) quantity!: number; }
