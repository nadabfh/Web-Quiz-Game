/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MOCK_CHAT_STATE_DATA, MOCK_DATE, MOCK_MATCH_ROOM_INDEX, MOCK_PLAYER_INDEX } from '@app/constants/chat-mocks';
import { CHAT_DEACTIVATED, CHAT_REACTIVATED } from '@app/constants/chat-state-messages';
import { MOCK_MESSAGE_INFO, MOCK_PLAYER, MOCK_PLAYER_ROOM, MOCK_ROOM_CODE } from '@app/constants/match-mocks';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { ChatEvents } from '@common/events/chat.events';
import { MatchEvents } from '@common/events/match.events';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ChatGateway } from './chat.gateway';

describe('MatchGateway', () => {
    let gateway: ChatGateway;
    let chatSpy: SinonStubbedInstance<ChatService>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let matchRoomSpy: SinonStubbedInstance<MatchRoomService>;
    let playerRoomSpy: SinonStubbedInstance<PlayerRoomService>;

    beforeEach(async () => {
        chatSpy = createStubInstance(ChatService);
        matchRoomSpy = createStubInstance(MatchRoomService);
        playerRoomSpy = createStubInstance(PlayerRoomService);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: ChatService, useValue: chatSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: PlayerRoomService, useValue: playerRoomSpy },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        // We want to assign a value to the private field
        // eslint-disable-next-line dot-notation
        gateway['server'] = server;
    });

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_DATE);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleIncomingRoomMessages() should add the received message to the list of messages, and emit a newMessage event', () => {
        const mockMessageInfo = MOCK_MESSAGE_INFO;
        const sendSpy = jest.spyOn(gateway, 'sendMessageToClients').mockReturnThis();
        const addMessageSpy = jest.spyOn(chatSpy, 'addMessage').mockReturnThis();
        gateway.handleIncomingRoomMessages(socket, mockMessageInfo);
        expect(addMessageSpy).toHaveBeenCalledWith(mockMessageInfo.message, mockMessageInfo.roomCode);
        expect(sendSpy).toHaveBeenCalledWith(MOCK_MESSAGE_INFO);
    });

    it('sendMessageToClients() should emit a NewMessage event and send the messages to the players in the right room', () => {
        const toSpy = jest.spyOn(server, 'to').mockReturnValue({
            emit: (event: string, messageInfo) => {
                expect(event).toEqual('newMessage');
                expect(messageInfo).toEqual(MOCK_MESSAGE_INFO);
            },
        } as unknown as BroadcastOperator<DefaultEventsMap, unknown>);
        gateway.sendMessageToClients(MOCK_MESSAGE_INFO);
        expect(toSpy).toHaveBeenCalledWith(MOCK_MESSAGE_INFO.roomCode);
    });

    it('sendMessageToClients() should emit a NewMessage event to the player in the right room', () => {
        const spy = jest.spyOn(gateway, 'sendMessageToClients').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_MESSAGE_INFO.roomCode]));
        gateway.sendMessageToClients(MOCK_MESSAGE_INFO);
        expect(spy).toHaveBeenCalledWith(MOCK_MESSAGE_INFO);
    });

    it('sendMessagesHistory() should call handleSentMessagesHistory if it is in the correct room', () => {
        const mockMatchRoomCode = MOCK_ROOM_CODE;
        const handleSentMessagesHistorySpy = jest.spyOn(gateway, 'handleSentMessagesHistory').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.sendMessagesHistory(socket, mockMatchRoomCode);
        expect(handleSentMessagesHistorySpy).toHaveBeenCalledWith(mockMatchRoomCode);
    });

    it('handleSentMessagesHistory() should emit fetchOldMessages event and get the messages', () => {
        const mockMatchRoomCode = MOCK_MESSAGE_INFO.roomCode;
        const mockMessageInfo = MOCK_MESSAGE_INFO;
        const mockMessages = [mockMessageInfo.message, mockMessageInfo.message];
        const getMessagesSpy = jest.spyOn(chatSpy, 'getMessages').mockReturnValue(mockMessages);

        server.to.returns({
            emit: (event: string, res) => {
                expect(event).toEqual(ChatEvents.FetchOldMessages);
                expect(res).toEqual(mockMessages);
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleSentMessagesHistory(mockMatchRoomCode);
        expect(getMessagesSpy).toHaveBeenCalledWith(mockMatchRoomCode);
    });

    it('changeMessagingState() should emit the chat state', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockRoomIndex = MOCK_MATCH_ROOM_INDEX;
        const mockPlayerIndex = MOCK_PLAYER_INDEX;
        const mockPlayer = MOCK_PLAYER;
        const mockChatStateData = MOCK_CHAT_STATE_DATA;
        mockPlayer.socket = socket;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];
        const getRoomIndexSpy = jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(mockRoomIndex);
        const getRoomSpy = jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(mockRoom);
        const toggleChatStateSpy = jest.spyOn(gateway, 'toggleChatState').mockReturnThis();
        const getPlayerByUsernameSpy = jest.spyOn(playerRoomSpy, 'getPlayerByUsername').mockReturnValue(mockPlayer);
        const emitCurrentChatStateSpy = jest.spyOn(gateway, 'emitCurrentChatState').mockReturnThis();
        const emitChatStatusChangeSpy = jest.spyOn(gateway, 'emitChatStatusNotification').mockReturnThis();
        gateway.changeMessagingState(socket, mockChatStateData);
        expect(getRoomIndexSpy).toHaveBeenCalledWith(mockChatStateData.roomCode);
        expect(getRoomSpy).toHaveBeenCalledWith(mockChatStateData.roomCode);
        expect(toggleChatStateSpy).toHaveBeenCalled();
        expect(getPlayerByUsernameSpy).toHaveBeenCalledWith(mockChatStateData.roomCode, mockChatStateData.playerUsername);
        expect(emitCurrentChatStateSpy).toHaveBeenCalled();
        expect(emitChatStatusChangeSpy).toHaveBeenCalledWith(mockPlayer.socket.id, mockRoomIndex, mockPlayerIndex);
    });

    it('toggleChatState() should toggle chat state correctly', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockRoomIndex = MOCK_MATCH_ROOM_INDEX;
        const mockPlayerIndex = MOCK_PLAYER_INDEX;
        matchRoomSpy.matchRooms = [mockRoom];
        gateway.toggleChatState(mockRoomIndex, mockPlayerIndex);
        expect(mockRoom.players[mockPlayerIndex].isChatActive).toEqual(false);
    });

    it('emitCurrentChatState() should emit current chat state correctly', () => {
        const mockRoomCode = MOCK_ROOM_CODE;
        const mockRoomIndex = MOCK_MATCH_ROOM_INDEX;
        const mockPlayerIndex = MOCK_PLAYER_INDEX;
        const mockRoom = MOCK_PLAYER_ROOM;
        matchRoomSpy.matchRooms = [mockRoom];

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.ReturnCurrentChatState);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.emitCurrentChatState(mockRoomCode, mockRoomIndex, mockPlayerIndex);
    });

    it('emitChatStatusNotification() should send the notification to the player when the chat is deactivated', () => {
        const mockRoomIndex = MOCK_MATCH_ROOM_INDEX;
        const mockPlayerIndex = MOCK_PLAYER_INDEX;
        const mockRoom = MOCK_PLAYER_ROOM;
        matchRoomSpy.matchRooms = [mockRoom];
        server.in.returns({
            emit: (event: string, error: string) => {
                expect(event).toEqual(MatchEvents.Error);
                expect(error).toEqual(CHAT_DEACTIVATED);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.emitChatStatusNotification(socket.id, mockRoomIndex, mockPlayerIndex);
    });

    it('emitChatStatusNotification() should send the notification to the player when the chat is reactivated', () => {
        const mockRoomIndex = MOCK_MATCH_ROOM_INDEX;
        const mockPlayerIndex = MOCK_PLAYER_INDEX;
        const mockRoom = MOCK_PLAYER_ROOM;
        matchRoomSpy.matchRooms = [mockRoom];
        gateway.toggleChatState(mockRoomIndex, mockPlayerIndex);
        server.in.returns({
            emit: (event: string, notificationMessage: string) => {
                expect(event).toEqual(ChatEvents.ChatReactivated);
                expect(notificationMessage).toEqual(CHAT_REACTIVATED);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.emitChatStatusNotification(socket.id, mockRoomIndex, mockPlayerIndex);
    });
});
