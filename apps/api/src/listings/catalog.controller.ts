import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Публичный каталог опубликованных анкет' })
  @ApiResponse({ status: 200, description: 'Список опубликованных анкет' })
  async list() {
    return this.listingsService.listPublished();
  }

  @Get(':slug')
  @ApiParam({ name: 'slug' })
  @ApiOperation({ summary: 'Публичная страница анкеты' })
  @ApiResponse({ status: 200, description: 'Анкета' })
  @ApiResponse({ status: 404, description: 'Анкета не найдена или не опубликована' })
  async get(@Param('slug') slug: string) {
    const listing = await this.listingsService.findPublishedBySlug(slug);
    if (!listing) {
      throw new NotFoundException('Анкета не найдена');
    }
    return listing;
  }
}
