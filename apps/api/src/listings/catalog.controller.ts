import { Body, Controller, Get, NotFoundException, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { IsIn } from 'class-validator';
import { ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CONTACT_EVENT_ACTIONS, type ContactEventAction } from '@transescort/db';
import { ListingsService } from './listings.service';

class RecordContactEventDto {
  @ApiProperty({ enum: CONTACT_EVENT_ACTIONS, description: '"click" — открыта форма связи; "platform"/"telegram" — выбран канал' })
  @IsIn(CONTACT_EVENT_ACTIONS)
  action!: ContactEventAction;
}

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
  async get(@Param('slug') slug: string, @Req() req: Request) {
    const listing = await this.listingsService.findPublishedBySlug(slug);
    if (!listing) {
      throw new NotFoundException('Анкета не найдена');
    }
    await this.listingsService.recordView(listing.id, req.ip ?? '');
    return listing;
  }

  @Post(':id/contact')
  @ApiOperation({ summary: 'Зафиксировать клик «Связаться» или выбор канала связи — публично, без авторизации' })
  async recordContact(@Param('id') id: string, @Body() body: RecordContactEventDto) {
    await this.listingsService.recordContactEvent(id, body.action);
    return { ok: true };
  }
}
