/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MOCK_DATE } from '@app/constants/chat-mocks';
import { CHAT_REACTIVATED } from '@app/constants/chat-state-messages';
import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { GAME_VALID_QUESTION } from '@app/constants/game-mocks';
import { BAN_PLAYER, NO_MORE_HOST } from '@app/constants/match-errors';
import { HOST_CONFLICT, INVALID_CODE } from '@app/constants/match-login-errors';
import {
    MOCK_MATCH_ROOM,
    MOCK_PLAYER,
    MOCK_PLAYER_ROOM,
    MOCK_RANDOM_MATCH_ROOM,
    MOCK_ROOM_CODE,
    MOCK_TEST_MATCH_ROOM,
    MOCK_USERNAME,
    MOCK_USER_INFO,
} from '@app/constants/match-mocks';
import { MatchGateway } from '@app/gateways/match/match.gateway';
import { Player } from '@app/model/schema/player.schema';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { HistoryService } from '@app/services/history/history.service';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { TimeService } from '@app/services/time/time.service';
import { PlayerState } from '@common/constants/player-states';
import { ChatEvents } from '@common/events/chat.events';
import { MatchEvents } from '@common/events/match.events';
import { Histogram } from '@common/interfaces/histogram';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('MatchGateway', () => {
    let gateway: MatchGateway;
    let histogramSpy: SinonStubbedInstance<HistogramService>;
    let matchRoomSpy: SinonStubbedInstance<MatchRoomService>;
    let matchBackupSpy: SinonStubbedInstance<MatchBackupService>;
    let timeSpy: SinonStubbedInstance<TimeService>;
    let playerRoomSpy: SinonStubbedInstance<PlayerRoomService>;
    let historySpy: SinonStubbedInstance<HistoryService>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let eventEmitter: EventEmitter2;

    beforeEach(async () => {
        histogramSpy = createStubInstance(HistogramService);
        matchRoomSpy = createStubInstance(MatchRoomService);
        matchBackupSpy = createStubInstance(MatchBackupService);
        timeSpy = createStubInstance(TimeService);
        historySpy = createStubInstance(HistoryService);
        playerRoomSpy = createStubInstance(PlayerRoomService);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchGateway,
                { provide: HistogramService, useValue: histogramSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: MatchBackupService, useValue: matchBackupSpy },
                { provide: TimeService, useValue: timeSpy },
                { provide: PlayerRoomService, useValue: playerRoomSpy },
                { provide: HistoryService, useValue: historySpy },
                EventEmitter2,
            ],
        }).compile();

        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
        gateway = module.get<MatchGateway>(MatchGateway);
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

    it('joinRoom() should let the player join if the room code and the username are valid', () => {
        matchRoomSpy.getRoomCodeErrors.returns('');
        matchRoomSpy.getRoom.returns(MOCK_MATCH_ROOM);
        playerRoomSpy.getUsernameErrors.returns('');
        playerRoomSpy.addPlayer.returns(MOCK_PLAYER);
        const result = gateway.joinRoom(socket, MOCK_USER_INFO);
        expect(socket.join.calledOnce).toBeTruthy();
        expect(playerRoomSpy.addPlayer.calledOnce).toBeTruthy();
        expect(result).toEqual({ code: MOCK_USER_INFO.roomCode, username: MOCK_PLAYER.username, isRandomMode: false });
    });

    it('joinRoom() should not let the player join if the room code or the username are invalid', () => {
        matchRoomSpy.getRoomCodeErrors.returns(INVALID_CODE);
        playerRoomSpy.getUsernameErrors.returns(HOST_CONFLICT);
        const sendErrorSpy = jest.spyOn(gateway, 'sendError').mockReturnThis();
        server.in.returns({
            disconnectSockets: () => {
                return null;
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.joinRoom(socket, MOCK_USER_INFO);
        expect(socket.join.calledOnce).toBeFalsy();
        expect(sendErrorSpy).toHaveBeenCalled();
    });

    it('createRoom() should let the host create a match room and let the host join the new room', async () => {
        matchRoomSpy.addRoom.returns(MOCK_MATCH_ROOM);
        const result = await gateway.createRoom(socket, {
            gameId: MOCK_MATCH_ROOM.game.id,
            isTestPage: MOCK_MATCH_ROOM.isTestRoom,
            isRandomMode: MOCK_MATCH_ROOM.isRandomMode,
        });
        expect(socket.join.calledOnce).toBeTruthy();
        expect(result).toEqual({ code: MOCK_MATCH_ROOM.code });
    });

    it('createRoom() should let host create a testing match room and let host join as the only player in the new room', async () => {
        matchRoomSpy.addRoom.returns(MOCK_TEST_MATCH_ROOM);
        const result = await gateway.createRoom(socket, {
            gameId: MOCK_TEST_MATCH_ROOM.game.id,
            isTestPage: MOCK_TEST_MATCH_ROOM.isTestRoom,
            isRandomMode: MOCK_MATCH_ROOM.isRandomMode,
        });
        expect(socket.join.calledOnce).toBeTruthy();
        expect(result).toEqual({ code: MOCK_TEST_MATCH_ROOM.code });
    });

    it('createRoom() should let host create a random match room and let host join as a regular player', async () => {
        matchRoomSpy.addRoom.returns(MOCK_RANDOM_MATCH_ROOM);
        matchBackupSpy.getBackupGame.returns(GAME_VALID_QUESTION);
        const result = await gateway.createRoom(socket, {
            gameId: MOCK_RANDOM_MATCH_ROOM.game.id,
            isTestPage: MOCK_RANDOM_MATCH_ROOM.isTestRoom,
            isRandomMode: MOCK_RANDOM_MATCH_ROOM.isRandomMode,
        });
        expect(socket.join.calledOnce).toBeTruthy();
        expect(result).toEqual({ code: MOCK_RANDOM_MATCH_ROOM.code });
    });

    it('routeToResultsPage() should emit a routing event to a room, save history and call emitHistogramHistory', () => {
        jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(0);
        const mockRoom = { ...MOCK_PLAYER_ROOM };
        mockRoom.players[0].isChatActive = false;
        mockRoom.players[0].socket = socket;
        matchRoomSpy.matchRooms = [mockRoom];
        const spy = jest.spyOn<any, any>(gateway, 'emitHistogramHistory').mockReturnThis();
        const stateSpy = jest.spyOn(playerRoomSpy, 'setStateForAll').mockReturnThis();
        const spyHistory = jest.spyOn(historySpy, 'createHistoryItem').mockReturnThis();
        server.to.returns({
            emit: (event: string) => {
                expect(event).toBe('routeToResultsPage');
            },
        } as BroadcastOperator<unknown, unknown>);
        server.in.returns({
            emit: (event: string, notificationMessage: string) => {
                expect(event).toEqual(ChatEvents.ChatReactivated);
                expect(notificationMessage).toEqual(CHAT_REACTIVATED);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.routeToResultsPage(socket, MOCK_ROOM_CODE);
        expect(spy).toHaveBeenCalled();
        expect(spyHistory).toHaveBeenCalled();
        expect(stateSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE, PlayerState.default);
    });

    it('emitHistogramHistory() should emit a list of histograms to a given room', () => {
        const histograms = [] as Histogram[];
        histogramSpy.sendHistogramHistory.returns(histograms);
        server.to.returns({
            emit: (event: string, res) => {
                expect(event).toBe('histogramHistory');
                expect(res).toBe(histograms);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway['emitHistogramHistory'](MOCK_ROOM_CODE);
    });

    it('isRoomEmpty() should return true if room is empty', () => {
        const room = { ...MOCK_PLAYER_ROOM };
        room.players[0].isPlaying = false;
        const result = gateway['isRoomEmpty'](room);
        expect(result).toBe(true);
    });

    it('isRoomEmpty() should return false if room is not empty', () => {
        const room = { ...MOCK_PLAYER_ROOM };
        room.players[0].isPlaying = true;
        const result = gateway['isRoomEmpty'](room);
        expect(result).toBe(false);
    });

    it('toggleLock() should call toggleLock', () => {
        const toggleSpy = jest.spyOn(matchRoomSpy, 'toggleLock').mockReturnThis();
        gateway.toggleLock(socket, '');
        expect(toggleSpy).toHaveBeenCalled();
    });

    it('banUsername() should add username to banned usernames list, and delete player if applicable, then update list', () => {
        const addBannedUsernameSpy = jest.spyOn(playerRoomSpy, 'addBannedUsername').mockReturnThis();
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.socket = socket;
        const errorSpy = jest.spyOn(gateway, 'sendError').mockReturnThis();
        const playerSpy = jest.spyOn(playerRoomSpy, 'getPlayerByUsername').mockReturnValue(mockPlayer);
        const deleteSpy = jest.spyOn(playerRoomSpy, 'deletePlayer').mockReturnThis();
        server.in.returns({
            disconnectSockets: () => {
                return null;
            },
            emit: (event: string) => {
                expect(event).toBe('kickPlayer');
            },
        } as BroadcastOperator<unknown, unknown>);
        const sendSpy = jest.spyOn(gateway, 'sendPlayersData').mockReturnThis();
        gateway.banUsername(socket, MOCK_USER_INFO);
        expect(addBannedUsernameSpy).toHaveBeenCalledWith(MOCK_USER_INFO.roomCode, MOCK_USER_INFO.username);
        expect(playerSpy).toHaveBeenCalledWith(MOCK_USER_INFO.roomCode, MOCK_USER_INFO.username);
        expect(deleteSpy).toHaveBeenCalledWith(MOCK_USER_INFO.roomCode, MOCK_USER_INFO.username);
        expect(sendSpy).toHaveBeenCalledWith(socket, MOCK_USER_INFO.roomCode);
        expect(errorSpy).toHaveBeenCalledWith(mockPlayer.socket.id, BAN_PLAYER);
    });

    it('banUsername() should add username to banned usernames list then update list (if player is not found)', () => {
        const addBannedUsernameSpy = jest.spyOn(playerRoomSpy, 'addBannedUsername').mockReturnThis();
        const playerSpy = jest.spyOn(playerRoomSpy, 'getPlayerByUsername').mockReturnValue(undefined);
        const deleteSpy = jest.spyOn(playerRoomSpy, 'deletePlayer').mockReturnThis();
        const sendSpy = jest.spyOn(gateway, 'sendPlayersData').mockReturnThis();
        gateway.banUsername(socket, MOCK_USER_INFO);
        expect(addBannedUsernameSpy).toHaveBeenCalledWith(MOCK_USER_INFO.roomCode, MOCK_USER_INFO.username);
        expect(playerSpy).toHaveBeenCalledWith(MOCK_USER_INFO.roomCode, MOCK_USER_INFO.username);
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith(socket, MOCK_USER_INFO.roomCode);
    });

    it('sendPlayersData() should check if the socket is in the right room and handle the data', () => {
        const spy = jest.spyOn(gateway, 'handleSendPlayersData').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        gateway.sendPlayersData(socket, MOCK_ROOM_CODE);
        expect(spy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
    });

    it('sendPlayersData() should not handle the data if the socket is not in the right room', () => {
        const spy = jest.spyOn(gateway, 'handleSendPlayersData').mockReturnThis();
        stub(socket, 'rooms').value(new Set([]));
        gateway.sendPlayersData(socket, MOCK_ROOM_CODE);
        expect(spy).not.toHaveBeenCalled();
    });

    it('deleteRoom() should disconnect all sockets and delete the match room', () => {
        const deleteSpy = jest.spyOn(matchRoomSpy, 'deleteRoom').mockReturnThis();
        server.in.returns({
            disconnectSockets: () => {
                return null;
            },
        } as BroadcastOperator<unknown, unknown>);

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(MatchEvents.HostQuitMatch);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.deleteRoom('');
        expect(deleteSpy).toHaveBeenCalled();
    });

    it('handleDisconnect() should disconnect host and all other players and delete the match room if the host disconnects', () => {
        matchRoomSpy.getRoomCodeByHostSocket.returns(MOCK_ROOM_CODE);
        matchRoomSpy.getRoom.returns(MOCK_MATCH_ROOM);
        const errorSpy = jest.spyOn(gateway, 'sendError').mockReturnThis();
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(deleteSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE, NO_MORE_HOST);
    });

    it('handleDisconnect() should disconnect host and delete room if no more players in results page', () => {
        const mockRoom = { ...MOCK_MATCH_ROOM };
        const mockPlayer = { ...MOCK_PLAYER };
        mockPlayer.isPlaying = false;
        mockRoom.players = [mockPlayer];
        mockRoom.currentQuestionIndex = 1;
        mockRoom.gameLength = 1;
        mockRoom.isRandomMode = false;
        matchRoomSpy.getRoomCodeByHostSocket.returns(MOCK_ROOM_CODE);
        matchRoomSpy.getRoom.returns(mockRoom);
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(deleteSpy).toHaveBeenCalled();
    });

    it('handleDisconnect() should disconnect host and not delete room if players in results page', () => {
        const mockRoom = { ...MOCK_MATCH_ROOM };
        const mockPlayer = { ...MOCK_PLAYER };
        mockPlayer.isPlaying = true;
        mockRoom.players = [mockPlayer];
        mockRoom.currentQuestionIndex = 1;
        mockRoom.gameLength = 1;
        mockRoom.isRandomMode = false;
        matchRoomSpy.getRoomCodeByHostSocket.returns(MOCK_ROOM_CODE);
        matchRoomSpy.getRoom.returns(mockRoom);
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('handleDisconnect() should disconnect the player and update list if a player disconnects', () => {
        matchRoomSpy.getRoomCodeByHostSocket.returns('');
        playerRoomSpy.deletePlayerBySocket.returns(MOCK_ROOM_CODE);
        playerRoomSpy.getPlayerBySocket.returns(MOCK_PLAYER);
        const room = { ...MOCK_MATCH_ROOM };
        const mockPlayer: Player = { ...MOCK_PLAYER };
        room.players.push(mockPlayer);
        matchRoomSpy.getRoom.returns(MOCK_MATCH_ROOM);
        const handleSpy = jest.spyOn(gateway, 'handleSendPlayersData').mockReturnThis();
        const sendDisconnectMessageSpy = jest.spyOn(gateway, 'sendMessageOnDisconnect').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(handleSpy).toHaveBeenCalled();
        expect(sendDisconnectMessageSpy).toHaveBeenCalled();
    });

    it('handleDisconnect() should disconnect the player and delete the room if player is last one in the room', () => {
        matchRoomSpy.getRoomCodeByHostSocket.returns('');
        playerRoomSpy.deletePlayerBySocket.returns(MOCK_ROOM_CODE);
        playerRoomSpy.getPlayerBySocket.returns(MOCK_PLAYER);
        const room = { ...MOCK_MATCH_ROOM };
        room.hostSocket = socket;
        socket.connected = false;
        const mockPlayer: Player = { ...MOCK_PLAYER };
        mockPlayer.isPlaying = false;
        room.players = [mockPlayer];
        matchRoomSpy.getRoom.returns(room);
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        const sendDisconnectMessageSpy = jest.spyOn(gateway, 'sendMessageOnDisconnect').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(deleteSpy).toHaveBeenCalled();
        expect(sendDisconnectMessageSpy).not.toHaveBeenCalled();
    });

    it('handleDisconnect() should disconnect the player disconnect host as well if there are no more players', () => {
        matchRoomSpy.getRoomCodeByHostSocket.returns(undefined);
        const mockRoomToDelete = MOCK_MATCH_ROOM;
        mockRoomToDelete.players = [];
        mockRoomToDelete.isPlaying = true;
        playerRoomSpy.deletePlayerBySocket.returns(MOCK_ROOM_CODE);
        playerRoomSpy.getPlayerBySocket.returns(MOCK_PLAYER);
        matchRoomSpy.getRoom.returns(mockRoomToDelete);
        const errorSpy = jest.spyOn(gateway, 'sendError').mockReturnThis();
        const handleSpy = jest.spyOn(gateway, 'handleSendPlayersData').mockReturnThis();
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        const sendDisconnectMessageSpy = jest.spyOn(gateway, 'sendMessageOnDisconnect').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(errorSpy).toHaveBeenCalled();
        expect(handleSpy).not.toHaveBeenCalled();
        expect(deleteSpy).toHaveBeenCalled();
        expect(sendDisconnectMessageSpy).not.toHaveBeenCalled();
    });

    it('handleDisconnect() should do nothing if there is no corresponding roomCode for the player', () => {
        matchRoomSpy.getRoomCodeByHostSocket.returns(undefined);
        const mockRoomToDelete = MOCK_MATCH_ROOM;
        mockRoomToDelete.players = [];
        mockRoomToDelete.isPlaying = true;
        playerRoomSpy.deletePlayerBySocket.returns(undefined);
        playerRoomSpy.getPlayerBySocket.returns(undefined);
        const errorSpy = jest.spyOn(gateway, 'sendError').mockReturnThis();
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnThis();
        const handleSpy = jest.spyOn(gateway, 'handleSendPlayersData').mockReturnThis();
        const deleteSpy = jest.spyOn(gateway, 'deleteRoom').mockReturnThis();
        const sendDisconnectMessageSpy = jest.spyOn(gateway, 'sendMessageOnDisconnect').mockReturnThis();
        gateway.handleDisconnect(socket);
        expect(handleSpy).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(sendDisconnectMessageSpy).not.toHaveBeenCalled();
    });

    it('handleSendPlayersData() should emit a fetch event to the match room with a list of stringified players', () => {
        const getSpy = jest.spyOn(playerRoomSpy, 'getPlayersStringified').mockReturnValue('mock');
        server.to.returns({
            emit: (event: string, playersStringified: string) => {
                expect(event).toEqual(MatchEvents.FetchPlayersData);
                expect(playersStringified).toEqual('mock');
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSendPlayersData(MOCK_ROOM_CODE);
        expect(getSpy).toHaveBeenCalled();
    });

    it('sendMessageOnDisconnect() should emit a NewMessage event to the match room chat when a player leaves the game', () => {
        const playerLeftMessageMock = {
            roomCode: MOCK_ROOM_CODE,
            message: { author: '', text: `${MOCK_USERNAME} a quitté la partie.`, date: MOCK_DATE },
        };
        server.to.returns({
            emit: (event: string, res) => {
                expect(event).toEqual(ChatEvents.NewMessage);
                expect(res).toEqual(playerLeftMessageMock);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.sendMessageOnDisconnect(MOCK_ROOM_CODE, MOCK_USERNAME);
    });

    it('sendError() should send the error to the socketId', () => {
        server.to.returns({
            emit: (event: string, error: string) => {
                expect(event).toEqual(MatchEvents.Error);
                expect(error).toEqual(INVALID_CODE);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.sendError('', INVALID_CODE);
    });

    it('startMatch() should delegate starting match to match room service', () => {
        const markGameSpy = jest.spyOn(matchRoomSpy, 'markGameAsPlaying');
        const startSpy = jest.spyOn(matchRoomSpy, 'startMatch').mockReturnThis();
        const stateSpy = jest.spyOn(playerRoomSpy, 'setStateForAll').mockReturnThis();
        gateway.startMatch(socket, MOCK_ROOM_CODE);
        expect(startSpy).toHaveBeenCalledWith(socket, server, MOCK_ROOM_CODE);
        expect(markGameSpy).toHaveBeenCalled();
        expect(stateSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE, PlayerState.noInteraction);
    });

    it('nextQuestion() should delegate starting next question to match room service', () => {
        const nextSpy = jest.spyOn(matchRoomSpy, 'startNextQuestionCooldown').mockReturnThis();
        stub(socket, 'rooms').value(new Set([MOCK_ROOM_CODE]));
        const stateSpy = jest.spyOn(playerRoomSpy, 'setStateForAll').mockReturnThis();
        gateway.goToNextQuestion(socket, MOCK_ROOM_CODE);
        expect(nextSpy).toHaveBeenCalledWith(server, MOCK_ROOM_CODE);
        expect(stateSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE, PlayerState.noInteraction);
    });

    it('onCountdownTimerExpired() should call helper functions when CountdownTimerExpired event is emitted', () => {
        const sendFirstQuestionSpy = jest.spyOn(matchRoomSpy, 'sendFirstQuestion');

        eventEmitter.addListener(ExpiredTimerEvents.CountdownTimerExpired, gateway.onCountdownTimerExpired);
        expect(eventEmitter.hasListeners(ExpiredTimerEvents.CountdownTimerExpired)).toBe(true);

        server.in.returns({
            emit: (event: string) => {
                expect(event).toEqual('beginQuiz');
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.onCountdownTimerExpired(MOCK_ROOM_CODE);
        expect(sendFirstQuestionSpy).toHaveBeenCalledWith(server, MOCK_ROOM_CODE);

        eventEmitter.removeListener(ExpiredTimerEvents.CountdownTimerExpired, gateway.onCountdownTimerExpired);
    });

    it('onCooldownTimerExpired() should call helper functions when CooldownTimerExpired event is emitted', () => {
        const sendNextQuestionSpy = jest.spyOn(matchRoomSpy, 'sendNextQuestion').mockReturnThis();
        const histogramResetSpy = jest.spyOn(histogramSpy, 'resetChoiceTracker').mockReturnThis();
        const histogramSendSpy = jest.spyOn(histogramSpy, 'sendEmptyHistogram').mockReturnThis();
        jest.spyOn<any, any>(gateway, 'isTestRoom').mockReturnValue(false);
        jest.spyOn<any, any>(gateway, 'isRandomModeRoom').mockReturnValue(false);
        eventEmitter.addListener(ExpiredTimerEvents.CooldownTimerExpired, gateway.onCountdownTimerExpired);
        expect(eventEmitter.hasListeners(ExpiredTimerEvents.CooldownTimerExpired)).toBe(true);

        gateway.onCooldownTimerExpired(MOCK_ROOM_CODE);
        expect(sendNextQuestionSpy).toHaveBeenCalledWith(server, MOCK_ROOM_CODE);
        expect(histogramResetSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
        expect(histogramSendSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);

        eventEmitter.removeListener(ExpiredTimerEvents.CooldownTimerExpired, gateway.onCountdownTimerExpired);
    });

    it('isTestRoom() should return false if context is not test page', () => {
        const mockRoom = { ...MOCK_PLAYER_ROOM };
        mockRoom.code = MOCK_ROOM_CODE;
        mockRoom.hostSocket = mockRoom.players[0].socket;
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(mockRoom);
        const isTestPage = gateway['isTestRoom'](MOCK_ROOM_CODE);
        expect(isTestPage).toBe(false);
    });

    it('isTestRoom() should return false if context is a random match', () => {
        const mockRoom = { ...MOCK_RANDOM_MATCH_ROOM };
        mockRoom.code = MOCK_ROOM_CODE;
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(mockRoom);
        const isTestPage = gateway['isTestRoom'](MOCK_ROOM_CODE);
        expect(isTestPage).toBe(false);
    });

    it('isRandomModeRoom() should return true if random mode', () => {
        const mockRoom = { ...MOCK_RANDOM_MATCH_ROOM };
        mockRoom.code = MOCK_ROOM_CODE;
        mockRoom.isRandomMode = true;
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(mockRoom);
        const isRandomModeRoom = gateway['isRandomModeRoom'](MOCK_ROOM_CODE);
        expect(isRandomModeRoom).toBe(true);
    });

    it('onRouteToResultsPage() should call routeToResultsPage when RouteToResultsPage event is emitted', () => {
        const routeToResultsPageSpy = jest.spyOn(gateway, 'routeToResultsPage').mockReturnThis();

        eventEmitter.addListener(MatchEvents.RouteToResultsPage, gateway.onRouteToResultsPage);
        expect(eventEmitter.hasListeners(MatchEvents.RouteToResultsPage)).toBe(true);

        gateway.onRouteToResultsPage(MOCK_ROOM_CODE);
        expect(routeToResultsPageSpy).toHaveBeenCalledWith({}, MOCK_ROOM_CODE);

        eventEmitter.removeListener(MatchEvents.RouteToResultsPage, gateway.onCountdownTimerExpired);
    });
});
