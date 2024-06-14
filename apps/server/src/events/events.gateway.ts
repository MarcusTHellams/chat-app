import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

const onlineUser = new Set();

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    console.log('connect User ', socket.id);
    const token: string = socket.handshake.auth.token;
    const user = await this.usersService.getUserDetailsFromToken(token);
    if ('userId' in user) {
      socket.join(`${user.userId}`);
      onlineUser.add(`${user.userId}`);
      socket.emit('onlineUser', Array.from(onlineUser));
    }
  }

  @SubscribeMessage('message-page')
  async onMessagePage(
    @MessageBody() userId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('userId: ', userId);
    const userDetails = await this.prisma.user.findUnique({
      where: { userId },
    });
    const payload = {
      userId: userDetails?.userId,
      name: userDetails?.name,
      email: userDetails?.email,
      profilePic: userDetails?.profilePic,
      online: onlineUser.has(`${userId}`),
    };
    socket.emit('message-user', payload);
    const conversationMessage = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {

          }
        ],
      },
    });
  }

  @SubscribeMessage('events')
  findAll(
    client: Socket,
    @MessageBody() data: any,
  ): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item })),
    );
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
