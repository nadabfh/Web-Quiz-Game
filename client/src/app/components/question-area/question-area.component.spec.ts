/* eslint-disable @typescript-eslint/no-magic-numbers */
// To let the tests run smoothly
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { WarningMessage } from '@app/constants/feedback-messages';
import { getMockQuestion } from '@app/constants/question-mocks';
import { MatchContext } from '@app/constants/states';
import { Player } from '@app/interfaces/player';
import { AnswerService } from '@app/services/answer/answer.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { TimeService } from '@app/services/time/time.service';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { QuestionAreaComponent } from './question-area.component';
import spyObj = jasmine.SpyObj;
import { MatIconModule } from '@angular/material/icon';

class SocketHandlerServiceMock extends SocketHandlerService {
    override connect() {}
}

@Component({
    selector: 'app-players-list',
    template: '',
})
class MockPlayersListComponent {
    @Input() players = [] as Player[];
}

@Component({
    selector: 'app-chat',
    template: '',
})
class MockChatComponent {}
@Component({
    selector: 'app-multiple-choice-area',
    template: '',
})
class MockMultipleChoiceAreaComponent {}

@Component({
    selector: 'app-alert',
    template: '',
})
class MockAlertComponent {}
@Component({
    selector: 'app-audio-player',
    template: '',
})
class MockAudioPlayerComponent {}

describe('QuestionAreaComponent', () => {
    let component: QuestionAreaComponent;
    let fixture: ComponentFixture<QuestionAreaComponent>;
    let timerSpy: spyObj<TimeService>;
    let routerSpy: spyObj<Router>;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;
    let matchRoomSpy: spyObj<MatchRoomService>;
    let questionContextSpy: spyObj<MatchContextService>;
    let notificationServiceSpy: spyObj<NotificationService>;
    let answerSpy: spyObj<AnswerService>;
    let router: Router;

    const routes: Routes = [{ path: 'home', component: QuestionAreaComponent }];

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

        answerSpy = jasmine.createSpyObj('AnswerService', [
            'selectChoice',
            'deselectChoice',
            'submitAnswer',
            'onFeedback',
            'onBonusPoints',
            'onEndGame',
            'onTimesUp',
            'onGradeAnswers',
            'resetStateForNewQuestion',
            'listenToAnswerEvents',
        ]);

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

        timerSpy = jasmine.createSpyObj('TimeService', [
            'startTimer',
            'stopTimer',
            'pauseTimer',
            'triggerPanicTimer',
            'handleTimer',
            'handleStopTimer',
            'computeTimerProgress',
            'listenToTimerEvents',
        ]);

        questionContextSpy = jasmine.createSpyObj('QuestionContextService', ['getContext']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['openWarningDialog']);

        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(routerSpy);
        socketSpy.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [
                QuestionAreaComponent,
                MockChatComponent,
                MockPlayersListComponent,
                MockMultipleChoiceAreaComponent,
                MockAlertComponent,
                MockAudioPlayerComponent,
            ],
            imports: [
                RouterTestingModule.withRoutes(routes),
                HttpClientTestingModule,
                MatSnackBarModule,
                MatDialogModule,
                MatProgressSpinnerModule,
                MatIconModule,
            ],
            providers: [
                HttpClient,
                { provide: SocketHandlerService, useValue: socketSpy },
                { provide: AnswerService, useValue: answerSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: TimeService, useValue: timerSpy },
            ],
        }).compileComponents();

        matchRoomSpy.currentQuestion = getMockQuestion();

        fixture = TestBed.createComponent(QuestionAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the answer options type', () => {
        const answerOptions = component.answerOptions;
        expect(answerOptions).toEqual(AnswerCorrectness);
    });

    it('should deactivate page on results page', () => {
        matchRoomSpy.isResults = true;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page when player or host is quitting', () => {
        matchRoomSpy.isResults = false;
        matchRoomSpy.isQuitting = true;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page if on test page', () => {
        matchRoomSpy.isResults = false;
        matchRoomSpy.isQuitting = false;

        questionContextSpy.getContext.and.returnValue(MatchContext.TestPage);
        const isDeactivated = component.canDeactivate();
        expect(matchRoomSpy.disconnect).toHaveBeenCalled();
        expect(matchRoomSpy.isQuitting).toBe(true);
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page host quit', () => {
        matchRoomSpy.isResults = false;
        matchRoomSpy.isQuitting = false;
        questionContextSpy.getContext.and.returnValue(MatchContext.PlayerView);
        matchRoomSpy.isHostPlaying = false;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should prompt user if back button is pressed and only deactivate if user confirms', () => {
        matchRoomSpy.isResults = false;
        matchRoomSpy.isQuitting = false;
        questionContextSpy.getContext.and.returnValue(MatchContext.PlayerView);
        matchRoomSpy.isHostPlaying = true;
        const deactivateSubject = new Subject<boolean>();
        notificationServiceSpy.openWarningDialog.and.returnValue(deactivateSubject);
        const result = component.canDeactivate();
        expect(result instanceof Subject).toBeTrue();
        expect(notificationServiceSpy.openWarningDialog).toHaveBeenCalledWith(WarningMessage.QUIT);
        expect(matchRoomSpy.disconnect).not.toHaveBeenCalled();
        deactivateSubject.next(true);
        expect(matchRoomSpy.disconnect).toHaveBeenCalled();
    });

    it('should handle enter event', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        answerSpy.isSelectionEnabled = true;
        spyOn(component, 'submitAnswers');
        component.handleKeyboardEvent(event);
        expect(component.submitAnswers).toHaveBeenCalled();
    });

    it('should not submit answer if chat input is active and enter is pressed', () => {
        const chatInput = document.createElement('input');
        chatInput.id = 'chat-input';
        Object.defineProperty(document, 'activeElement', { value: chatInput, writable: true });
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'submitAnswers');
        component.handleKeyboardEvent(event);
        expect(component.submitAnswers).not.toHaveBeenCalled();
        Object.defineProperty(document, 'activeElement', { value: component, writable: true });
    });

    it('should submit answers when submitAnswers is called', () => {
        component.submitAnswers();
        expect(answerSpy.submitAnswer).toHaveBeenCalled();
    });

    it('should go to next question when nextQuestion is called', () => {
        answerSpy.isNextQuestionButtonEnabled = true;
        component.goToNextQuestion();
        expect(matchRoomSpy.goToNextQuestion).toHaveBeenCalled();
        expect(answerSpy.isNextQuestionButtonEnabled).toBe(false);
    });

    it('quitGame() navigate to home page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        matchRoomSpy.isResults = true;
        component.quitGame();
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('should call matchRoomService.routeToResultsPage when routeToResultsPage is called', () => {
        component.routeToResultsPage();

        expect(matchRoomSpy.routeToResultsPage).toHaveBeenCalled();
    });

    it('should delegate toggle panic timer to timerService when triggerPanicTimer() is called', () => {
        component.triggerPanicTimer();
        expect(timerSpy.triggerPanicTimer).toHaveBeenCalled();
    });

    it('should delegate pause timer to timerService when pauseTimer() is called', () => {
        component.pauseTimer();
        expect(timerSpy.pauseTimer).toHaveBeenCalled();
    });
});
