/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatchRoom } from '@app/model/schema/match-room.schema';
import { LongAnswerStrategy } from './long-answer-strategy';
import { LongAnswer } from '@app/model/answer-types/long-answer/long-answer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { MOCK_PLAYER, MOCK_PLAYER_ROOM } from '@app/constants/match-mocks';
import { GradingEvents } from '@app/constants/grading-events';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { GradeTracker } from '@app/model/tally-trackers/grade-tracker/grade-tracker';
import { PlayerCountHistogram } from '@common/interfaces/histogram';
import { AnswerEvents } from '@common/events/answer.events';
import { Grade } from '@common/interfaces/choice-tally';

describe('LongAnswerStrategy', () => {
    let strategy: LongAnswerStrategy;
    let matchRoom: MatchRoom;
    let mockHostSocket;
    let mockPlayerSocket;
    let eventEmitterMock;
    let grades: LongAnswerInfo[];
    let gradeTracker: GradeTracker;
    const currentTime = 100000;

    beforeEach(async () => {
        eventEmitterMock = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [LongAnswerStrategy, { provide: EventEmitter2, useValue: eventEmitterMock }],
        }).compile();

        mockHostSocket = {
            emit: jest.fn(),
        };

        mockPlayerSocket = {
            emit: jest.fn(),
        };

        strategy = module.get<LongAnswerStrategy>(LongAnswerStrategy);

        matchRoom = { ...MOCK_PLAYER_ROOM };
        matchRoom.hostSocket = mockHostSocket;

        const player1 = { ...MOCK_PLAYER };
        player1.username = 'player1';
        player1.answer = { answer: 'answer1', isSubmitted: true, timestamp: currentTime - 1000 } as LongAnswer;
        player1.socket = mockPlayerSocket;
        matchRoom.players[0] = player1;

        const player2 = { ...MOCK_PLAYER };
        player2.username = 'player2';
        player2.answer = { answer: 'answer2', isSubmitted: false, timestamp: currentTime - 2000 } as LongAnswer;
        player2.socket = mockPlayerSocket;
        matchRoom.players[1] = player2;

        const player3 = { ...MOCK_PLAYER };
        player3.username = 'player3';
        player3.answer = { answer: 'answer3', isSubmitted: false, timestamp: currentTime - 9000 } as LongAnswer;
        player3.socket = mockPlayerSocket;
        matchRoom.players[2] = player3;

        grades = [
            { username: player1.username, answer: player1.answer.answer, score: '0' },
            { username: player2.username, answer: player2.answer.answer, score: '50' },
            { username: player3.username, answer: player3.answer.answer, score: '100' },
        ];

        gradeTracker = new GradeTracker(matchRoom.currentQuestion.text, strategy['getPossibleGrades']());
        grades.forEach((grade) => gradeTracker.incrementCount(grade.score));

        jest.spyOn<any, any>(Date, 'now').mockReturnValue(currentTime);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    it('gradeAnswers() should call prepareAnswersForGrading', () => {
        const gradingSpy = jest.spyOn<any, any>(strategy, 'prepareAnswersForGrading').mockReturnThis();
        strategy.gradeAnswers(matchRoom, matchRoom.players);
        expect(gradingSpy).toHaveBeenCalledWith(matchRoom, matchRoom.players);
    });

    it("calculateScore() should calculate every player's score from host's grading and emit grading complete event", () => {
        const possibleGradesSpy = jest.spyOn<any, any>(strategy, 'getPossibleGrades');

        const currentQuestionPoints = matchRoom.currentQuestion.points;

        const oldPlayer1Score = matchRoom.players[0].score;
        const oldPlayer2Score = matchRoom.players[1].score;
        const oldPlayer3Score = matchRoom.players[2].score;

        strategy.calculateScore(matchRoom, matchRoom.players, grades);

        expect(possibleGradesSpy).toHaveBeenCalled();
        expect(matchRoom.players[0].score).toEqual(oldPlayer1Score);
        expect(matchRoom.players[1].score).toEqual(oldPlayer2Score + currentQuestionPoints / 2);
        expect(matchRoom.players[2].score).toEqual(oldPlayer3Score + currentQuestionPoints);

        expect(eventEmitterMock.emit).toHaveBeenCalledWith(GradingEvents.GradingComplete, matchRoom.code);
    });

    it('calculateScore() should tally grades and call buildGradesHistogram', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(strategy, 'buildGradesHistogram').mockReturnThis();

        strategy.calculateScore(matchRoom, matchRoom.players, grades);

        expect(buildHistogramSpy).toHaveBeenCalledWith(matchRoom, gradeTracker);
    });

    it('buildHistogram() should delegate histogram creation to buildPlayerCountHistogram', () => {
        const buildHistogramSpy = jest.spyOn<any, any>(strategy, 'buildPlayerCountHistogram').mockReturnThis();

        strategy.buildHistogram(matchRoom);

        expect(buildHistogramSpy).toHaveBeenCalledWith(matchRoom);
    });

    it('buildPlayerCountHistogram() should build a histogram of every active players in the last 5 seconds', () => {
        const longAnswerHistogram: PlayerCountHistogram = strategy.buildPlayerCountHistogram(matchRoom);

        expect(longAnswerHistogram).toStrictEqual({
            question: matchRoom.currentQuestion.text,
            type: 'QRL',
            playerCount: 3,
            activePlayers: 2,
            inactivePlayers: 1,
        });
    });

    it('buildPlayerCountHistogram() should not count players that have left the game', () => {
        matchRoom.players[2].isPlaying = false;
        const longAnswerHistogram: PlayerCountHistogram = strategy.buildPlayerCountHistogram(matchRoom);

        expect(longAnswerHistogram).toStrictEqual({
            question: matchRoom.currentQuestion.text,
            type: 'QRL',
            playerCount: 2,
            activePlayers: 2,
            inactivePlayers: 0,
        });
    });

    it('buildGradesHistogram() should convert current matchRoom histogram into a GradesHistogram', () => {
        strategy['buildGradesHistogram'](matchRoom, gradeTracker);

        expect(matchRoom.matchHistograms[matchRoom.currentQuestionIndex]).toStrictEqual({
            question: matchRoom.currentQuestion.text,
            type: 'QRL',
            gradeTallies: [
                { score: '0', tally: 1 },
                { score: '50', tally: 1 },
                { score: '100', tally: 1 },
            ],
        });
    });

    it("prepareAnswersForGrading() should convert every players's answers to a list of LongAnswerInfo for grading of a regular match", () => {
        matchRoom.isTestRoom = false;
        grades.forEach((grade) => (grade.score = null));

        strategy['prepareAnswersForGrading'](matchRoom, matchRoom.players);

        expect(mockHostSocket.emit).toHaveBeenCalledWith(AnswerEvents.GradeAnswers, grades);
    });

    it('prepareAnswersForGrading() should call calculateScore with the best score for grading of a test match', () => {
        const calculateScoreSpy = jest.spyOn<any, any>(strategy, 'calculateScore').mockReturnThis();
        const testAnswer: LongAnswerInfo[] = [{ username: matchRoom.players[0].username, answer: '', score: '100' }];
        matchRoom.isTestRoom = true;

        strategy['prepareAnswersForGrading'](matchRoom, matchRoom.players);

        expect(calculateScoreSpy).toHaveBeenCalledWith(matchRoom, matchRoom.players, testAnswer);
    });

    it('getPossibleGrades() should return a list of possible grades available in the type AnswerCorrectness', () => {
        const possibleGrades: Grade[] = strategy['getPossibleGrades']();

        expect(possibleGrades).toStrictEqual([{ score: '0' }, { score: '50' }, { score: '100' }]);
    });
});
