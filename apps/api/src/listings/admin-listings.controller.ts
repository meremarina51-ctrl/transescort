import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TelegramService } from '../telegram/telegram.service';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { BlockListingDto } from './dto/block-listing.dto';

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

  @Patch(':id/verify-photos')
  @ApiOperation({ summary: 'Отметить фото анкеты как проверенные вручную' })
  async verifyPhotos(@Param('id') id: string) {
    return this.listingsService.verifyPhotos(id);
  }

  @Patch(':id/unverify-photos')
  @ApiOperation({ summary: 'Снять отметку о проверке фото' })
  async unverifyPhotos(@Param('id') id: string) {
    return this.listingsService.unverifyPhotos(id);
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
