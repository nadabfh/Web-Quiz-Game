/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { getMockGame } from '@app/constants/game-mocks';
import { Game } from '@app/interfaces/game';
import { ChoiceValidationService } from '@app/services/choice-validation/choice-validation.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { Observable, of } from 'rxjs';
import { MatchService } from './match.service';

describe('MatchService', () => {
    let service: MatchService;
    let choiceValidationSpy: jasmine.SpyObj<ChoiceValidationService>;
    let notificationSpy: jasmine.SpyObj<NotificationService>;
    let matchRoomSpy: jasmine.SpyObj<MatchRoomService>;
    const fakeGame: Game = {
        id: '0',
        title: 'title',
        description: 'desc',
        lastModification: 'new Date(YEAR, 1, 1)',
        duration: 30,
        isVisible: true,
        questions: [
            {
                id: 'getRandomString',
                type: 'QCM',
                text: 'getRandomString',
                points: 30,
                choices: [],
                lastModification: ' new Date(YEAR, 1, 1)',
            },
        ],
    };
    const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });

    beforeEach(() => {
        matchRoomSpy = jasmine.createSpyObj('MatchRoomService', ['connect', 'createRoom', 'gameOver']);
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage']);
        choiceValidationSpy = jasmine.createSpyObj('ChoiceValidationService', ['validateChoices']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                MatchService,
                { provide: ChoiceValidationService, useValue: choiceValidationSpy },
                { provide: NotificationService, useValue: notificationSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
            ],
        }).compileComponents();
        service = TestBed.inject(MatchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('questionAdvanced$ should return an observable', () => {
        const result = service.questionAdvanced$;
        expect(result).toBeInstanceOf(Observable);
    });

    it('should set current game and get current game correctly', () => {
        service.currentGame = fakeGame;
        const value = service.currentGame;
        expect(value).toEqual(fakeGame);
    });

    it('advanceQuestion should emit a value', () => {
        let emitted = false;
        service.questionAdvanced$.subscribe(() => {
            emitted = true;
        });
        service.advanceQuestion();

        expect(emitted).toBeTruthy();
    });

    it('should get all games with success using GetAllGames', () => {
        const spy = spyOn(service, 'getAllGames').and.returnValue(of([fakeGame]));
        service.getAllGames();
        expect(spy).toHaveBeenCalled();
    });

    it('should set and get question id correctly', () => {
        const questionId = '12345';
        service.questionId = questionId;
        const value = service.questionId;
        expect(value).toEqual(questionId);
    });

    it('should get a backup of a game with success', () => {
        const spy = spyOn(service, 'getById').and.returnValue(of(fakeGame));
        service.getBackupGame(fakeGame.id);
        expect(spy).toHaveBeenCalledOnceWith(fakeGame.id, 'backups');
    });

    it('should save a backup of a game with success', () => {
        const spy = spyOn(service, 'add').and.returnValue(of(mockHttpResponse));
        service.currentGame = fakeGame;
        service.saveBackupGame(fakeGame.id);
        expect(spy).toHaveBeenCalledOnceWith(fakeGame, `backups/${fakeGame.id}`);
    });

    it('should delete a backup of a game with success', () => {
        const spy = spyOn(service, 'delete').and.returnValue(of(mockHttpResponse));
        service.deleteBackupGame(fakeGame.id);
        expect(spy).toHaveBeenCalledOnceWith(`backups/${fakeGame.id}`);
    });

    it('createMatch() should connect and create room', () => {
        service.currentGame = getMockGame();
        service.createMatch();
        expect(matchRoomSpy.connect).toHaveBeenCalled();
        expect(matchRoomSpy.createRoom).toHaveBeenCalled();
    });

    it('getAllGames should get all games', () => {
        const spy = spyOn(service, 'getAll').and.returnValue(of([getMockGame()]));
        service.getAllGames();
        expect(spy).toHaveBeenCalledWith('games');
    });
});
