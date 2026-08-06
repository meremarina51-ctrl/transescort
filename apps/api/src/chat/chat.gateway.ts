import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

/**
 * Every authenticated socket auto-joins a personal room (`user:<id>`) on connect — no explicit
 * "join conversation" handshake needed. Sending a message broadcasts to both participants' rooms,
 * which covers every open tab/device and also lets the conversation list update live.
 */
@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger('ChatGateway');

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string | undefined) ?? (client.handshake.query?.token as string | undefined);
      if (!token) throw new Error('missing token');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
        issuer: 'transescort-api',
        audience: 'transescort-client',
      });
      if (payload.type !== 'access') throw new Error('invalid token type');

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Rejected socket connection: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('message:send')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() body: SendMessageDto) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { error: 'Не авторизован' };

    try {
      const { message, otherUserId } = await this.chatService.sendMessage(body.conversationId, userId, body.body);
      const payload = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt,
      };
      this.server.to(`user:${userId}`).to(`user:${otherUserId}`).emit('message:new', payload);
      return { ok: true, message: payload };
    } catch (error: any) {
      return { error: error?.message || 'Не удалось отправить сообщение' };
    }
  }
}
