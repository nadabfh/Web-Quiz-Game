/* eslint-disable @typescript-eslint/no-explicit-any */
import { MOCK_ROOM_CODE } from '@app/constants/chat-mocks';
import { getMockGame } from '@app/constants/game-mocks';
import { MOCK_MATCH_ROOM } from '@app/constants/match-mocks';
import { TimerDurationEvents } from '@app/constants/timer-events';
import { Question } from '@app/model/database/question';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { QuestionStrategyContext } from '@app/services/question-strategy-context/question-strategy-context.service';
import { HistogramEvents } from '@common/events/histogram.events';
import { Histogram } from '@common/interfaces/histogram';
import { TimerInfo } from '@common/interfaces/timer-info';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe('HistogramService', () => {
    let histogramService: HistogramService;
    let matchRoomService: SinonStubbedInstance<MatchRoomService>;
    let eventEmitter: EventEmitter2;
    let questionStrategyContext: QuestionStrategyContext;
    let emitMock;
    let mockSocket;
    let mockMatchRoom;
    const mockHistogram = {} as Histogram;

    beforeEach(async () => {
        matchRoomService = createStubInstance(MatchRoomService);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HistogramService,
                { provide: MatchRoomService, useValue: matchRoomService },
                EventEmitter2,
                QuestionStrategyContext,
                MultipleChoiceStrategy,
                LongAnswerStrategy,
            ],
        }).compile();

        histogramService = module.get<HistogramService>(HistogramService);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
        questionStrategyContext = module.get<QuestionStrategyContext>(QuestionStrategyContext);

        emitMock = jest.fn();

        mockSocket = {
            to: jest.fn().mockReturnValueOnce({ emit: emitMock }),
            send: jest.fn().mockReturnValueOnce({ emit: emitMock }),
            emit: emitMock,
        };

        mockMatchRoom = { ...MOCK_MATCH_ROOM };
        mockMatchRoom.game = getMockGame();
        mockMatchRoom.currentQuestion = mockMatchRoom.game.questions[0];
        mockMatchRoom.currentQuestion.type = 'QRL';
        mockMatchRoom.hostSocket = mockSocket;

        questionStrategyContext.setQuestionStrategy(mockMatchRoom);
    });

    it('should be defined', () => {
        expect(histogramService).toBeDefined();
    });

    it('onTimerTick() should call buildHistogram only if current question is of type long answer and current time is a multiple of 5', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram').mockImplementation();
        jest.spyOn<any, any>(matchRoomService, 'isGamePlaying').mockReturnValue(true);
        jest.spyOn<any, any>(questionStrategyContext, 'getQuestionStrategy').mockReturnValue('QRL');
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        eventEmitter.addListener(TimerDurationEvents.Timer, histogramService.onTimerTick);
        expect(eventEmitter.hasListeners(TimerDurationEvents.Timer)).toBe(true);

        const timerInfo: TimerInfo = { currentTime: 30, duration: 60 };
        histogramService.onTimerTick(MOCK_ROOM_CODE, timerInfo);
        expect(buildHistogramSpy).toHaveBeenCalledWith(mockMatchRoom);

        eventEmitter.removeListener(TimerDurationEvents.Timer, histogramService.onTimerTick);
    });

    it('onTimerTick() should not call buildHistogram if current time is not a multiple of 5', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram').mockImplementation();
        jest.spyOn<any, any>(matchRoomService, 'isGamePlaying').mockReturnValue(true);
        jest.spyOn<any, any>(questionStrategyContext, 'getQuestionStrategy').mockReturnValue('QRL');
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        const timerInfo: TimerInfo = { currentTime: 17, duration: 60 };
        histogramService.onTimerTick(MOCK_ROOM_CODE, timerInfo);
        expect(buildHistogramSpy).not.toHaveBeenCalledWith(mockMatchRoom);
    });

    it('onTimerTick() should not call buildHistogram if current question is not of type long answer  ', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram').mockImplementation();
        jest.spyOn<any, any>(matchRoomService, 'isGamePlaying').mockReturnValue(true);
        jest.spyOn<any, any>(questionStrategyContext, 'getQuestionStrategy').mockReturnValue('QCM');
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        eventEmitter.addListener(TimerDurationEvents.Timer, histogramService.onTimerTick);
        expect(eventEmitter.hasListeners(TimerDurationEvents.Timer)).toBe(true);

        const timerInfo: TimerInfo = { currentTime: 30, duration: 60 };
        histogramService.onTimerTick(MOCK_ROOM_CODE, timerInfo);
        expect(buildHistogramSpy).not.toHaveBeenCalledWith(mockMatchRoom);

        eventEmitter.removeListener(TimerDurationEvents.Timer, histogramService.onTimerTick);
    });

    it('onTimerTick() should not call buildHistogram if current game is not playing  ', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(histogramService, 'buildHistogram').mockImplementation();
        jest.spyOn<any, any>(matchRoomService, 'isGamePlaying').mockReturnValue(false);
        jest.spyOn<any, any>(questionStrategyContext, 'getQuestionStrategy').mockReturnValue('QRL');
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        const timerInfo: TimerInfo = { currentTime: 5, duration: 5 };
        histogramService.onTimerTick(MOCK_ROOM_CODE, timerInfo);
        expect(buildHistogramSpy).not.toHaveBeenCalledWith(mockMatchRoom);
    });

    it('buildHistogram() should call correct helper functions', () => {
        const choice = 'choice1';
        const selection = true;

        const buildHistogramSpy = jest.spyOn<any, any>(questionStrategyContext, 'buildHistogram').mockReturnValue(mockHistogram);
        const saveHistogramSpy = jest.spyOn<any, any>(histogramService, 'saveHistogram').mockImplementation();
        const sendHistogramSpy = jest.spyOn<any, any>(histogramService, 'sendHistogram').mockImplementation();

        histogramService.buildHistogram(mockMatchRoom, choice, selection);

        expect(buildHistogramSpy).toHaveBeenCalledWith(mockMatchRoom, choice, selection);
        expect(saveHistogramSpy).toHaveBeenCalledWith(mockHistogram, mockMatchRoom);
        expect(sendHistogramSpy).toHaveBeenCalledWith(mockHistogram, mockMatchRoom);
    });

    it('saveHistogram() should save histogram', () => {
        mockMatchRoom.matchHistograms = [];
        histogramService.saveHistogram(mockHistogram, mockMatchRoom);
        expect(mockMatchRoom.matchHistograms[mockMatchRoom.currentQuestionIndex]).toBe(mockHistogram);
    });

    it('should send histogram history', () => {
        mockMatchRoom.hostSocket = mockSocket;
        const histograms = (mockMatchRoom.matchHistograms = [] as Histogram[]);
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        histogramService.sendHistogramHistory(MOCK_ROOM_CODE);
        expect(emitMock).toHaveBeenCalledWith(HistogramEvents.HistogramHistory, histograms);
    });

    it('resetChoiceTracker() should reset the choice tracker', () => {
        const matchRoomCode = MOCK_ROOM_CODE;
        const matchRoom = { ...MOCK_MATCH_ROOM };
        const currentQuestion: Question = {
            text: 'Sample question',
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
            id: '',
            type: '',
            points: 0,
            lastModification: new Date(),
        };
        matchRoom.game.questions = [currentQuestion];
        matchRoom.currentQuestionIndex = 0;

        const resetChoiceTrackerSpy = jest.spyOn(matchRoom.choiceTracker, 'resetChoiceTracker');

        matchRoomService.getRoom.returns(matchRoom);

        histogramService.resetChoiceTracker(matchRoomCode);

        expect(resetChoiceTrackerSpy).toHaveBeenCalledWith(currentQuestion.text, currentQuestion.choices);
    });

    it('should send histogram', () => {
        mockMatchRoom.hostSocket = mockSocket;
        histogramService.sendHistogram(mockHistogram, mockMatchRoom);
        expect(emitMock).toHaveBeenCalledWith(HistogramEvents.CurrentHistogram, mockHistogram);
    });

    it('sendHistogram() should emit current histogram', () => {
        histogramService.sendHistogram(mockHistogram, mockMatchRoom);
        expect(mockSocket.emit).toHaveBeenCalledWith(HistogramEvents.CurrentHistogram, mockHistogram);
    });

    it('sendEmptyHistogram() should send an histogram history', () => {
        jest.spyOn<any, any>(questionStrategyContext, 'buildHistogram').mockReturnValue(mockHistogram);
        jest.spyOn<any, any>(matchRoomService, 'getRoom').mockReturnValue(mockMatchRoom);

        histogramService.sendEmptyHistogram(MOCK_ROOM_CODE);
        expect(emitMock).toHaveBeenCalledWith(HistogramEvents.CurrentHistogram, mockHistogram);
    });
});
