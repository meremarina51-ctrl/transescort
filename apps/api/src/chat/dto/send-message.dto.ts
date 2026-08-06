import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/** WebSocket payload for `message:send` — not a REST DTO, so no @ApiProperty/Swagger decoration. */
export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;
}
