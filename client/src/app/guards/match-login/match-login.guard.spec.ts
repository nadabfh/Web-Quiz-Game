import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { matchLoginGuard } from './match-login.guard';
import SpyObj = jasmine.SpyObj;
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { MatchContext } from '@app/constants/states';

describe('matchLoginGuard', () => {
    let matchRoomSpy: SpyObj<MatchRoomService>;
    let routerSpy: SpyObj<Router>;
    let notificationSpy: SpyObj<NotificationService>;
    let questionContextSpy: SpyObj<MatchContextService>;

    beforeEach(() => {
        matchRoomSpy = jasmine.createSpyObj('MatchRoomService', ['getRoomCode', 'getUsername', 'gameOver']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage']);
        questionContextSpy = jasmine.createSpyObj('QuestionContextService', ['getContext']);

        TestBed.configureTestingModule({
            providers: [
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
            ],
        });
    });

    it('should be created', () => {
        expect(matchLoginGuard).toBeTruthy();
    });

    it('should redirect to home page if match room code or username are empty', () => {
        matchRoomSpy.getRoomCode.and.returnValue('');
        matchRoomSpy.getUsername.and.returnValue('');
        TestBed.runInInjectionContext(matchLoginGuard);
        expect(routerSpy.navigateByUrl).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should not redirect to home page if room code and username are defined', () => {
        matchRoomSpy.getRoomCode.and.returnValue('mock');
        matchRoomSpy.getUsername.and.returnValue('mock');
        TestBed.runInInjectionContext(matchLoginGuard);
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).not.toHaveBeenCalled();
    });

    it('should redirect to home page if is testPage and page refreshed while game is playing', () => {
        questionContextSpy.getContext.and.returnValue(MatchContext.TestPage);
        matchRoomSpy.isPlaying = true;
        TestBed.runInInjectionContext(matchLoginGuard);
        expect(routerSpy.navigateByUrl).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should not redirect to home page if is testPage and game is starting', () => {
        questionContextSpy.getContext.and.returnValue(MatchContext.TestPage);
        matchRoomSpy.isPlaying = false;
        matchRoomSpy.getRoomCode.and.returnValue('mock');
        matchRoomSpy.getUsername.and.returnValue('mock');
        TestBed.runInInjectionContext(matchLoginGuard);
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).not.toHaveBeenCalled();
    });
});
