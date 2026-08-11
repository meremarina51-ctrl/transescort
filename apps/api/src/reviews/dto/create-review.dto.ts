import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'id анкеты, на которую оставляется отзыв' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: 'Напишите текст отзыва' })
  @MaxLength(2000)
  text!: string;
}
