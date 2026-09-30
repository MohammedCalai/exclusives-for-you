import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProductSort { NEWEST = 'newest', PRICE_ASC = 'price_asc', PRICE_DESC = 'price_desc', SAVING = 'saving' }
export class ProductQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() inStock?: boolean;
  @IsOptional() @IsEnum(ProductSort) sort: ProductSort = ProductSort.NEWEST;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
}
