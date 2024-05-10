import { Message } from '@app/model/schema/message.schema';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { Injectable } from '@nestjs/common';

const INDEX_NOT_FOUND = -1;

@Injectable()
export class ChatService {
    constructor(private readonly matchRoomService: MatchRoomService) {}

    addMessage(message: Message, roomCode: string) {
        const matchRoomIndex = this.matchRoomService.getRoomIndex(roomCode);
        if (matchRoomIndex === INDEX_NOT_FOUND) {
            return;
        }
        this.matchRoomService.matchRooms[matchRoomIndex].messages.push(message);
        return message;
    }

    getMessages(roomCode: string): Message[] {
        const matchRoomIndex = this.matchRoomService.getRoomIndex(roomCode);
        if (matchRoomIndex === INDEX_NOT_FOUND) {
            return [];
        }
        return this.matchRoomService.matchRooms[matchRoomIndex].messages;
    }
}
