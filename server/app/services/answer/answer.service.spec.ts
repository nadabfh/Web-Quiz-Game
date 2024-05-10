/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { MOCK_MATCH_ROOM, MOCK_PLAYER, MOCK_ROOM_CODE } from '@app/constants/match-mocks';
import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { Feedback } from '@common/interfaces/feedback';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { TimeService } from '@app/services/time/time.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AnswerService } from './answer.service';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { GradingEvents } from '@app/constants/grading-events';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { PlayerEvents } from '@app/constants/player-events';

describe('AnswerService', () => {
    let service: AnswerService;
    let matchRoomServiceSpy;
    let mockHostSocket;
    let mockPlayer1Socket;
    let mockPlayer2Socket;
    let playerService;
    let matchRoomService;
    let timeService;
    let histogramService;
    let questionStrategyContext;
    let matchRoom: MatchRoom;
    let currentDate: number;
    let oldDate: number;
    let eventEmitter: EventEmitter2;
    let player1;
    let player2;
    let updateChoiceMock;
    const randomDate = 100000;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnswerService,
                MatchRoomService,
                TimeService,
                PlayerRoomService,
                EventEmitter2,
                HistogramService,
                QuestionStrategyContext,
                MultipleChoiceStrategy,
                LongAnswerStrategy,
            ],
        }).compile();

        histogramService = module.get<HistogramService>(HistogramService);
        service = module.get<AnswerService>(AnswerService);
        matchRoomService = module.get<MatchRoomService>(MatchRoomService);
        playerService = module.get<PlayerRoomService>(PlayerRoomService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
        timeService = module.get<EventEmitter2>(TimeService);
        questionStrategyContext = module.get<QuestionStrategyContext>(QuestionStrategyContext);

        mockHostSocket = {
            send: jest.fn(),
            emit: jest.fn(),
        };
        mockPlayer1Socket = {
            emit: jest.fn(),
        };
        mockPlayer2Socket = {
            emit: jest.fn(),
        };

        updateChoiceMock = jest.fn();

        matchRoom = { ...MOCK_MATCH_ROOM };
        matchRoom.hostSocket = mockHostSocket;

        player1 = { ...MOCK_PLAYER };
        const selectedChoices1 = new Map<string, boolean>();
        selectedChoices1.set('choice1', true);
        selectedChoices1.set('choice2', false);
        player1.username = 'player1';
        player1.answer = { selectedChoices: selectedChoices1, isSubmitted: true, timestamp: randomDate } as MultipleChoiceAnswer;
        player1.answer.updateChoice = updateChoiceMock;
        player1.socket = mockPlayer1Socket;
        player1.isPlaying = true;
        matchRoom.players[0] = player1;

        player2 = { ...MOCK_PLAYER };
        const selectedChoices2 = new Map<string, boolean>();
        selectedChoices2.set('choice1', false);
        selectedChoices2.set('choice2', true);
        player2.username = 'player2';
        player2.answer = { selectedChoices: selectedChoices2, isSubmitted: false } as MultipleChoiceAnswer;
        player2.answer.updateChoice = updateChoiceMock;
        player2.socket = mockPlayer2Socket;
        player2.isPlaying = true;
        matchRoom.players[1] = player2;

        service['matchRoomService'].matchRooms[0] = matchRoom;

        currentDate = randomDate;
        oldDate = currentDate;
        Date.now = jest.fn(() => currentDate);

        matchRoomServiceSpy = jest.spyOn(matchRoomService, 'getRoom').mockReturnValue(matchRoom);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('onQuestionTimerExpired() should autoSubmitAnswers and call current strategy functions when QuestionTimerExpired event is emitted', () => {
        const autoSubmitAnswersSpy = jest.spyOn<any, any>(service, 'autoSubmitAnswers').mockImplementation();
        const gradeAnswersSpy = jest.spyOn<any, any>(questionStrategyContext, 'gradeAnswers').mockImplementation();

        eventEmitter.addListener(ExpiredTimerEvents.QuestionTimerExpired, service.onQuestionTimerExpired);
        expect(eventEmitter.hasListeners(ExpiredTimerEvents.QuestionTimerExpired)).toBe(true);

        service.onQuestionTimerExpired(MOCK_ROOM_CODE);

        expect(autoSubmitAnswersSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
        expect(gradeAnswersSpy).toHaveBeenCalledWith(matchRoom, matchRoom.players);

        eventEmitter.removeListener(ExpiredTimerEvents.QuestionTimerExpired, service.onQuestionTimerExpired);
    });

    it('onGradingCompleteEvent() should call helper functions when GradingComplete event is emitted', () => {
        const sendFeedbackSpy = jest.spyOn<any, any>(service, 'sendFeedback').mockImplementation();
        const finaliseRoundSpy = jest.spyOn<any, any>(service, 'finaliseRound').mockImplementation();
        eventEmitter.addListener(GradingEvents.GradingComplete, service.onGradingCompleteEvent);
        expect(eventEmitter.hasListeners(GradingEvents.GradingComplete)).toBe(true);

        service.onGradingCompleteEvent(MOCK_ROOM_CODE);

        expect(sendFeedbackSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
        expect(finaliseRoundSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);

        eventEmitter.removeListener(GradingEvents.GradingComplete, service.onGradingCompleteEvent);
    });

    it('onPlayerQuit() should call helper function when Quit event is emitted', () => {
        const handleFinalAnswerSpy = jest.spyOn<any, any>(service, 'handleFinalAnswerSubmitted').mockImplementation();
        eventEmitter.addListener(PlayerEvents.Quit, service['handleFinalAnswerSubmitted']);
        expect(eventEmitter.hasListeners(PlayerEvents.Quit)).toBe(true);

        service.onPlayerQuit(MOCK_ROOM_CODE);

        expect(handleFinalAnswerSpy).toHaveBeenCalledWith(matchRoom);

        eventEmitter.removeListener(PlayerEvents.Quit, service['handleFinalAnswerSubmitted']);
    });

    it('updateChoice() should delegate choice tally according to selection', () => {
        player2.answer.isSubmitted = false;
        jest.spyOn<any, any>(playerService, 'getPlayerByUsername').mockReturnValue(player2);
        const updateSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram').mockImplementation();

        service.updateChoice('choice1', true, 'player2', MOCK_ROOM_CODE);
        expect(player2.answer.updateChoice).toHaveBeenCalledWith('choice1', true);
        expect(updateSpy).toHaveBeenCalledWith(matchRoom, 'choice1', true);

        service.updateChoice('choice1', false, 'player2', MOCK_ROOM_CODE);
        expect(player2.answer.updateChoice).toHaveBeenCalledWith('choice1', false);
        expect(updateSpy).toHaveBeenCalledWith(matchRoom, 'choice1', false);
    });

    it('updateChoice() should not count selection if answer was already submitted', () => {
        player1.answer.isSubmitted = true;
        jest.spyOn<any, any>(playerService, 'getPlayerByUsername').mockReturnValue(player1);
        const updateSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram');

        service.updateChoice('choice1', true, 'player1', MOCK_ROOM_CODE);

        expect(player1.answer.updateChoice).not.toHaveBeenCalled();
        expect(updateSpy).not.toHaveBeenCalled();
    });

    it('calculateScore() should delegate score calculation to current strategy', () => {
        const calculateScoreSpy = jest.spyOn<any, any>(questionStrategyContext, 'calculateScore').mockReturnThis();
        const grades = [] as LongAnswerInfo[];
        service.calculateScore(matchRoom.code, grades);
        expect(calculateScoreSpy).toHaveBeenCalledWith(matchRoom, matchRoom.players, grades);
    });

    it('submitAnswers() should set isSubmitted to true and call handleFinalAnswerSubmitted function', () => {
        const finalHandlerSpy = jest.spyOn<any, any>(service, 'handleFinalAnswerSubmitted').mockReturnThis();
        jest.spyOn<any, any>(playerService, 'getPlayerByUsername').mockReturnValue(player2);
        expect(matchRoom.players[1].answer.isSubmitted).toBe(false);

        service.submitAnswer('player2', MOCK_ROOM_CODE);
        expect(matchRoom.players[1].answer.isSubmitted).toBe(true);

        expect(finalHandlerSpy).toHaveBeenCalledWith(matchRoom);
    });

    it('submitAnswers() should increment submitted players value', () => {
        jest.spyOn<any, any>(service, 'handleFinalAnswerSubmitted').mockReturnThis();
        matchRoom.submittedPlayers = 0;
        jest.spyOn<any, any>(playerService, 'getPlayerByUsername').mockReturnValue(player2);
        service.submitAnswer('player2', MOCK_ROOM_CODE);
        expect(matchRoom.submittedPlayers).toEqual(1);
    });

    it('getRoom() should delegate call to match room service', () => {
        service['getRoom'](MOCK_ROOM_CODE);
        expect(matchRoomServiceSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
    });

    it('handleFinalAnswerSubmitted() should cancel current timer and call score calculating functions if all active players have submitted', () => {
        player1.answer.isSubmitted = true;
        player2.answer.isSubmitted = true;
        const timerSpy = jest.spyOn<any, any>(timeService, 'terminateTimer').mockImplementation();
        const timerExpiredSpy = jest.spyOn<any, any>(service, 'onQuestionTimerExpired').mockImplementation();
        service['handleFinalAnswerSubmitted'](matchRoom);
        expect(timerSpy).toHaveBeenCalled();
        expect(timerExpiredSpy).toHaveBeenCalled();
    });

    it('handleFinalAnswerSubmitted() should not cancel timer nor call score calculating functions if not all active players have submitted', () => {
        player1.answer.isSubmitted = true;
        const timerSpy = jest.spyOn<any, any>(timeService, 'terminateTimer').mockImplementation();
        const timerExpiredSpy = jest.spyOn<any, any>(service, 'onQuestionTimerExpired').mockImplementation();
        service['handleFinalAnswerSubmitted'](matchRoom);
        expect(timerSpy).not.toHaveBeenCalled();
        expect(timerExpiredSpy).not.toHaveBeenCalled();
    });

    it('handleFinalAnswerSubmitted() should stop round if a previously submitted player quit while other players have submitted', () => {
        player1.answer.isSubmitted = true;
        player2.answer.isSubmitted = true;
        player1.isPlaying = false;
        const timerSpy = jest.spyOn<any, any>(timeService, 'terminateTimer').mockImplementation();
        const timerExpiredSpy = jest.spyOn<any, any>(service, 'onQuestionTimerExpired').mockImplementation();
        service['handleFinalAnswerSubmitted'](matchRoom);
        expect(timerSpy).toHaveBeenCalled();
        expect(timerExpiredSpy).toHaveBeenCalled();
    });

    it("autoSubmitAnswers() should submit every player's answer if not already submitted", () => {
        expect(matchRoom.players[1].answer.isSubmitted).toBe(false);
        expect(matchRoom.players[0].answer.timestamp).toBe(currentDate);
        service['autoSubmitAnswers'](MOCK_ROOM_CODE);
        expect(matchRoom.players[1].answer.isSubmitted).toBe(true);
        expect(matchRoom.players[0].answer.timestamp).toBe(oldDate);
        expect(matchRoom.players[1].answer.timestamp).toBe(Infinity);
    });

    it("sendFeedback() should emit each player's score and the correct answers when timer expires", () => {
        matchRoom.players[0].score = 10;

        const player1Feedback: Feedback = {
            score: matchRoom.players[0].score,
            answerCorrectness: player1.answerCorrectness,
            correctAnswer: matchRoom.currentQuestionAnswer,
        };
        const player2Feedback: Feedback = {
            score: matchRoom.players[1].score,
            answerCorrectness: player2.answerCorrectness,
            correctAnswer: matchRoom.currentQuestionAnswer,
        };

        service['sendFeedback'](MOCK_ROOM_CODE);
        expect(player1.socket.emit).toHaveBeenCalledWith('feedback', player1Feedback);
        expect(player1.socket.emit).not.toHaveBeenCalledWith('feedback', player2Feedback);
        expect(player2.socket.emit).toHaveBeenCalledWith('feedback', player2Feedback);
        expect(player2.socket.emit).not.toHaveBeenCalledWith('feedback', player1Feedback);
    });

    it('finaliseRound() delegate calls to matchRoomService', () => {
        const resetSpy = jest.spyOn<any, any>(matchRoomService, 'resetPlayerSubmissionCount').mockImplementation();
        const incrementSpy = jest.spyOn<any, any>(matchRoomService, 'incrementCurrentQuestionIndex').mockImplementation();

        service['finaliseRound'](MOCK_ROOM_CODE);

        expect(resetSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
        expect(incrementSpy).toHaveBeenCalledWith(MOCK_ROOM_CODE);
    });
});
