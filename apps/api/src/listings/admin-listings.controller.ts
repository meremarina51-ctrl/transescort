import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ListingsService } from './listings.service';
import { STATUS_OPTIONS, UpdateListingDto } from './dto/update-listing.dto';

class SetListingStatusDto {
  @ApiProperty({ enum: STATUS_OPTIONS })
  @IsIn(STATUS_OPTIONS)
  status!: 'draft' | 'published';
}

@ApiTags('Admin Listings')
@ApiBearerAuth()
@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Опубликовать / скрыть анкету' })
  async setStatus(@Param('id') id: string, @Body() body: SetListingStatusDto) {
    const existing = await this.listingsService.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');

    await this.listingsService.updateById(id, { status: body.status });
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
