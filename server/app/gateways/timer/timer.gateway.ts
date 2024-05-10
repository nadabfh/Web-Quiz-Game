import { TimeService } from '@app/services/time/time.service';
import { TimerEvents } from '@common/events/timer.events';
import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class TimerGateway {
    @WebSocketServer() private server: Server;

    constructor(private readonly timeService: TimeService) {}

    @SubscribeMessage(TimerEvents.PauseTimer)
    pauseTimer(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        this.timeService.pauseTimer(this.server, roomCode);
    }

    @SubscribeMessage(TimerEvents.PanicTimer)
    triggerPanicTimer(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        this.timeService.startPanicTimer(this.server, roomCode);
    }
}
