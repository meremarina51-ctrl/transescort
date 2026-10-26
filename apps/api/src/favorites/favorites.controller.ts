import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type RequestWithUser } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Id анкет в избранном текущего пользователя' })
  async listIds(@Request() req: RequestWithUser) {
    return this.favoritesService.listIds(req.user!.userId);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Полные анкеты из избранного текущего пользователя' })
  async listListings(@Request() req: RequestWithUser) {
    return this.favoritesService.listListings(req.user!.userId);
  }

  @Post(':listingId')
  @ApiOperation({ summary: 'Добавить анкету в избранное' })
  async add(@Param('listingId') listingId: string, @Request() req: RequestWithUser) {
    await this.favoritesService.add(req.user!.userId, listingId);
    return { ok: true };
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Убрать анкету из избранного' })
  async remove(@Param('listingId') listingId: string, @Request() req: RequestWithUser) {
    await this.favoritesService.remove(req.user!.userId, listingId);
    return { ok: true };
  }
}
