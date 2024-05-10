import { BANNED_USERNAME, HOST_CONFLICT, USED_USERNAME } from '@app/constants/match-login-errors';
import { MOCK_MATCH_ROOM, MOCK_PLAYER, MOCK_PLAYER_ROOM, MOCK_ROOM_CODE, MOCK_USERNAME } from '@app/constants/match-mocks';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { Player } from '@app/model/schema/player.schema';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { HOST_USERNAME } from '@common/constants/match-constants';
import { PlayerState } from '@common/constants/player-states';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';
import { PlayerRoomService } from './player-room.service';

describe('PlayerRoomService', () => {
    let emitMock;
    let mockSocket;
    let service: PlayerRoomService;
    let matchRoomSpy: SinonStubbedInstance<MatchRoomService>;
    let socket: SinonStubbedInstance<Socket>;

    beforeEach(async () => {
        emitMock = jest.fn();
        mockSocket = {
            id: '',
            to: jest.fn().mockReturnValueOnce({ emit: emitMock }),
            send: jest.fn().mockReturnValueOnce({ emit: emitMock }),
            emit: emitMock,
        };

        matchRoomSpy = createStubInstance(MatchRoomService);
        socket = createStubInstance<Socket>(Socket);
        const module: TestingModule = await Test.createTestingModule({
            providers: [PlayerRoomService, { provide: MatchRoomService, useValue: matchRoomSpy }],
        }).compile();

        service = module.get<PlayerRoomService>(PlayerRoomService);
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(MOCK_PLAYER_ROOM);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getPlayers() should return an array of players in the MatchRoom with the corresponding code', () => {
        const result = service.getPlayers('');
        expect(result).toEqual([MOCK_PLAYER]);
    });

    it('getPlayersStringified() should return the list of stringified players without socket attribute', () => {
        jest.spyOn(service, 'getPlayers').mockReturnValue([MOCK_PLAYER]);
        const expectedResult =
            // disable max lines since cant be split for string comparision
            // eslint-disable-next-line max-len
            '[{"username":"","answer":{"isSubmitted":false,"selectedChoices":{}},"score":0,"answerCorrectness":0,"bonusCount":0,"isPlaying":true,"isChatActive":true,"state":"default"}]';
        const result = service.getPlayersStringified('');
        expect(result).toEqual(expectedResult);
    });

    it('addPlayer() should not add player if the username is invalid', () => {
        const validateSpy = jest.spyOn(service, 'getUsernameErrors').mockReturnValue(HOST_CONFLICT);
        const result = service.addPlayer(socket, '', '');
        expect(result).toBeFalsy();
        expect(validateSpy).toHaveBeenCalled();
    });

    it('addPlayer() should add the player if the username is valid', () => {
        const validateSpy = jest.spyOn(service, 'getUsernameErrors').mockReturnValue('');
        const pushSpy = jest.spyOn(Array.prototype, 'push');
        const mockUsername = 'mock';
        const expectedResult: Player = {
            username: mockUsername,
            answer: { selectedChoices: new Map<string, boolean>(), isSubmitted: false } as MultipleChoiceAnswer,
            score: 0,
            answerCorrectness: AnswerCorrectness.WRONG,
            bonusCount: 0,
            isPlaying: true,
            isChatActive: true,
            socket,
            state: PlayerState.default,
        };
        const result = service.addPlayer(socket, '', mockUsername);
        expect(result).toEqual(expectedResult);
        expect(validateSpy).toHaveBeenCalled();
        expect(pushSpy).toHaveBeenCalled();
    });

    it('deletePlayerBySocket() should delete the player if the foundMatchRoom is not playing yet', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        mockRoom.isPlaying = false;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.socket = socket;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];

        const deleteSpy = jest.spyOn(service, 'deletePlayer').mockReturnThis();
        const inactiveSpy = jest.spyOn(service, 'makePlayerInactive').mockReturnThis();

        const result = service.deletePlayerBySocket(socket.id);
        expect(result).toEqual(MOCK_PLAYER_ROOM.code);
        expect(deleteSpy).toHaveBeenCalled();
        expect(inactiveSpy).not.toHaveBeenCalled();
    });

    it('getPlayerBySocket() should delete the player if the foundMatchRoom is not playing yet', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.socket = socket;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];
        const result = service.getPlayerBySocket(socket.id);
        expect(result).toEqual(MOCK_PLAYER);
    });

    it('deletePlayerBySocket() should make the player inactive if the foundMatchRoom is playing', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        mockRoom.isPlaying = true;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.socket = socket;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];

        const deleteSpy = jest.spyOn(service, 'deletePlayer').mockReturnThis();
        const inactiveSpy = jest.spyOn(service, 'makePlayerInactive').mockReturnThis();

        const result = service.deletePlayerBySocket(socket.id);
        expect(result).toEqual(MOCK_PLAYER_ROOM.code);
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(inactiveSpy).toHaveBeenCalled();
    });

    it('deletePlayerBySocket() should return undefined if player and room are not found', () => {
        matchRoomSpy.matchRooms = [MOCK_MATCH_ROOM];

        const deleteSpy = jest.spyOn(service, 'deletePlayer').mockReturnThis();
        const inactiveSpy = jest.spyOn(service, 'makePlayerInactive').mockReturnThis();

        const result = service.deletePlayerBySocket('');
        expect(result).toEqual(undefined);
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(inactiveSpy).not.toHaveBeenCalled();
    });

    it('getPlayerByusername() should return the player with the corresponding username (non case sensitive)', () => {
        const searchedPlayer = MOCK_PLAYER;
        searchedPlayer.username = MOCK_USERNAME;
        const otherPlayer: Player = {
            username: '',
            score: 0,
            bonusCount: 0,
            isPlaying: false,
            socket: undefined,
        } as Player;
        jest.spyOn(service, 'getPlayers').mockReturnValue([searchedPlayer, otherPlayer]);
        expect(service.getPlayerByUsername('', searchedPlayer.username)).toEqual(searchedPlayer);
        expect(service.getPlayerByUsername('', searchedPlayer.username.toUpperCase())).toEqual(searchedPlayer);
    });

    it('makePlayerInactive() should set the player isPlaying property to false', () => {
        const cases = [true, false];
        cases.forEach((playingState: boolean) => {
            const mockRoom = MOCK_PLAYER_ROOM;
            const mockPlayer = MOCK_PLAYER;
            const mockUsername = MOCK_USERNAME;
            mockPlayer.username = mockUsername;
            mockPlayer.isPlaying = playingState;
            mockRoom.players = [mockPlayer];
            matchRoomSpy.matchRooms = [mockRoom];

            jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(0);
            jest.spyOn(matchRoomSpy, 'getRoom').mockClear();
            jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(mockRoom);
            service.makePlayerInactive('', mockUsername);
            expect(matchRoomSpy.matchRooms[0].players[0].isPlaying).toBeFalsy();
            expect(matchRoomSpy.matchRooms[0].players[0].state).toEqual(PlayerState.exit);
        });
    });

    it('deletePlayer() should remove player from the MatchRoom', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.username = MOCK_USERNAME;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];

        jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(0);
        service.deletePlayer('', MOCK_USERNAME);
        expect(matchRoomSpy.matchRooms[0].players.length).toEqual(0);
    });

    it('getBannedUsernames() should return banned usernames', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        mockRoom.bannedUsernames = [MOCK_USERNAME];
        matchRoomSpy.matchRooms = [mockRoom];
        expect(service.getBannedUsernames('')).toEqual([MOCK_USERNAME]);
    });

    it('addBannedUsernames() should add username to bannedUsernames list from matchRoomService', () => {
        const pushSpy = jest.spyOn(Array.prototype, 'push');
        service.addBannedUsername('', MOCK_USERNAME);
        expect(pushSpy).toHaveBeenCalledWith(MOCK_USERNAME.toUpperCase());
    });

    it('isBannedUsername() should return true if username is banned', () => {
        jest.spyOn(service, 'getBannedUsernames').mockReturnValue([MOCK_USERNAME]);
        expect(service.isBannedUsername('', MOCK_USERNAME)).toEqual(true);
    });

    it('isBannedUsername() should return false if username is not banned', () => {
        jest.spyOn(service, 'getBannedUsernames').mockReturnValue([]);
        expect(service.isBannedUsername('', MOCK_USERNAME)).toEqual(false);
    });

    it('getUsernameErrors() should applicable errors', () => {
        const testCases = [
            { username: MOCK_USERNAME, isBanned: false, isUsed: false, expectedResult: '' },
            { username: HOST_USERNAME, isBanned: false, isUsed: false, expectedResult: HOST_CONFLICT },
            { username: MOCK_USERNAME, isBanned: true, isUsed: false, expectedResult: BANNED_USERNAME },
            { username: MOCK_USERNAME, isBanned: false, isUsed: true, expectedResult: USED_USERNAME },
        ];
        for (const { username, isBanned, isUsed, expectedResult } of testCases) {
            const banSpy = jest.spyOn(service, 'isBannedUsername').mockReturnValue(isBanned);
            const usedSpy = jest.spyOn(service, 'getPlayerByUsername').mockReturnValue(isUsed ? MOCK_PLAYER : undefined);
            const result = service.getUsernameErrors('', username);
            expect(banSpy).toHaveBeenCalled();
            expect(usedSpy).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        }
    });

    it('getUsernameErrors() should return empty string if used in testPage', () => {
        matchRoomSpy.getRoom(MOCK_ROOM_CODE).isTestRoom = true;
        MOCK_PLAYER.username = HOST_USERNAME;
        matchRoomSpy.getRoom(MOCK_ROOM_CODE).players = [];
        jest.spyOn(service, 'isHostPlayer').mockReturnValue(true);
        jest.spyOn(service, 'isHostUsernameCorrect').mockReturnValue(true);

        const result = service.getUsernameErrors(MOCK_ROOM_CODE, HOST_USERNAME);
        expect(result).toBe('');
    });

    it('setStateForAll() should change state for all players in match room', () => {
        jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(0);
        const sendSpy = jest.spyOn(service, 'sendPlayersToHost').mockReturnThis();
        const mockRoom = MOCK_MATCH_ROOM;
        mockRoom.players = [
            { state: PlayerState.default } as Player,
            { state: PlayerState.default } as Player,
            { state: PlayerState.exit } as Player,
        ];
        matchRoomSpy.matchRooms = [mockRoom];
        service.setStateForAll(mockRoom.code, 'mock');
        expect(
            matchRoomSpy.matchRooms[0].players.every((player: Player) =>
                player.state === PlayerState.exit ? player.state === PlayerState.exit : player.state === 'mock',
            ),
        );
        expect(sendSpy).toHaveBeenCalledWith(MOCK_PLAYER_ROOM.code);
    });

    it('setState() should change the state for the player in the match room', () => {
        const sendSpy = jest.spyOn(service, 'sendPlayersToHost').mockReturnThis();
        const mockPlayerRoom = { ...MOCK_PLAYER_ROOM };
        const mockPlayer = { ...MOCK_PLAYER };
        mockPlayerRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockPlayerRoom];
        mockPlayerRoom.players[0].socket = mockSocket;
        service.setState(mockPlayerRoom.players[0].socket.id, 'mock');
        expect(sendSpy).toHaveBeenCalledWith(mockPlayerRoom.code);
        expect(matchRoomSpy.matchRooms[0].players[0].state).toEqual('mock');
    });

    it('sendPlayersToHost should emit FetchPlayersData to host socket', () => {
        const getSpy = jest.spyOn(matchRoomSpy, 'getRoomIndex').mockReturnValue(0);
        const stringifySpy = jest.spyOn(service, 'getPlayersStringified').mockReturnValue('mock');
        const mockRoom = { ...MOCK_PLAYER_ROOM };
        mockRoom.hostSocket = mockSocket;
        matchRoomSpy.matchRooms = [mockRoom];
        service.sendPlayersToHost(mockRoom.code);
        expect(getSpy).toHaveBeenCalledWith(mockRoom.code);
        expect(stringifySpy).toHaveBeenCalledWith(mockRoom.code);
    });
    it('isHostPlayer() should return true if the host player exists in the MatchRoom', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.username = HOST_USERNAME;
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];

        const result = service.isHostPlayer(MOCK_ROOM_CODE);
        expect(result).toEqual(true);
    });

    it('isHostPlayer() should return false if the host player does not exist in the MatchRoom', () => {
        const mockRoom = MOCK_PLAYER_ROOM;
        const mockPlayer = MOCK_PLAYER;
        mockPlayer.username = 'otherPlayer';
        mockRoom.players = [mockPlayer];
        matchRoomSpy.matchRooms = [mockRoom];

        const result = service.isHostPlayer(MOCK_ROOM_CODE);
        expect(result).toEqual(false);
    });
    it("isHostUsernameCorrect() should return true if the username is the host's and the room is a test room and the player is not the host", () => {
        const matchRoomCode = 'test-room';
        const username = HOST_USERNAME;
        const matchRoom = MOCK_MATCH_ROOM;
        matchRoom.isTestRoom = true;
        jest.spyOn(matchRoomSpy, 'getRoom').mockReturnValue(matchRoom);
        jest.spyOn(service, 'isHostPlayer').mockReturnValue(false);

        const result = service.isHostUsernameCorrect(matchRoomCode, username);

        expect(result).toBe(true);
    });

    it('should return an empty string if isHostUsernameCorrect() returns true', () => {
        const username = HOST_USERNAME;
        const matchRoom = MOCK_MATCH_ROOM;

        jest.spyOn(service, 'isHostUsernameCorrect').mockReturnValue(true);
        const result = service.getUsernameErrors(matchRoom.code, username);

        expect(result).toBe('');
    });
});
