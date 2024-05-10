/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MOCK_PLAYER, MOCK_PLAYER_ROOM } from '@app/constants/match-mocks';
import { MultipleChoiceStrategy } from './multiple-choice-strategy';
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { GradingEvents } from '@app/constants/grading-events';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { BONUS_FACTOR } from '@common/constants/match-constants';
import { AnswerEvents } from '@common/events/answer.events';
import { ChoiceTracker } from '@app/model/tally-trackers/choice-tracker/choice-tracker';
import { MultipleChoiceHistogram } from '@common/interfaces/histogram';

describe('MultipleChoiceStrategy', () => {
    let strategy: MultipleChoiceStrategy;
    let matchRoom: MatchRoom;
    let mockPlayer1Socket;
    let mockPlayer2Socket;
    let eventEmitterMock;
    const randomDate = 100000;

    beforeEach(async () => {
        eventEmitterMock = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [MultipleChoiceStrategy, { provide: EventEmitter2, useValue: eventEmitterMock }],
        }).compile();

        mockPlayer1Socket = {
            emit: jest.fn(),
        };

        mockPlayer2Socket = {
            emit: jest.fn(),
        };

        strategy = module.get<MultipleChoiceStrategy>(MultipleChoiceStrategy);

        matchRoom = { ...MOCK_PLAYER_ROOM };

        const player1 = { ...MOCK_PLAYER };
        const selectedChoices1 = new Map<string, boolean>();
        selectedChoices1.set('choice1', true);
        selectedChoices1.set('choice2', false);
        player1.username = 'player1';
        player1.answer = { selectedChoices: selectedChoices1, isSubmitted: true, timestamp: randomDate } as MultipleChoiceAnswer;
        player1.socket = mockPlayer1Socket;
        matchRoom.players[0] = player1;

        const player2 = { ...MOCK_PLAYER };
        const selectedChoices2 = new Map<string, boolean>();
        selectedChoices2.set('choice1', false);
        selectedChoices2.set('choice2', true);
        player2.username = 'player2';
        player2.answer = { selectedChoices: selectedChoices2, isSubmitted: false } as MultipleChoiceAnswer;
        player2.socket = mockPlayer2Socket;
        matchRoom.players[1] = player2;

        matchRoom.choiceTracker.resetChoiceTracker(matchRoom.currentQuestion.text, matchRoom.currentQuestion.choices);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('gradeAnswers() should call calculateScore and emit GradingComplete Event', () => {
        const calculateScoreSpy = jest.spyOn<any, any>(strategy, 'calculateScore').mockReturnThis();
        strategy.gradeAnswers(matchRoom, matchRoom.players);
        expect(calculateScoreSpy).toHaveBeenCalledWith(matchRoom, matchRoom.players);
        expect(eventEmitterMock.emit).toHaveBeenCalledWith(GradingEvents.GradingComplete, matchRoom.code);
    });

    it("calculateScore() should add to the player's score only if they had the correct answer", () => {
        const bonusSpy = jest.spyOn<any, any>(strategy, 'computeFastestPlayerBonus').mockReturnThis();
        const oldScore = matchRoom.players[0].score;
        matchRoom.currentQuestionAnswer = ['choice1'];
        strategy.calculateScore(matchRoom, matchRoom.players);
        expect(bonusSpy).toHaveBeenCalled();
        expect(matchRoom.players[0].score).toEqual(oldScore + matchRoom.currentQuestion.points);
        expect(matchRoom.players[1].score).toEqual(oldScore);
    });

    it('calculateScore() should find the fastest responding players', () => {
        const bonusSpy = jest.spyOn<any, any>(strategy, 'computeFastestPlayerBonus').mockReturnThis();
        matchRoom.currentQuestionAnswer = ['choice1'];
        matchRoom.players[1].answer = matchRoom.players[0].answer;
        strategy.calculateScore(matchRoom, matchRoom.players);
        expect(bonusSpy).toHaveBeenCalledWith(matchRoom.currentQuestion.points, randomDate, matchRoom.players);
    });

    it('calculateScore() should add no bonus if no players got the right answer', () => {
        const bonusSpy = jest.spyOn<any, any>(strategy, 'computeFastestPlayerBonus').mockReturnThis();
        matchRoom.currentQuestionAnswer = ['impossible'];
        strategy.calculateScore(matchRoom, matchRoom.players);
        expect(bonusSpy).not.toHaveBeenCalled();
    });

    it('buildHistogram() should update histogram values according to selection', () => {
        const mockChoiceTracker = {
            incrementCount: jest.fn(),
            decrementCount: jest.fn(),
        };
        matchRoom.choiceTracker = mockChoiceTracker as unknown as ChoiceTracker;
        const histogramConverterSpy = jest.spyOn<any, any>(strategy, 'convertToHistogram').mockReturnThis();

        const choice = matchRoom.currentQuestion.choices[0].text;

        strategy.buildHistogram(matchRoom, choice, true);
        expect(mockChoiceTracker.incrementCount).toHaveBeenCalled();
        expect(histogramConverterSpy).toHaveBeenCalled();

        strategy.buildHistogram(matchRoom, choice, false);
        expect(mockChoiceTracker.decrementCount).toHaveBeenCalled();
        expect(histogramConverterSpy).toHaveBeenCalled();
    });

    it('isCorrectAnswer() should return true if player has right answer', () => {
        matchRoom.currentQuestionAnswer = ['choice1'];
        const playerAnswer = matchRoom.players[0].answer as MultipleChoiceAnswer;
        const isCorrect = strategy['isCorrectAnswer'](playerAnswer, matchRoom.currentQuestionAnswer);
        expect(isCorrect).toEqual(true);
    });

    it('isCorrectAnswer() should return false if player has wrong answer', () => {
        matchRoom.currentQuestionAnswer = ['choice2'];
        const playerAnswer = matchRoom.players[0].answer as MultipleChoiceAnswer;
        const isCorrect = strategy['isCorrectAnswer'](playerAnswer, matchRoom.currentQuestionAnswer);
        expect(isCorrect).toEqual(false);
    });

    it("filterSelectedChoices() should convert the player's answer to an array of choices", () => {
        const playerAnswer = matchRoom.players[0].answer as MultipleChoiceAnswer;
        const choicesArray = strategy['filterSelectedChoices'](playerAnswer);
        expect(choicesArray).toContain('choice1');
        expect(choicesArray).not.toContain('choice2');
    });

    it('computeFastestPlayerBonus() should add a bonus to the correct player with the fastest time and emit it to right player', () => {
        const oldScore = matchRoom.players[0].score;
        const oldBonusCount = matchRoom.players[0].bonusCount;
        const fastestTime = randomDate;
        const correctPlayers = matchRoom.players;
        strategy['computeFastestPlayerBonus'](30, fastestTime, correctPlayers);
        expect(matchRoom.players[0].score).toEqual(oldScore + BONUS_FACTOR * 30);
        expect(matchRoom.players[0].bonusCount).toEqual(oldBonusCount + 1);
        expect(matchRoom.players[1].bonusCount).toEqual(0);
        expect(mockPlayer1Socket.emit).toHaveBeenCalledWith(AnswerEvents.Bonus, BONUS_FACTOR * 30);
        expect(mockPlayer2Socket.emit).not.toHaveBeenCalled();
    });

    it('computeFastestPlayerBonus() should add no bonus if 2 or more players get the right answer at the same time', () => {
        const oldScore = matchRoom.players[0].score;
        const oldBonusCount = matchRoom.players[0].bonusCount;
        const fastestTime = randomDate;
        const correctPlayers = matchRoom.players;
        correctPlayers[1].answer.timestamp = correctPlayers[0].answer.timestamp;
        strategy['computeFastestPlayerBonus'](30, fastestTime, correctPlayers);
        expect(matchRoom.players[0].score).toEqual(oldScore);
        expect(matchRoom.players[0].bonusCount).toEqual(oldBonusCount);
        expect(matchRoom.players[1].bonusCount).toEqual(0);
        expect(mockPlayer1Socket.emit).not.toHaveBeenCalled();
        expect(mockPlayer2Socket.emit).not.toHaveBeenCalled();
    });

    it('convertToHistogram() should convert a choice tracker to a MultipleChoiceHistogram', () => {
        const choiceTracker = matchRoom.choiceTracker;
        choiceTracker.incrementCount(matchRoom.currentQuestion.choices[0].text);
        choiceTracker.incrementCount(matchRoom.currentQuestion.choices[1].text);
        const histogram: MultipleChoiceHistogram = strategy['convertToHistogram'](choiceTracker);
        expect(histogram).toStrictEqual({
            question: matchRoom.currentQuestion.text,
            type: 'QCM',
            choiceTallies: [
                { ...matchRoom.currentQuestion.choices[0], tally: 1 },
                { ...matchRoom.currentQuestion.choices[1], tally: 1 },
                { ...matchRoom.currentQuestion.choices[2], tally: 0 },
                { ...matchRoom.currentQuestion.choices[3], tally: 0 },
            ],
        });
    });
});
