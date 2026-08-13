import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TelegramService } from '../telegram/telegram.service';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { BlockListingDto } from './dto/block-listing.dto';

const PHOTO_REVIEW_DECISIONS = ['confirmed', 'rejected'] as const;

class ReviewPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({ enum: PHOTO_REVIEW_DECISIONS })
  @IsIn(PHOTO_REVIEW_DECISIONS)
  decision!: (typeof PHOTO_REVIEW_DECISIONS)[number];

  @ApiProperty({ required: false, description: 'Причина — обязательна при отклонении, показывается исполнителю' })
  @ValidateIf((o) => o.decision === 'rejected')
  @IsString()
  @IsNotEmpty({ message: 'Комментарий обязателен при отклонении' })
  @MaxLength(1000)
  note?: string;
}

class ReviewAllPhotosDto {
  @ApiProperty({ enum: PHOTO_REVIEW_DECISIONS })
  @IsIn(PHOTO_REVIEW_DECISIONS)
  decision!: (typeof PHOTO_REVIEW_DECISIONS)[number];

  @ApiProperty({ required: false, description: 'Причина — обязательна при отклонении, показывается исполнителю' })
  @ValidateIf((o) => o.decision === 'rejected')
  @IsString()
  @IsNotEmpty({ message: 'Комментарий обязателен при отклонении' })
  @MaxLength(1000)
  note?: string;
}

@ApiTags('Admin Listings')
@ApiBearerAuth()
@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список всех анкет (любой статус)' })
  async list() {
    return this.listingsService.listAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Анкета по id' })
  async getOne(@Param('id') id: string) {
    const listing = await this.listingsService.findByIdForAdmin(id);
    if (!listing) throw new NotFoundException('Анкета не найдена');
    return listing;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать анкету' })
  async update(@Param('id') id: string, @Body() body: UpdateListingDto) {
    const existing = await this.listingsService.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');

    await this.listingsService.updateById(id, body);
    return this.listingsService.findByIdForAdmin(id);
  }

  @Patch(':id/hide')
  @ApiOperation({ summary: 'Скрыть опубликованную анкету из каталога' })
  async hide(@Param('id') id: string) {
    return this.listingsService.adminHide(id);
  }

  @Patch(':id/unhide')
  @ApiOperation({ summary: 'Вернуть скрытую анкету обратно в каталог' })
  async unhide(@Param('id') id: string) {
    return this.listingsService.adminUnhide(id);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Заблокировать анкету — причина обязательна' })
  async block(@Param('id') id: string, @Body() body: BlockListingDto) {
    return this.listingsService.block(id, body.note);
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Снять блокировку — анкета возвращается в черновик' })
  async unblock(@Param('id') id: string) {
    return this.listingsService.unblock(id);
  }

  @Get(':id/photo-reviews')
  @ApiOperation({ summary: 'Статус проверки по каждому фото анкеты' })
  async photoReviews(@Param('id') id: string) {
    return this.listingsService.getPhotoReviews(id);
  }

  @Patch(':id/photos/review')
  @ApiOperation({ summary: 'Подтвердить или отклонить одно фото — причина обязательна при отклонении' })
  async reviewPhoto(@Param('id') id: string, @Body() body: ReviewPhotoDto) {
    return this.listingsService.reviewPhoto(id, body.url, body.decision, body.note);
  }

  @Patch(':id/photos/review-all')
  @ApiOperation({ summary: 'Подтвердить или отклонить все фото анкеты разом — причина обязательна при отклонении' })
  async reviewAllPhotos(@Param('id') id: string, @Body() body: ReviewAllPhotosDto) {
    return this.listingsService.reviewAllPhotos(id, body.decision, body.note);
  }

  @Patch(':id/telegram/unlink')
  @ApiOperation({ summary: 'Принудительно отвязать Telegram исполнителя (модерация)' })
  async unlinkTelegram(@Param('id') id: string) {
    const existing = await this.listingsService.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');

    await this.telegramService.unlink(existing.userId);
    return this.listingsService.findByIdForAdmin(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить анкету' })
  async remove(@Param('id') id: string) {
    const existing = await this.listingsService.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');

    await this.listingsService.deleteById(id);
    return { ok: true };
  }
}
