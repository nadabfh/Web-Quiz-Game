import { HttpClient, HttpErrorResponse, HttpHandler, HttpResponse } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getMockGame } from '@app/constants/game-mocks';
import { ManagementState } from '@app/constants/states';
import { Game } from '@app/interfaces/game';
import { NotificationService } from '@app/services/notification/notification.service';
import { of, throwError } from 'rxjs';
import { GameService } from './game.service';

const MOCK_GAMES = [getMockGame(), getMockGame()];
const NEW_MOCK_GAME = getMockGame();
const MOCK_HTTP_RESPONSE_GAME: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(NEW_MOCK_GAME) });

describe('GameService', () => {
    let service: GameService;
    let notificationSpy: jasmine.SpyObj<NotificationService>;
    let dialogMock: jasmine.SpyObj<MatDialog>;

    beforeEach(waitForAsync(() => {
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage', 'displaySuccessMessage']);
        dialogMock = jasmine.createSpyObj({
            open: jasmine.createSpyObj({
                afterClosed: of('mockResult'),
            }),
        });
        TestBed.configureTestingModule({
            providers: [
                GameService,
                HttpClient,
                HttpHandler,
                MatSnackBar,
                MatDialog,
                { provide: MatDialog, useValue: dialogMock },
                { provide: NotificationService, useValue: notificationSpy },
            ],
        });
        service = TestBed.inject(GameService);
        service.games = MOCK_GAMES;
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get all games successfully with getGames()', () => {
        const spy = spyOn(service, 'getAll').and.returnValue(of(MOCK_GAMES));
        service.getGames();
        expect(spy).toHaveBeenCalled();
        expect(service.games).toEqual(MOCK_GAMES);
    });

    it('should display error message if service cannot get all games', () => {
        const spy = spyOn(service, 'getAll').and.returnValue(throwError(() => new Error('error')));
        service.getGames();
        expect(service.games).toEqual(MOCK_GAMES);
        expect(spy).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should get a game by id with getGameById', () => {
        const spy = spyOn(service, 'getById').and.returnValue(of(NEW_MOCK_GAME));
        service.getGameById(NEW_MOCK_GAME.id).subscribe((data: Game) => {
            expect(data).toEqual(NEW_MOCK_GAME);
        });
        expect(spy).toHaveBeenCalled();
    });

    it('should toggle visibility with toggleGameVisibility()', () => {
        const spy = spyOn(service, 'update').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        const visibleGame = getMockGame();
        service.toggleGameVisibility(visibleGame);
        expect(visibleGame.isVisible).toBeFalsy();
        expect(spy).toHaveBeenCalled();
    });

    it('should add a game successfully with addGame()', () => {
        const spy = spyOn(service, 'add').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        service.uploadGame(NEW_MOCK_GAME);
        expect(spy).toHaveBeenCalled();
    });

    it('should be able to upload a game (with appropriate body in the response) and display success message', () => {
        const MOCK_HTTP_RESPONSE_GAME_WITH_BODY: HttpResponse<string> = new HttpResponse({
            status: 200,
            statusText: 'OK',
            body: JSON.stringify(NEW_MOCK_GAME),
        });
        const addSpy = spyOn(service, 'addGame').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME_WITH_BODY));
        const expectedLength = service.games.length + 1;
        service.uploadGame(NEW_MOCK_GAME);
        expect(service.games.length).toEqual(expectedLength);
        expect(addSpy).toHaveBeenCalled();
        expect(notificationSpy.displaySuccessMessage).toHaveBeenCalled();
    });

    it('should not add the game if it already exists and open dialog to ask to rename the game title', () => {
        const httpError = new HttpErrorResponse({
            status: 409,
            error: { code: '409', message: 'Requête add\n Un jeu du même titre existe déjà.' },
        });
        const addSpy = spyOn(service, 'addGame').and.returnValue(throwError(() => httpError));
        const openDialogSpy = spyOn(service, 'openDialog');
        service.uploadGame(NEW_MOCK_GAME);
        expect(openDialogSpy).toHaveBeenCalledWith(NEW_MOCK_GAME);
        expect(addSpy).toHaveBeenCalled();
    });

    it('should not add the game if it already exists and open dialog to ask to rename the game title', () => {
        const httpError = new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
        });
        const addSpy = spyOn(service, 'addGame').and.returnValue(throwError(() => httpError));
        service.uploadGame(NEW_MOCK_GAME);
        expect(addSpy).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should open a snackbar if uploadGame fails', () => {
        const addSpy = spyOn(service, 'addGame').and.returnValue(throwError(() => new Error('error')));
        service.uploadGame(NEW_MOCK_GAME);
        expect(addSpy).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should replace a game successfully using replaceGame()', () => {
        const modifiedGame = getMockGame();
        const spy = spyOn(service, 'put').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        service.replaceGame(modifiedGame);
        expect(spy).toHaveBeenCalled();
    });

    it('should submit a modified game if in modify state', () => {
        const replaceGameSpy = spyOn(service, 'replaceGame').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        const uploadGameSpy = spyOn(service, 'addGame').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        service.submitGame(NEW_MOCK_GAME, ManagementState.GameModify);
        expect(replaceGameSpy).toHaveBeenCalledWith(NEW_MOCK_GAME);
        expect(uploadGameSpy).not.toHaveBeenCalled();
    });

    it('should upload a game if not in create state', () => {
        const replaceGameSpy = spyOn(service, 'replaceGame').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        const uploadGameSpy = spyOn(service, 'addGame').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        service.submitGame(NEW_MOCK_GAME, ManagementState.GameCreate);
        expect(uploadGameSpy).toHaveBeenCalledWith(NEW_MOCK_GAME);
        expect(replaceGameSpy).not.toHaveBeenCalled();
    });

    it('openDialog() should open a dialog asking to change the game title and resubmit the updated game', () => {
        const addGameSpy = spyOn(service, 'uploadGame');
        service.openDialog(NEW_MOCK_GAME);
        expect(dialogMock.open).toHaveBeenCalled();
        const closeDialog = () => {
            return dialogMock.closeAll;
        };
        closeDialog();
        const changedTitleMockGame = NEW_MOCK_GAME;
        changedTitleMockGame.title = 'mockResult';
        expect(addGameSpy).toHaveBeenCalledWith(changedTitleMockGame);
    });

    it('should be able to delete a game from the list', () => {
        const deleteSpy = spyOn(service, 'delete').and.returnValue(of(MOCK_HTTP_RESPONSE_GAME));
        const gameToDeleteId = service.games[0].id;
        const expectedLength = service.games.length - 1;
        service.deleteGame(gameToDeleteId);
        expect(deleteSpy).toHaveBeenCalled();
        expect(service.games.length).toBe(expectedLength);
    });

    it('should open a snackbar if ondDeleteGameFromList fails', () => {
        const deleteSpy = spyOn(service, 'delete').and.returnValue(throwError(() => new Error('error')));
        service.deleteGame('');
        expect(deleteSpy).toHaveBeenCalled();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });
});
