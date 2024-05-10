import { Component, Input } from '@angular/core';
import { MatchContext } from '@app/constants/states';
import { Player } from '@app/interfaces/player';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';

@Component({
    selector: 'app-players-list',
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
    @Input() players: Player[];
    @Input() canHostToggleChatState: boolean = true;

    context = MatchContext;
    constructor(
        readonly matchRoomService: MatchRoomService,
        readonly chatService: ChatService,
        readonly matchContextService: MatchContextService,
    ) {}

    toggleChat(player: Player) {
        this.chatService.toggleChatState(this.matchRoomService.getRoomCode(), player.username);
        player.isChatActive = !player.isChatActive;
    }
}
