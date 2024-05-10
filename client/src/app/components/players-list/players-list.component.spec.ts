import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player';
import { SortByScorePipe } from '@app/pipes/sort-by-score.pipe';
import { SortPlayersPipe } from '@app/pipes/sort-players.pipe';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayersListComponent } from './players-list.component';

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let matchRoomSpy: jasmine.SpyObj<MatchRoomService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        matchRoomSpy = jasmine.createSpyObj(MatchRoomService, ['gameOver', 'getUsername', 'getRoomCode']);
        matchRoomSpy.players = [];
        chatServiceSpy = jasmine.createSpyObj(ChatService, ['toggleChatState']);
        TestBed.configureTestingModule({
            declarations: [PlayersListComponent, SortByScorePipe, SortPlayersPipe],
            providers: [
                {
                    provide: MatchRoomService,
                    useValue: matchRoomSpy,
                },
                {
                    provide: ChatService,
                    useValue: chatServiceSpy,
                },
            ],
        });
        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        component.players = [] as Player[];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle chat state', () => {
        const player = { username: 'test', isChatActive: true } as Player;
        component.toggleChat(player);
        expect(matchRoomSpy.getRoomCode).toHaveBeenCalled();
        expect(player.isChatActive).toBeFalse();
    });
});
