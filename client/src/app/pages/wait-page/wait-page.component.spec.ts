/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { WarningMessage } from '@app/constants/feedback-messages';
import { Game } from '@app/interfaces/game';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchService } from '@app/services/match/match.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { TimeService } from '@app/services/time/time.service';
import { Subject } from 'rxjs';
import { WaitPageComponent } from './wait-page.component';
import SpyObj = jasmine.SpyObj;
import { HOST_USERNAME } from '@common/constants/match-constants';

@Component({
    selector: 'app-chat',
    template: '',
})
class MockChatComponent {}

describe('WaitPageComponent', () => {
    let component: WaitPageComponent;
    let fixture: ComponentFixture<WaitPageComponent>;
    let matchRoomSpy: SpyObj<MatchRoomService>;
    let matchSpy: SpyObj<MatchService>;
    let timeSpy: SpyObj<TimeService>;
    let questionContextSpy: SpyObj<MatchContextService>;
    let notificationServiceSpy: SpyObj<NotificationService>;
    let router: Router;

    const routes: Routes = [{ path: 'home', component: WaitPageComponent }];

    beforeEach(() => {
        matchRoomSpy = jasmine.createSpyObj('MatchRoomService', [
            'getUsername',
            'banUsername',
            'toggleLock',
            'connect',
            'startMatch',
            'getGameTitleObservable',
            'getStartMatchObservable',
            'matchStarted',
            'beginQuiz',
            'goToNextQuestion',
            'gameOver',
            'disconnect',
        ]);
        matchSpy = jasmine.createSpyObj('MatchService', ['']);
        questionContextSpy = jasmine.createSpyObj('QuestionContextService', ['setContext', 'getContext']);
        timeSpy = jasmine.createSpyObj('TimeService', ['handleTimer', 'handleStopTimer', 'computeTimerProgress', 'listenToTimerEvents']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage', 'openWarningDialog']);

        TestBed.configureTestingModule({
            declarations: [WaitPageComponent, MockChatComponent],
            imports: [RouterTestingModule.withRoutes(routes), HttpClientTestingModule, MatProgressSpinnerModule],
            providers: [
                HttpClient,
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: MatchService, useValue: matchSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
                { provide: TimeService, useValue: timeSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        });

        fixture = TestBed.createComponent(WaitPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initalize correctly for the host', () => {
        const mockGame: Game = {
            id: '1',
            title: 'test',
            description: 'test',
            lastModification: '2021-10-10T10:10:10.000Z',
            duration: 100,
            isVisible: true,
            questions: [],
        };
        spyOnProperty(component, 'isHost').and.returnValue(true);
        spyOnProperty(component, 'currentGame').and.returnValue(mockGame);

        component.ngOnInit();

        expect(matchRoomSpy.gameTitle).toEqual(mockGame.title);
    });

    it('should get current game', () => {
        expect(component.currentGame).toEqual(matchSpy.currentGame);
    });

    it('time() should return the time of the timeService', () => {
        const time = 100;
        component.timeService['time'] = time;
        expect(component.time).toEqual(time);
    });

    it('toggleLock() should call toggleLock of matchRoomService', () => {
        component.toggleLock();
        expect(matchRoomSpy.toggleLock).toHaveBeenCalled();
    });

    it('banUsername() should call banUsername of matchRoomService', () => {
        component.banPlayerUsername('test');
        expect(matchRoomSpy.banUsername).toHaveBeenCalledWith('test');
    });

    it('banUsername() should not call banUsername if user is the host', () => {
        component.banPlayerUsername(HOST_USERNAME);
        expect(matchRoomSpy.banUsername).not.toHaveBeenCalled();
    });

    it('startMatch() should call startMatch from matchRoomService', () => {
        component.startMatch();
        expect(matchRoomSpy.startMatch).toHaveBeenCalled();
    });

    it('quitGame() navigate to home page', () => {
        const navigateSpy = spyOn(router, 'navigateByUrl');
        matchRoomSpy.isQuitting = true;
        component.quitGame();
        expect(navigateSpy).toHaveBeenCalledWith('/home');
    });

    it('should deactivate page when player or host is quitting', () => {
        matchRoomSpy.isQuitting = true;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page host quit', () => {
        matchRoomSpy.isQuitting = false;
        matchRoomSpy.isHostPlaying = false;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page if wait is over', () => {
        matchRoomSpy.isQuitting = false;
        matchRoomSpy.isHostPlaying = true;
        matchRoomSpy.isWaitOver = true;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should deactivate page if user is banned', () => {
        matchRoomSpy.isQuitting = false;
        matchRoomSpy.isHostPlaying = true;
        matchRoomSpy.isWaitOver = false;
        matchRoomSpy.isBanned = true;
        const isDeactivated = component.canDeactivate();
        expect(isDeactivated).toBe(true);
    });

    it('should prompt user if back button is pressed and only deactivate if user confirms', () => {
        matchRoomSpy.isQuitting = false;
        matchRoomSpy.isHostPlaying = true;
        matchRoomSpy.isWaitOver = false;
        matchRoomSpy.isBanned = false;
        const deactivateSubject = new Subject<boolean>();
        notificationServiceSpy.openWarningDialog.and.returnValue(deactivateSubject);
        const result = component.canDeactivate();
        expect(result instanceof Subject).toBeTrue();
        expect(notificationServiceSpy.openWarningDialog).toHaveBeenCalledWith(WarningMessage.QUIT);
        expect(matchRoomSpy.disconnect).not.toHaveBeenCalled();
        deactivateSubject.next(true);
        expect(matchRoomSpy.disconnect).toHaveBeenCalled();
    });

    it('resetWaitPage() should reset all wait page attributes', () => {
        component.isLocked = true;
        matchRoomSpy.isMatchStarted = true;
        matchRoomSpy.isHostPlaying = false;
        matchRoomSpy.isBanned = true;
        matchRoomSpy.isQuitting = true;

        component['resetWaitPage']();

        expect(component.isLocked).toBe(false);
        expect(matchRoomSpy.isMatchStarted).toBe(false);
        expect(matchRoomSpy.isHostPlaying).toBe(true);
        expect(matchRoomSpy.isBanned).toBe(false);
        expect(matchRoomSpy.isQuitting).toBe(false);
    });
});
