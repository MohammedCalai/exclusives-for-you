import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../common/auth.decorators';
import { ProductQueryDto } from './catalogue.dto';
import { CatalogueService } from './catalogue.service';

@Public()
@Controller()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}
  @Get('products') async products(@Query() query: ProductQueryDto) { const result = await this.catalogue.products(query); return { data: result.items, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }; }
  @Get('products/:slug') async product(@Param('slug') slug: string) { return { data: await this.catalogue.product(slug) }; }
  @Post('products/:id/view') async view(@Param('id') id: string) { return { data: await this.catalogue.trackView(id) }; }
  @Get('brands') async brands() { return { data: await this.catalogue.brands() }; }
  @Get('categories') async categories() { return { data: await this.catalogue.categories() }; }
}
