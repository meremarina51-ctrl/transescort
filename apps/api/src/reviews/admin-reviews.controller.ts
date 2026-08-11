import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { VerifyReviewDto } from './dto/verify-review.dto';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Все отзывы (любой статус) — очередь модерации фильтруется на клиенте по status=pending' })
  async list() {
    return this.reviewsService.listAllForAdmin();
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Подтвердить (публикует) или отклонить отзыв на модерации — причина обязательна при отклонении' })
  async verify(@Param('id') id: string, @Body() body: VerifyReviewDto) {
    return this.reviewsService.verify(id, body.decision, body.note);
  }

  @Patch(':id/hide')
  @ApiOperation({ summary: 'Скрыть опубликованный отзыв' })
  async hide(@Param('id') id: string) {
    return this.reviewsService.hide(id);
  }

  @Patch(':id/unhide')
  @ApiOperation({ summary: 'Вернуть скрытый отзыв в публикацию' })
  async unhide(@Param('id') id: string) {
    return this.reviewsService.unhide(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить отзыв безвозвратно' })
  async remove(@Param('id') id: string) {
    await this.reviewsService.adminDelete(id);
    return { ok: true };
  }
}
