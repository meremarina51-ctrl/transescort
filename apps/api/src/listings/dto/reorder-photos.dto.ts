import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderPhotosDto {
  @ApiProperty({
    type: [String],
    description: 'Полный список URL фото анкеты в новом порядке — первое фото становится главным',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos!: string[];
}
