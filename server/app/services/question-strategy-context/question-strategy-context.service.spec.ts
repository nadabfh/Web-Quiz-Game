/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionStrategyContext } from './question-strategy-context.service';
import { MultipleChoiceStrategy } from '@app/question-strategies/multiple-choice-strategy/multiple-choice-strategy';
import { LongAnswerStrategy } from '@app/question-strategies/long-answer-strategy/long-answer-strategy';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MOCK_MATCH_ROOM, MOCK_PLAYER } from '@app/constants/match-mocks';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { Player } from '@app/model/schema/player.schema';
import { LongAnswer } from '@app/model/answer-types/long-answer/long-answer';
import { LONG_ANSWER_TIME } from '@common/constants/match-constants';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';

describe('QuestionStrategyService', () => {
    let service: QuestionStrategyContext;
    let matchRoom;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [QuestionStrategyContext, EventEmitter2, MultipleChoiceStrategy, LongAnswerStrategy],
        }).compile();

        service = module.get<QuestionStrategyContext>(QuestionStrategyContext);

        matchRoom = { ...MOCK_MATCH_ROOM };

        const player1 = { ...MOCK_PLAYER };
        const player2 = { ...MOCK_PLAYER };

        matchRoom.players = [player1, player2];

        service['questionStrategies'].set(matchRoom.code, service['multipleChoiceStrategy']);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getQuestionStrategy() should return current strategy ', () => {
        const currentStrategy = service.getQuestionStrategy(matchRoom.code);
        expect(currentStrategy).toEqual('QCM');
    });

    it('setQuestionStrategy() should set current strategy to QCM according to current question type', () => {
        const multipleChoiceSpy = jest.spyOn<any, any>(service, 'setMultipleChoiceStrategy').mockImplementation();

        matchRoom.currentQuestion.type = 'QCM';
        service.setQuestionStrategy(matchRoom);
        matchRoom.players.forEach((player: Player) => {
            expect(player.answer).toBeInstanceOf(MultipleChoiceAnswer);
        });
        expect(matchRoom.questionDuration).toEqual(matchRoom.game.duration);
        expect(multipleChoiceSpy).toHaveBeenCalled();
    });

    it('setQuestionStrategy() should set current strategy to QRL according to current question type', () => {
        const longAnswerSpy = jest.spyOn<any, any>(service, 'setLongAnswerStrategy').mockImplementation();

        matchRoom.currentQuestion.type = 'QRL';
        service.setQuestionStrategy(matchRoom);
        matchRoom.players.forEach((player: Player) => {
            expect(player.answer).toBeInstanceOf(LongAnswer);
        });
        expect(matchRoom.questionDuration).toEqual(LONG_ANSWER_TIME);
        expect(longAnswerSpy).toHaveBeenCalled();
    });

    it('gradeAnswers() should delegate call to current strategy method', () => {
        const gradeAnswersSpy = jest.spyOn(service['questionStrategies'].get(matchRoom.code), 'gradeAnswers').mockImplementation();

        service.gradeAnswers(matchRoom, matchRoom.players);

        expect(gradeAnswersSpy).toHaveBeenLastCalledWith(matchRoom, matchRoom.players);
    });

    it('calculateScore() should delegate call to current strategy method', () => {
        const calculateScoreSpy = jest.spyOn(service['questionStrategies'].get(matchRoom.code), 'calculateScore').mockImplementation();
        const grades = [] as LongAnswerInfo[];

        service.calculateScore(matchRoom, matchRoom.players, grades);

        expect(calculateScoreSpy).toHaveBeenLastCalledWith(matchRoom, matchRoom.players, grades);
    });

    it('buildHistogram() should delegate call to current strategy method', () => {
        const buildHistogramSpy = jest.spyOn(service['questionStrategies'].get(matchRoom.code), 'buildHistogram').mockImplementation();
        const choice = 'choice1';
        const selection = true;

        service.buildHistogram(matchRoom, choice, selection);

        expect(buildHistogramSpy).toHaveBeenLastCalledWith(matchRoom, choice, selection);
    });

    it('setMultipleChoiceStrategy() should set question strategy to multipleChoiceStrategy', () => {
        service['setMultipleChoiceStrategy'](matchRoom.code);

        expect(service['questionStrategies'].get(matchRoom.code)).toBeInstanceOf(MultipleChoiceStrategy);
    });

    it('setLongAnswerStrategy() should set question strategy to longAnswerStrategy', () => {
        service['setLongAnswerStrategy'](matchRoom.code);

        expect(service['questionStrategies'].get(matchRoom.code)).toBeInstanceOf(LongAnswerStrategy);
    });
});
