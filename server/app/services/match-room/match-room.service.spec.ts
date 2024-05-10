/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { MOCK_CHOICES, getMockGame } from '@app/constants/game-mocks';
import { INVALID_CODE, LOCKED_ROOM } from '@app/constants/match-login-errors';
import { MOCK_MATCH_ROOM, MOCK_PLAYER, MOCK_RANDOM_MATCH_ROOM, MOCK_ROOM_CODE } from '@app/constants/match-mocks';
import { getMockQuestion } from '@app/constants/question-mocks';
import { FAKE_ROOM_ID } from '@app/constants/time-mocks';
import { PlayerInfo } from '@app/model/schema/answer.schema';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { ChoiceTracker } from '@app/model/tally-trackers/choice-tracker/choice-tracker';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { TimeService } from '@app/services/time/time.service';
import { MatchEvents } from '@common/events/match.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';
import { MatchRoomService } from './match-room.service';

const MAXIMUM_CODE_LENGTH = 4;
const MOCK_YEAR = 2024;
const MOCK_DATE = new Date(MOCK_YEAR, 1, 1);
describe('MatchRoomService', () => {
    let service: MatchRoomService;
    let timeService: TimeService;
    let questionStrategyService: QuestionStrategyContext;
    let socket: SinonStubbedInstance<Socket>;
    let startTimerMock: jest.Mock;
    let mockServer;
    let mockSocket;
    let emitMock;
    let mockHostSocket;
    let matchRoom;

    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        const module: TestingModule = await Test.createTestingModule({
            providers: [MatchRoomService, TimeService, EventEmitter2, QuestionStrategyContext, MultipleChoiceStrategy, LongAnswerStrategy],
        }).compile();

        service = module.get<MatchRoomService>(MatchRoomService);
        timeService = module.get<TimeService>(TimeService);
        questionStrategyService = module.get<QuestionStrategyContext>(QuestionStrategyContext);
        startTimerMock = jest.fn();
        timeService.startTimer = startTimerMock;

        emitMock = jest.fn();
        mockServer = {
            in: jest.fn().mockReturnValueOnce({ emit: emitMock }),
            to: jest.fn().mockReturnValueOnce({ emit: emitMock }),
        };

        mockSocket = {
            to: jest.fn().mockReturnValueOnce({ emit: emitMock }),
        };

        mockHostSocket = {
            send: jest.fn(),
        };

        matchRoom = { ...MOCK_MATCH_ROOM };

        const player1 = { ...MOCK_PLAYER };
        player1.score = 100;
        player1.isPlaying = true;
        player1.socket = {
            emit: jest.fn(),
        } as unknown as Socket;

        const player2 = { ...MOCK_PLAYER };
        player2.score = 50;
        player2.isPlaying = true;
        player2.socket = {
            emit: jest.fn(),
        } as unknown as Socket;

        matchRoom.players = [player1, player2];
        matchRoom.code = MOCK_ROOM_CODE;
        service.matchRooms[0] = matchRoom;
    });
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_DATE);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('generateRoomCode() should generate a random 4 number room code', () => {
        jest.spyOn(service, 'getRoom').mockReturnValue(undefined);
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const result = service.generateRoomCode();
        expect(result.length).toEqual(MAXIMUM_CODE_LENGTH);
        expect(isNaN(Number(result))).toBeFalsy();
    });

    it('getRoom() should return the MatchRoom with the corresponding code', () => {
        const searchedMatchRoom = MOCK_MATCH_ROOM;
        searchedMatchRoom.code = MOCK_ROOM_CODE;
        service.matchRooms = [MOCK_MATCH_ROOM, searchedMatchRoom];
        const foundRoom = service.getRoom(MOCK_ROOM_CODE);
        expect(foundRoom).toEqual(searchedMatchRoom);
    });

    it('getRoom() should return undefined if no match room with the corresponding code is found', () => {
        const foundRoom = service.getRoom('bad code');
        expect(foundRoom).toEqual(undefined);
    });

    it('getRoom() should return the index of the corresponding room', () => {
        const searchedRoom: MatchRoom = {
            code: MOCK_ROOM_CODE,
            isLocked: false,
            isPlaying: false,
            game: getMockGame(),
            bannedUsernames: [],
            players: [],
            messages: [],
            hostSocket: undefined,
        } as MatchRoom;
        service.matchRooms = [searchedRoom, MOCK_MATCH_ROOM];
        const result = service.getRoomIndex(MOCK_ROOM_CODE);
        expect(result).toEqual(0);
    });

    it('addRoom() should generate a room code add the new MatchRoom in the rooms list', () => {
        service.matchRooms = [];
        const generateSpy = jest.spyOn(service, 'generateRoomCode').mockReturnValue(MOCK_ROOM_CODE);
        const strategySpy = jest.spyOn<any, any>(service, 'setQuestionStrategy').mockImplementation();
        const mockGame = getMockGame();
        const expectedResult: MatchRoom = {
            code: MOCK_ROOM_CODE,
            hostSocket: socket,
            isLocked: false,
            isPlaying: false,
            game: mockGame,
            gameLength: 1,
            currentQuestion: mockGame.questions[0],
            questionDuration: 0,
            currentQuestionIndex: 0,
            currentQuestionAnswer: [],
            choiceTracker: new ChoiceTracker(),
            matchHistograms: [],
            bannedUsernames: [],
            players: [],
            activePlayers: 0,
            submittedPlayers: 0,
            messages: [],
            isTestRoom: false,
            isRandomMode: false,
            startTime: new Date(),
        };

        const result = service.addRoom(mockGame, socket);
        expect(generateSpy).toHaveBeenCalled();
        expect(strategySpy).toHaveBeenCalled();
        expect(result).toEqual(expectedResult);
        expect(service.matchRooms.length).toEqual(1);
    });

    it('addRoom() should set isLocked and isPlaying attributes approprietly if room is a test page', () => {
        service.matchRooms = [];
        jest.spyOn(service, 'generateRoomCode').mockReturnValue(MOCK_ROOM_CODE);
        jest.spyOn<any, any>(service, 'setQuestionStrategy').mockImplementation();
        const mockGame = getMockGame();
        const result = service.addRoom(mockGame, socket, false, true);
        expect(result.isLocked).toEqual(false);
        expect(result.isPlaying).toEqual(false);
    });

    it('addRoom() should set isLocked and isPlaying attributes approprietly if room is a random page', () => {
        service.matchRooms = [];
        jest.spyOn(service, 'generateRoomCode').mockReturnValue(MOCK_ROOM_CODE);
        jest.spyOn<any, any>(service, 'setQuestionStrategy').mockImplementation();
        const mockGame = getMockGame();
        const result = service.addRoom(mockGame, socket, true, false);
        expect(result.isLocked).toEqual(true);
        expect(result.isPlaying).toEqual(true);
    });

    it('getRoomCodeByHostSocket() should return code of the room where the host belongs', () => {
        const searchedMatchRoom = MOCK_MATCH_ROOM;
        searchedMatchRoom.code = MOCK_ROOM_CODE;
        searchedMatchRoom.hostSocket = socket;
        service.matchRooms = [MOCK_MATCH_ROOM, searchedMatchRoom];
        const result = service.getRoomCodeByHostSocket(socket.id);
        expect(result).toEqual(MOCK_ROOM_CODE);
    });

    it('getRoomCodeByHostSocket() should return undefined if no room where the host belongs is found', () => {
        service.matchRooms = [MOCK_MATCH_ROOM];
        const result = service.getRoomCodeByHostSocket(MOCK_ROOM_CODE);
        expect(result).toEqual(undefined);
    });

    it('toggleLock() should toggle the isLocked property', () => {
        const lockStates = [true, false];
        lockStates.forEach((lockState: boolean) => {
            const mockMatchRoom = MOCK_MATCH_ROOM;
            mockMatchRoom.isLocked = lockState;
            jest.spyOn(service, 'getRoom').mockReturnValue(mockMatchRoom);
            service.toggleLock(MOCK_MATCH_ROOM.code);
            expect(mockMatchRoom.isLocked).toEqual(!lockState);
        });
    });

    it('deleteRoom() should delete the MatchRoom with the corresponding code', () => {
        const deletedMatchRoom = MOCK_MATCH_ROOM;
        deletedMatchRoom.code = MOCK_ROOM_CODE;
        const otherMatchRoom: MatchRoom = {
            code: '',
            isLocked: false,
            isPlaying: false,
            game: getMockGame(),
            bannedUsernames: [],
            players: [],
            messages: [],
            hostSocket: undefined,
        } as MatchRoom;
        service.matchRooms = [otherMatchRoom, deletedMatchRoom];
        service.deleteRoom(MOCK_ROOM_CODE);
        expect(service.matchRooms.length).toEqual(1);
        expect(service.matchRooms.find((room: MatchRoom) => room === deletedMatchRoom)).toBeFalsy();
    });

    it('getRoomCodeErrors() should return empty string if the room is found and is not locked', () => {
        const validRoom = MOCK_MATCH_ROOM;
        validRoom.isLocked = false;
        jest.spyOn(service, 'getRoom').mockReturnValue(MOCK_MATCH_ROOM);
        const result = service.getRoomCodeErrors(validRoom.code);
        expect(result).toEqual('');
    });

    it('getRoomCodeErrors() should return LOCKED_ROOM error if the room is found and is locked', () => {
        const invalidRoom = MOCK_MATCH_ROOM;
        invalidRoom.isLocked = true;
        jest.spyOn(service, 'getRoom').mockReturnValue(MOCK_MATCH_ROOM);
        const result = service.getRoomCodeErrors(invalidRoom.code);
        expect(result).toEqual(LOCKED_ROOM);
    });

    it('getRoomCodeErrors() should return INVALID_CODE if the room is not found', () => {
        jest.spyOn(service, 'getRoom').mockReturnValue(undefined);
        const result = service.getRoomCodeErrors('');
        expect(result).toEqual(INVALID_CODE);
    });

    it('canStartMatch() should return true if room is locked and has at least one player', () => {
        const validRoom = MOCK_MATCH_ROOM;
        validRoom.isLocked = true;
        validRoom.players = [MOCK_PLAYER];
        jest.spyOn(service, 'getRoom').mockReturnValue(MOCK_MATCH_ROOM);
        const result = service['canStartMatch']('');
        expect(result).toBeTruthy();
    });

    it('canStartMatch() should return false if room is not locked or has zero player', () => {
        const unlockedRoom = MOCK_MATCH_ROOM;
        unlockedRoom.isLocked = false;
        unlockedRoom.players = [MOCK_PLAYER];

        const noPlayerRoom = MOCK_MATCH_ROOM;
        noPlayerRoom.players = [];
        noPlayerRoom.isLocked = true;

        const totallyInvalidRoom = MOCK_MATCH_ROOM;
        totallyInvalidRoom.isLocked = false;
        totallyInvalidRoom.players = [];

        const invalidRooms = [unlockedRoom, noPlayerRoom, totallyInvalidRoom, undefined];
        invalidRooms.forEach((room: MatchRoom) => {
            jest.spyOn(service, 'getRoom').mockReturnValue(room);
            expect(service['canStartMatch']('')).toBeFalsy();
        });
    });

    it('canStartMatch() should return true if room is  locked and is random mode', () => {
        const randomRoom = { ...MOCK_RANDOM_MATCH_ROOM };
        randomRoom.isLocked = true;
        randomRoom.isRandomMode = true;

        jest.spyOn(service, 'getRoom').mockReturnValue(randomRoom);
        const result = service['canStartMatch'](randomRoom.code);
        expect(result).toBeTruthy();
    });

    it('resetPlayerSubmissionCount() should reset submitted players to 0 when called', () => {
        matchRoom.submittedPlayers = 3;
        expect(service.getRoom(MOCK_ROOM_CODE).submittedPlayers).toEqual(3);
        service.resetPlayerSubmissionCount(MOCK_ROOM_CODE);
        expect(service.getRoom(MOCK_ROOM_CODE).submittedPlayers).toEqual(0);
    });

    it('incrementCurrentQuestionIndex() should increment currentQuestionIndex when called', () => {
        expect(service.getRoom(MOCK_ROOM_CODE).currentQuestionIndex).toEqual(0);
        service.incrementCurrentQuestionIndex(MOCK_ROOM_CODE);
        expect(service.getRoom(MOCK_ROOM_CODE).currentQuestionIndex).toEqual(1);
    });

    it('startMatch() should start match and timer with a 5 seconds countdown', () => {
        jest.spyOn(service, 'getRoomIndex').mockReturnValue(0);

        jest.spyOn<any, any>(service, 'canStartMatch').mockReturnValue(true);
        jest.spyOn<any, any>(service, 'getGameTitle').mockReturnValue('game1');
        service.startMatch(mockSocket, null, MOCK_ROOM_CODE);
        const playerInfo: PlayerInfo = { gameTitle: 'game1', start: true };
        expect(emitMock).toHaveBeenCalledWith('matchStarting', playerInfo);
        expect(startTimerMock).toHaveBeenCalledWith(null, MOCK_ROOM_CODE, 5, ExpiredTimerEvents.CountdownTimerExpired);
    });

    it('startMatch() should not start the match nor the timer if match is not in a valid state', () => {
        jest.spyOn<any, any>(service, 'canStartMatch').mockReturnValue(false);
        jest.spyOn<any, any>(service, 'getGameTitle').mockReturnValue('game1');
        service.startMatch(mockSocket, null, MOCK_ROOM_CODE);
        expect(emitMock).not.toHaveBeenCalled();
        expect(startTimerMock).not.toHaveBeenCalled();
    });

    it('startNextQuestionCooldown() should start timer with a 3 seconds countdown', () => {
        service.startNextQuestionCooldown(mockServer, MOCK_ROOM_CODE);
        expect(emitMock).toHaveBeenCalledWith('startCooldown', MOCK_ROOM_CODE);
        expect(startTimerMock).toHaveBeenCalledWith(mockServer, MOCK_ROOM_CODE, 3, ExpiredTimerEvents.CooldownTimerExpired);
    });

    it('sendFirstQuestion() should emit the first question along with the game duration', () => {
        matchRoom.hostSocket = mockHostSocket;
        const currentQuestion = matchRoom.game.questions[0];
        const currentAnswers = currentQuestion.choices[0].text;
        service.sendFirstQuestion(mockServer, MOCK_ROOM_CODE);
        expect(emitMock).toHaveBeenCalledWith('beginQuiz', {
            firstQuestion: currentQuestion,
            gameDuration: matchRoom.game.duration,
            isTestRoom: false,
        });
        expect(mockHostSocket.send).toHaveBeenCalledWith('currentAnswers', [currentAnswers]);
        expect(startTimerMock).toHaveBeenCalledWith(mockServer, MOCK_ROOM_CODE, matchRoom.game.duration, ExpiredTimerEvents.QuestionTimerExpired);
    });

    it('sendNextQuestion() should emit gameOver if is last question and is not a random page', () => {
        matchRoom.currentQuestionIndex = 2;
        matchRoom.gameLength = 2;
        matchRoom.isTestRoom = true;
        jest.spyOn(service, 'getRoom').mockReturnValue(matchRoom);
        service.sendNextQuestion(mockServer, matchRoom.code);
        expect(emitMock).toHaveBeenCalledWith('gameOver', { isRandomMode: false, isTestRoom: true });
    });

    it('sendNextQuestion() should not emit gamOver if is last question and is a random page', () => {
        matchRoom.currentQuestionIndex = 2;
        matchRoom.gameLength = 2;
        matchRoom.isRandomMode = true;
        jest.spyOn(service, 'getRoom').mockReturnValue(matchRoom);
        service.sendNextQuestion(mockServer, matchRoom.code);
        expect(emitMock).not.toHaveBeenCalled();
    });

    it('sendNextQuestion() should emit the next question if there are any and start a timer with the game duration as its value', () => {
        matchRoom.currentQuestionIndex = 0;
        matchRoom.hostSocket = mockHostSocket;
        const currentQuestion = matchRoom.game.questions[0];
        service.sendNextQuestion(mockServer, MOCK_ROOM_CODE);
        expect(emitMock).toHaveBeenCalledWith('goToNextQuestion', currentQuestion);
        expect(startTimerMock).toHaveBeenCalledWith(mockServer, MOCK_ROOM_CODE, matchRoom.game.duration, ExpiredTimerEvents.QuestionTimerExpired);
    });

    it('markGameAsPlaying() should set match room isPlaying to true', () => {
        matchRoom.isPlaying = false;
        service.markGameAsPlaying(MOCK_ROOM_CODE);
        expect(matchRoom.isPlaying).toEqual(true);
    });

    it('isGamePlaying() should return true if isPlaying is true', () => {
        service.markGameAsPlaying(MOCK_ROOM_CODE);
        expect(service.isGamePlaying(MOCK_ROOM_CODE)).toEqual(true);
    });

    it('filterCorrectChoices() should return a list of correct choices', () => {
        let correctChoices = ['previous correct choice'];
        const question = getMockQuestion();
        question.choices = MOCK_CHOICES;
        correctChoices = service['filterCorrectChoices'](question);
        expect(correctChoices).not.toContain('previous correct choice');
        expect(correctChoices).toContain(question.choices[0].text);
        expect(correctChoices).not.toContain(question.choices[1].text);
    });

    it('removeIsCorrectField() should remove isCorrect answer from choices', () => {
        const question = getMockQuestion();
        question.choices = MOCK_CHOICES;
        service['removeIsCorrectField'](question);
        expect(question.choices[0].isCorrect).toBeUndefined();
        expect(question.choices[1].isCorrect).toBeUndefined();
    });

    it('getGameTitle() should return the current game title', () => {
        service.matchRooms = [MOCK_MATCH_ROOM];
        service.matchRooms[0].game.title = 'game1';
        const currentGameDuration = service['getGameTitle'](MOCK_ROOM_CODE);
        expect(currentGameDuration).toEqual('game1');
    });

    it('declareWinner() should select match winner when only 1 player has the max score', () => {
        jest.spyOn(service, 'getRoom').mockReturnValue(matchRoom);

        service.declareWinner(matchRoom.code);

        expect(matchRoom.players[0].socket.emit).toHaveBeenCalledWith(MatchEvents.Winner);
        expect(matchRoom.players[1].socket.emit).not.toHaveBeenCalledWith(MatchEvents.Winner);
    });

    it('should call pauseTimer from timeService when pauseMatchTimer() is called', () => {
        const spy = jest.spyOn(timeService, 'pauseTimer').mockReturnThis();
        service.pauseMatchTimer(mockServer, FAKE_ROOM_ID);
        expect(spy).toHaveBeenCalled();
    });

    it('should call panicTimer from timeService when panicMatchTimer() is called', () => {
        const spy = jest.spyOn(timeService, 'startPanicTimer').mockReturnThis();
        service.triggerPanicMode(mockServer, FAKE_ROOM_ID);
        expect(spy).toHaveBeenCalled();
    });

    it('setQuestionStrategy should set question strategy and panic timer treshhold', () => {
        timeService.currentPanicThresholdTime = 0;
        const panicTreshold = 20;
        const spy = jest.spyOn(questionStrategyService, 'setQuestionStrategy').mockReturnThis();
        jest.spyOn(questionStrategyService, 'getQuestionPanicThreshold').mockReturnValue(panicTreshold);

        service['setQuestionStrategy'](matchRoom);

        expect(spy).toHaveBeenCalled();
        expect(timeService.currentPanicThresholdTime).toEqual(panicTreshold);
    });
});
