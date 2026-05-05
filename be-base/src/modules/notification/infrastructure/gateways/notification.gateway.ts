import { Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../../../../core/auth/domain/services/token.service';
import type { INotificationEmitter } from '../../application/ports/notification-emitter.port';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, INotificationEmitter
{
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  handleConnection(client: Socket): void {
    let token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
      token = match ? decodeURIComponent(match[1]) : undefined;
    }

    if (!token) {
      client.disconnect();
      return;
    }

    let payload: { sub: string; type: string } | null = null;

    try {
      // Ưu tiên verify đầy đủ (kể cả expiry)
      payload = this.tokenService.verifyAccessToken(token);
    } catch {
      try {
        // Nếu chỉ expired (chữ ký vẫn hợp lệ) → vẫn cho join room.
        // HTTP endpoints vẫn block bình thường; WS chỉ nhận push, không có write.
        payload = this.tokenService.verifyAccessTokenIgnoreExpiry(token);
        this.logger.debug(
          `WS: expired token accepted for ${payload.type}:${payload.sub}`,
        );
      } catch {
        client.disconnect();
        return;
      }
    }

    client.join(`${payload.type}:${payload.sub}`);
    client.data.userId = payload.sub;
    client.data.userType = payload.type;
    this.logger.debug(`Connected: ${payload.type}:${payload.sub}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Disconnected: ${client.id}`);
  }

  emitToRecipient(
    recipientId: string,
    recipientType: string,
    payload: unknown,
  ): void {
    this.server
      .to(`${recipientType}:${recipientId}`)
      .emit('notification', payload);
  }
}
