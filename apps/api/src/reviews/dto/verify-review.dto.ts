import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export const REVIEW_DECISIONS = ['approved', 'rejected'] as const;

export class VerifyReviewDto {
  @ApiProperty({ enum: REVIEW_DECISIONS })
  @IsIn(REVIEW_DECISIONS)
  decision!: (typeof REVIEW_DECISIONS)[number];

  @ApiProperty({ required: false, description: 'Причина — обязательна при отклонении, показывается автору отзыва' })
  @ValidateIf((o) => o.decision !== 'approved')
  @IsString()
  @IsNotEmpty({ message: 'Комментарий обязателен при отклонении' })
  @MaxLength(1000)
  note?: string;
}
