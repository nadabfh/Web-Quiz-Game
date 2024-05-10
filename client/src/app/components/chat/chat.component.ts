import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Message } from '@app/interfaces/message';

import { ChatService } from '@app/services/chat/chat.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { HOST_USERNAME } from '@common/constants/match-constants';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked, OnInit, OnDestroy {
    @ViewChild('messagesContainer', { static: true }) messagesContainer: ElementRef;

    @Input() disableMessagingField: boolean;

    constructor(
        readonly matchRoomService: MatchRoomService,
        readonly chatService: ChatService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.chatService.displayOldMessages();
        this.chatService.handleReceivedMessages();
    }

    ngAfterViewChecked() {
        const playerUsername = this.matchRoomService.getUsername();
        const player = this.matchRoomService.getPlayerByUsername(playerUsername);
        if (player) {
            this.disableMessagingField = !player.isChatActive;
        }

        this.scrollToBottom();
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        this.chatService.socketHandler.socket.removeListener('newMessage');
        this.chatService.socketHandler.socket.removeListener('fetchOldMessages');
    }

    sendMessage(messageText: string): void {
        const playerUsername = this.matchRoomService.getUsername();
        const isPlayerHost = playerUsername === HOST_USERNAME;
        const player = this.matchRoomService.getPlayerByUsername(playerUsername);

        if (player || isPlayerHost) {
            const isChatActiveForPlayer = player?.isChatActive;
            if (messageText) {
                const newMessage: Message = {
                    text: messageText,
                    author: this.matchRoomService.getUsername(),
                    date: new Date(),
                };
                if (isChatActiveForPlayer || isPlayerHost) {
                    this.chatService.sendMessage(this.matchRoomService.getRoomCode(), newMessage);
                }
            }
        }
    }

    private scrollToBottom(): void {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
}
