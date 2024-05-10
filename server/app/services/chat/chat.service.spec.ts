import { MOCK_MESSAGE, MOCK_ROOM_CODE } from '@app/constants/chat-mocks';
import { MOCK_MATCH_ROOM } from '@app/constants/match-mocks';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let matchRoomService: MatchRoomService;
    let mockMatchRooms: MatchRoom[];

    beforeEach(async () => {
        mockMatchRooms = [{ ...MOCK_MATCH_ROOM, messages: [] }];

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                {
                    provide: MatchRoomService,
                    useValue: {
                        getRoomIndex: jest.fn(),
                        matchRooms: mockMatchRooms,
                    },
                },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
        matchRoomService = module.get<MatchRoomService>(MatchRoomService);
    });

    const matchRoomCode = MOCK_MATCH_ROOM.code;
    const mockMessage = MOCK_MESSAGE;
    const mockRoomCode = MOCK_ROOM_CODE;
    const INDEX_NOT_FOUND = -1;

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add and get messages', () => {
        const matchRoomIndex = 0;
        jest.spyOn(matchRoomService, 'getRoomIndex').mockReturnValue(matchRoomIndex);
        service.addMessage(mockMessage, MOCK_MATCH_ROOM.code);
        const messages = service.getMessages(mockRoomCode);
        expect(messages).toEqual([mockMessage]);
        const returnedMessage = service.addMessage(mockMessage, mockRoomCode);
        expect(returnedMessage).toEqual(mockMessage);
    });

    it('should not add a message to a match room that does not exist', () => {
        jest.spyOn(matchRoomService, 'getRoomIndex').mockReturnValue(INDEX_NOT_FOUND);
        service.addMessage(mockMessage, matchRoomCode);
        const messages = service.getMessages(matchRoomCode);
        expect(messages).toEqual([]);
    });

    it('should return the added message', () => {
        const matchRoomIndex = 0;
        jest.spyOn(matchRoomService, 'getRoomIndex').mockReturnValue(matchRoomIndex);
        const returnedMessage = service.addMessage(mockMessage, matchRoomCode);
        expect(returnedMessage).toEqual(mockMessage);
    });
});
