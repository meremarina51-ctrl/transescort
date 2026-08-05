import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BlockListingDto {
  @ApiProperty({ description: 'Причина блокировки — обязательна, показывается исполнителю' })
  @IsString()
  @IsNotEmpty({ message: 'Укажите причину блокировки' })
  @MaxLength(1000)
  note!: string;
}
