import { TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { MatchContext } from '@app/constants/states';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { AnswerEvents } from '@common/events/answer.events';
import { Feedback } from '@common/interfaces/feedback';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { UserInfo } from '@common/interfaces/user-info';
import { Socket } from 'socket.io-client';
import { AnswerService } from './answer.service';
import SpyObj = jasmine.SpyObj;

class SocketHandlerServiceMock extends SocketHandlerService {
    // Override connect() is required to not actually connect the socket
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('AnswerService', () => {
    let service: AnswerService;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;
    let router: SpyObj<Router>;
    let questionContextSpy: SpyObj<MatchContextService>;
    let matchRoomSpy: SpyObj<MatchRoomService>;
    let answers: LongAnswerInfo[];

    beforeEach(() => {
        router = jasmine.createSpyObj('Router', ['']);

        questionContextSpy = jasmine.createSpyObj('MatchContextService', ['setContext', 'getContext']);

        matchRoomSpy = jasmine.createSpyObj('MatchRoomService', [
            'goToNextQuestion',
            'getUsername',
            'getRoomCode',
            'disconnect',
            'sendPlayersData',
            'onRouteToResultsPage',
            'routeToResultsPage',
            'onGameOver',
        ]);

        matchRoomSpy.getUsername.and.returnValue('mockUsername');
        matchRoomSpy.getRoomCode.and.returnValue('mockRoomCode');

        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(router);
        socketSpy.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketHandlerService, useValue: socketSpy },
                { provide: Router, useValue: router },
                { provide: MatchContextService, useValue: questionContextSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
            ],
        });
        service = TestBed.inject(AnswerService);

        answers = [
            { username: 'player1', answer: 'answer1', score: '0' },
            { username: 'player2', answer: 'answer2', score: '0' },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send the selected choice info', () => {
        const choice = 'A';
        const userInfo: UserInfo = { roomCode: '123', username: 'John' };
        const choiceInfo = { choice, userInfo };

        spyOn(service.socketService, 'send');

        service.selectChoice(choice, userInfo);

        expect(service.socketService.send).toHaveBeenCalledWith('selectChoice', choiceInfo);
    });

    it('should send the deselected choice info', () => {
        const choice = 'A';
        const userInfo: UserInfo = { roomCode: '123', username: 'John' };
        const choiceInfo = { choice, userInfo };

        spyOn(service.socketService, 'send');

        service.deselectChoice(choice, userInfo);

        expect(service.socketService.send).toHaveBeenCalledWith('deselectChoice', choiceInfo);
    });

    it('should send the answer info', () => {
        const userInfo: UserInfo = { roomCode: '123', username: 'John' };

        spyOn(service.socketService, 'send');

        service.submitAnswer(userInfo);

        expect(service.socketService.send).toHaveBeenCalledWith('submitAnswer', userInfo);
    });

    it('should receive feedback', () => {
        const feedback: Feedback = { correctAnswer: ['A'], answerCorrectness: AnswerCorrectness.GOOD, score: 100 };

        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feedbackSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb(feedback);
        });

        service.onFeedback();
        socketHelper.peerSideEmit('feedback', feedback);

        expect(feedbackSpy).toHaveBeenCalled();
    });

    it('should call nextQuestion() on feedback if context is test page', () => {
        const feedback: Feedback = { correctAnswer: ['A'], answerCorrectness: AnswerCorrectness.GOOD, score: 100 };
        service.isNextQuestionButtonEnabled = true;
        questionContextSpy.getContext.and.returnValue(MatchContext.TestPage);
        service.onFeedback();
        socketHelper.peerSideEmit('feedback', feedback);

        expect(service.isNextQuestionButtonEnabled).toBe(false);
        expect(matchRoomSpy.goToNextQuestion).toHaveBeenCalled();
    });

    it('should call nextQuestion() on feedback if context is random page', () => {
        const feedback: Feedback = { correctAnswer: ['A'], answerCorrectness: AnswerCorrectness.GOOD, score: 100 };
        service.isNextQuestionButtonEnabled = true;
        questionContextSpy.getContext.and.returnValue(MatchContext.RandomMode);
        service.onFeedback();
        socketHelper.peerSideEmit('feedback', feedback);

        expect(service.isNextQuestionButtonEnabled).toBe(false);
        expect(matchRoomSpy.goToNextQuestion).toHaveBeenCalled();
    });

    it('should receive bonus points', () => {
        const bonusPoints = 100;

        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bonusPointsSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb(bonusPoints);
        });

        service.onBonusPoints();
        socketHelper.peerSideEmit('bonus', bonusPoints);

        expect(bonusPointsSpy).toHaveBeenCalled();
    });

    it('should receive gameOver event', () => {
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gameOverSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => void) => {
            cb('');
        });
        service.onEndGame();
        socketHelper.peerSideEmit('endGame');
        expect(gameOverSpy).toHaveBeenCalled();
    });

    it('resetStateForNewQuestion() should reset parameters state to beginning of match', () => {
        service.feedback = { score: 100 } as Feedback;
        service.correctAnswer = ['correct'];
        service.gradeAnswers = true;
        service.isGradingComplete = true;
        service.showFeedback = true;
        service.isSelectionEnabled = false;
        service.answerCorrectness = AnswerCorrectness.GOOD;
        service.bonusPoints = 30;
        service.isNextQuestionButtonEnabled = true;
        service.isTimesUp = true;
        service.isEndGame = true;
        service.currentLongAnswer = 'answer';

        service.resetStateForNewQuestion();

        expect(service.feedback).not.toContain('score');
        expect(service.correctAnswer).toHaveSize(0);
        expect(service.gradeAnswers).toBe(false);
        expect(service.isGradingComplete).toBe(false);
        expect(service.showFeedback).toBe(false);
        expect(service.isSelectionEnabled).toBe(true);
        expect(service.bonusPoints).toEqual(0);
        expect(service.isNextQuestionButtonEnabled).toBe(false);
        expect(service.isTimesUp).toBe(false);
        expect(service.isEndGame).toBe(false);
        expect(service.currentLongAnswer).toEqual('');
    });

    it('updateLongAnswer() should send correct long answer information to server if selection is enabled', () => {
        const sendSpy = spyOn(service.socketService, 'send').and.returnValue();
        service.isSelectionEnabled = true;
        service.currentLongAnswer = 'current answer';
        service.updateLongAnswer();
        expect(sendSpy).toHaveBeenCalledWith(AnswerEvents.UpdateLongAnswer, {
            choice: 'current answer',
            userInfo: {
                username: 'mockUsername',
                roomCode: 'mockRoomCode',
            },
        });

        service.isSelectionEnabled = false;
        service.updateLongAnswer();

        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('should receive grades for correction', () => {
        service.playersAnswers = [] as LongAnswerInfo[];
        service.gradeAnswers = false;

        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gradeSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb(answers);
        });

        service.onGradeAnswers();
        socketHelper.peerSideEmit('gradeSpy', answers);

        expect(gradeSpy).toHaveBeenCalled();
        expect(service.playersAnswers).toEqual(answers);
        expect(service.gradeAnswers).toBe(true);
    });

    it('should reset state on new question', () => {
        const resetSpy = spyOn(service, 'resetStateForNewQuestion').and.returnValue();
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nextQuestionSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb('');
        });

        service.onNextQuestion();
        socketHelper.peerSideEmit('nextQuestion');

        expect(nextQuestionSpy).toHaveBeenCalled();
        expect(resetSpy).toHaveBeenCalled();
    });

    it('should react on times up event', () => {
        service.isTimesUp = false;
        service.isSelectionEnabled = true;
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timesUpSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb('');
        });

        service.onTimesUp();
        socketHelper.peerSideEmit('timesUp');

        expect(timesUpSpy).toHaveBeenCalled();
        expect(service.isTimesUp).toBe(true);
        expect(service.isSelectionEnabled).toBe(false);
    });

    it('should send the grades info', () => {
        service.gradeAnswers = true;
        service.playersAnswers = answers;

        spyOn(service.socketService, 'send');

        service.sendGrades();

        expect(service.socketService.send).toHaveBeenCalledWith('grades', { matchRoomCode: 'mockRoomCode', grades: answers });
    });

    it('should set isGradingComplete to true if all answers have scores', () => {
        service.playersAnswers = [{ score: '0' } as LongAnswerInfo, { score: '50' } as LongAnswerInfo, { score: '100' } as LongAnswerInfo];
        service.handleGrading();
        expect(service.isGradingComplete).toBe(true);
    });

    it('should set isGradingComplete to false if any answer is missing a score', () => {
        service.playersAnswers = [{ score: '0' } as LongAnswerInfo, { score: null } as unknown as LongAnswerInfo, { score: '100' } as LongAnswerInfo];
        service.handleGrading();
        expect(service.isGradingComplete).toBe(false);
    });
});
