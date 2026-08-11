import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type RequestWithUser } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Опубликованные отзывы анкеты + средняя оценка (публично)' })
  async listForListing(@Param('listingId') listingId: string) {
    return this.reviewsService.listPublishedForListing(listingId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оставить отзыв на анкету — отправляется на модерацию' })
  async create(@Request() req: RequestWithUser, @Body() body: CreateReviewDto) {
    return this.reviewsService.create(req.user!.userId, body.listingId, body.rating, body.text);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои отзывы — все статусы, включая причину отклонения' })
  async listMine(@Request() req: RequestWithUser) {
    return this.reviewsService.listMine(req.user!.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой отзыв' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.reviewsService.removeOwn(req.user!.userId, id);
    return { ok: true };
  }
}
