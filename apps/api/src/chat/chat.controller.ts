import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type RequestWithUser } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { StartConversationDto } from './dto/start-conversation.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Список чатов текущего пользователя, новые сверху' })
  async listConversations(@Request() req: RequestWithUser) {
    return this.chatService.listConversations(req.user!.userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Найти или создать чат с пользователем по логину' })
  async startConversation(@Request() req: RequestWithUser, @Body() body: StartConversationDto) {
    return this.chatService.startConversation(req.user!.userId, body.login);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'История сообщений чата (последние 200, по возрастанию времени)' })
  async listMessages(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.chatService.listMessages(id, req.user!.userId);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Отметить чат прочитанным до текущего момента' })
  async markRead(@Param('id') id: string, @Request() req: RequestWithUser) {
    const { otherUserId, readAt } = await this.chatService.markRead(id, req.user!.userId);
    this.chatGateway.server.to(`user:${otherUserId}`).emit('conversation:read', { conversationId: id, readAt });
    return { ok: true };
  }

  @Get('users/search')
  @ApiOperation({ summary: 'Поиск пользователей по логину — для начала нового чата' })
  async searchUsers(@Query('q') q: string, @Request() req: RequestWithUser) {
    return this.chatService.searchUsers(q ?? '', req.user!.userId);
  }
}
