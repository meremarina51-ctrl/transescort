import { Controller, Delete, ForbiddenException, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Id анкет в избранном текущего клиента' })
  async listIds(@Request() req: RequestWithUser) {
    this.assertClient(req);
    return this.favoritesService.listIds(req.user!.userId);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Полные анкеты из избранного текущего клиента' })
  async listListings(@Request() req: RequestWithUser) {
    this.assertClient(req);
    return this.favoritesService.listListings(req.user!.userId);
  }

  @Post(':listingId')
  @ApiOperation({ summary: 'Добавить анкету в избранное' })
  async add(@Param('listingId') listingId: string, @Request() req: RequestWithUser) {
    this.assertClient(req);
    await this.favoritesService.add(req.user!.userId, listingId);
    return { ok: true };
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Убрать анкету из избранного' })
  async remove(@Param('listingId') listingId: string, @Request() req: RequestWithUser) {
    this.assertClient(req);
    await this.favoritesService.remove(req.user!.userId, listingId);
    return { ok: true };
  }

  private assertClient(req: RequestWithUser) {
    if (req.user?.role !== 'client') {
      throw new ForbiddenException('Доступно только для клиентов');
    }
  }
}
