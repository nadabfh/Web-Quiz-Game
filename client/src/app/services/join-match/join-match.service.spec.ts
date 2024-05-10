import { TestBed } from '@angular/core/testing';

import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { JoinMatchService } from './join-match.service';

const SERVER_URL: string = environment.serverUrl;

describe('JoinMatchService', () => {
    let service: JoinMatchService;
    let matchRoomSpy: jasmine.SpyObj<MatchRoomService>;
    let notificationSpy: jasmine.SpyObj<NotificationService>;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        matchRoomSpy = jasmine.createSpyObj(MatchRoomService, ['connect', 'joinRoom', 'gameOver']);
        notificationSpy = jasmine.createSpyObj(NotificationService, ['displayErrorMessage']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: NotificationService, useValue: notificationSpy },
            ],
        });
        service = TestBed.inject(JoinMatchService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('validateMatchRoomCode() should validate the code using HTTP POST', () => {
        const mockResponse = 'mockResponse';
        const MOCK_URL = `${SERVER_URL}/match/validate-code`;
        service.validateMatchRoomCode('').subscribe((data) => {
            expect(data.body).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(MOCK_URL);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('postUsername() should validate the username using HTTP POST', () => {
        const mockResponse = 'mockResponse';
        const MOCK_URL = `${SERVER_URL}/match/validate-code`;
        service.validateUsername('');
        service.validateMatchRoomCode('').subscribe((data) => {
            expect(data.body).toEqual(mockResponse);
        });
        const req = httpMock.expectOne(MOCK_URL);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('validateUsername() should add player to match room if response is valid and reset client match room code to set up final validation', () => {
        const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });
        const postSpy = spyOn(service, 'postUsername').and.returnValue(of(mockHttpResponse));
        const addSpy = spyOn(service, 'addPlayerToMatchRoom').and.returnValue();
        service.validateUsername('');
        expect(postSpy).toHaveBeenCalled();
        expect(addSpy).toHaveBeenCalled();
        expect(service.matchRoomCode).toEqual('');
    });

    it('validateUsername() should display error notification and not add player to match room if response is invalid', () => {
        const httpError = new HttpErrorResponse({
            status: 409,
            error: { code: '409', message: 'mock' },
        });
        spyOn(JSON, 'parse').and.returnValue(httpError.error);
        const postSpy = spyOn(service, 'postUsername').and.returnValue(throwError(() => httpError));
        const addSpy = spyOn(service, 'addPlayerToMatchRoom').and.returnValue();
        service.validateUsername('');
        expect(postSpy).toHaveBeenCalled();
        expect(addSpy).not.toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('addPlayerToMatchRoom() should let the player connect and join the room', () => {
        service.addPlayerToMatchRoom('', '');
        expect(matchRoomSpy.connect).toHaveBeenCalled();
        expect(matchRoomSpy.joinRoom).toHaveBeenCalled();
    });
});
