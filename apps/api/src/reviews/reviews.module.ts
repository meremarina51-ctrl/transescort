import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
