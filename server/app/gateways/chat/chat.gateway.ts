import { CHAT_DEACTIVATED, CHAT_REACTIVATED } from '@app/constants/chat-state-messages';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { ChatEvents } from '@common/events/chat.events';
import { MatchEvents } from '@common/events/match.events';
import { ChatStateInfo, MessageInfo } from '@common/interfaces/message-info';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const INDEX_NOT_FOUND = -1;

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer() private server: Server;

    constructor(
        private readonly chatService: ChatService,
        readonly playerRoomService: PlayerRoomService,
        private readonly matchRoomService: MatchRoomService,
    ) {}

    @SubscribeMessage(ChatEvents.RoomMessage)
    handleIncomingRoomMessages(@ConnectedSocket() socket: Socket, @MessageBody() data: MessageInfo) {
        this.chatService.addMessage(data.message, data.roomCode);
        this.sendMessageToClients(data);
    }

    @SubscribeMessage(ChatEvents.SendMessagesHistory)
    sendMessagesHistory(@ConnectedSocket() socket: Socket, @MessageBody() matchRoomCode: string) {
        if (socket.rooms.has(matchRoomCode)) {
            this.handleSentMessagesHistory(matchRoomCode);
        }
    }

    @SubscribeMessage(ChatEvents.ChangeChatState)
    changeMessagingState(@ConnectedSocket() socket: Socket, @MessageBody() data: ChatStateInfo) {
        const roomIndex = this.matchRoomService.getRoomIndex(data.roomCode);
        const playerIndex = this.matchRoomService.getRoom(data.roomCode).players.findIndex((player) => {
            return player.username === data.playerUsername;
        });
        const playerByUsername = this.playerRoomService.getPlayerByUsername(data.roomCode, data.playerUsername);

        if (roomIndex !== INDEX_NOT_FOUND && playerIndex !== INDEX_NOT_FOUND) {
            this.toggleChatState(roomIndex, playerIndex);
        }

        this.emitCurrentChatState(playerByUsername.socket.id, roomIndex, playerIndex);
        this.emitChatStatusNotification(playerByUsername.socket.id, roomIndex, playerIndex);
    }

    sendMessageToClients(data: MessageInfo) {
        this.server.to(data.roomCode).emit(ChatEvents.NewMessage, data);
    }

    handleSentMessagesHistory(matchRoomCode: string) {
        this.server.to(matchRoomCode).emit(ChatEvents.FetchOldMessages, this.chatService.getMessages(matchRoomCode));
    }

    toggleChatState(roomIndex: number, playerIndex: number): void {
        const room = this.matchRoomService.matchRooms[roomIndex];
        room.players[playerIndex].isChatActive = !room.players[playerIndex].isChatActive;
    }

    emitCurrentChatState(socketId: string, roomIndex: number, playerIndex: number): void {
        this.server
            .to(socketId)
            .emit(ChatEvents.ReturnCurrentChatState, this.matchRoomService.matchRooms[roomIndex].players[playerIndex].isChatActive);
    }

    emitChatStatusNotification(socketId: string, roomIndex: number, playerIndex: number): void {
        const event = this.matchRoomService.matchRooms[roomIndex].players[playerIndex].isChatActive ? ChatEvents.ChatReactivated : MatchEvents.Error;
        const notificationMessage = this.matchRoomService.matchRooms[roomIndex].players[playerIndex].isChatActive
            ? CHAT_REACTIVATED
            : CHAT_DEACTIVATED;
        this.server.in(socketId).emit(event, notificationMessage);
    }
}
