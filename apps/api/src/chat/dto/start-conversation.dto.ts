import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ example: 'ivan_petrov', description: 'Логин пользователя, с которым начинается чат' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  login!: string;
}
