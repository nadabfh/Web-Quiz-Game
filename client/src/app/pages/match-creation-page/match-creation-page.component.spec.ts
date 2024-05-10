import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SnackBarError } from '@app/constants/feedback-messages';
import { getMockGame } from '@app/constants/game-mocks';
import { MatDialogMock } from '@app/constants/mat-dialog-mock';
import { RANDOM_MODE_GAME } from '@app/constants/question-creation';
import { MatchContext } from '@app/constants/states';
import { Game } from '@app/interfaces/game';
import { Question } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';
import { MatchService } from '@app/services/match/match.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { QuestionService } from '@app/services/question/question.service';
import { MINIMUM_QUESTIONS } from '@common/constants/match-constants';
import { Subject, of, throwError } from 'rxjs';
import { MatchCreationPageComponent } from './match-creation-page.component';
import SpyObj = jasmine.SpyObj;
import { MatIconModule } from '@angular/material/icon';

describe('MatchCreationPageComponent', () => {
    let component: MatchCreationPageComponent;
    let fixture: ComponentFixture<MatchCreationPageComponent>;
    let gameService: GameService;
    let notificationSpy: SpyObj<NotificationService>;
    let questionContextSpy: SpyObj<MatchContextService>;
    let questionServiceSpy: SpyObj<QuestionService>;
    let questionsSubject: Subject<Question[]>;

    const invisibleGame: Game = { isVisible: false } as Game;
    const fakeGame: Game = getMockGame();

    const mockData: Question[] = [];
    for (let i = 0; i < MINIMUM_QUESTIONS; i++) {
        mockData.push(getMockGame().questions[0]);
    }

    const action = 'Actualiser';

    const snackBarMock = {
        onAction: () => {
            return of(undefined);
        },
    } as MatSnackBarRef<TextOnlySnackBar>;

    const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });

    const matchServiceSpy = jasmine.createSpyObj('MatchService', ['validateChoices', 'getAllGames', 'saveBackupGame', 'createMatch']);
    matchServiceSpy.getAllGames.and.returnValue(of([fakeGame]));
    matchServiceSpy.saveBackupGame.and.returnValue(of(mockHttpResponse));
    matchServiceSpy.validateChoices.and.returnValue(of(mockHttpResponse));

    beforeEach(() => {
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessageAction', 'openSnackBar', 'displayErrorMessage']);
        questionContextSpy = jasmine.createSpyObj('QuestionContextService', ['setContext']);
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['getAllQuestions']);

        TestBed.configureTestingModule({
            declarations: [MatchCreationPageComponent],
            imports: [HttpClientTestingModule, BrowserAnimationsModule, ScrollingModule, MatCardModule, MatIconModule],
            providers: [
                GameService,
                { provide: NotificationService, useValue: notificationSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: MatDialog, useClass: MatDialogMock },
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
            ],
        });
        fixture = TestBed.createComponent(MatchCreationPageComponent);
        gameService = TestBed.inject(GameService);

        component = fixture.componentInstance;

        questionsSubject = new Subject<Question[]>();
        questionServiceSpy.getAllQuestions.and.returnValue(questionsSubject.asObservable());
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on init', () => {
        expect(component.games).toBeDefined();
    });

    it('should handle load random game', () => {
        component.handleLoadRandomGame(mockData);
        expect(component.selectedGame).toEqual(RANDOM_MODE_GAME);
    });

    it('should load random game', () => {
        component.loadRandomGame();
        questionsSubject.next(mockData);
        expect(component.selectedGame).toEqual(RANDOM_MODE_GAME);
    });

    it('should load only visible games on init', () => {
        component.ngOnInit();
        const games = component.games;
        const isNotVisible = games.some((game) => !game.isVisible);
        expect(isNotVisible).toBeFalsy();
    });

    it('should load only visible games with reloadAllGames()', fakeAsync(() => {
        component.reloadAllGames();
        component.games = [fakeGame, invisibleGame];
        component.reloadAllGames();
        tick();
        const games = component.games;
        const expectedGames = [fakeGame];
        expect(games).toEqual(expectedGames);
        expect(invisibleGame.isVisible).toBeFalsy();
        flush();
    }));

    it('should load a visible selected game', fakeAsync(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(gameService, 'getGameById').and.returnValue(of(fakeGame));
        component.validateGame(fakeGame);
        component.loadSelectedGame(fakeGame);
        expect(component.selectedGame).toEqual(fakeGame);
        expect(component.gameIsValid).toBeTruthy();
    }));

    it('should reload a visible selected game', fakeAsync(() => {
        component.selectedGame = fakeGame;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(gameService, 'getGameById').and.returnValue(of(fakeGame));
        component.revalidateGame();
        component.reloadSelectedGame();
        expect(component.selectedGame).toEqual(fakeGame);
        expect(component.gameIsValid).toBeTruthy();
    }));

    it('should not load an invisible selected game', fakeAsync(() => {
        spyOn(gameService, 'getGameById').and.returnValue(of(invisibleGame));
        const spy = spyOn(component, 'validateGame');
        component.loadSelectedGame(invisibleGame);
        tick();
        expect(spy).toHaveBeenCalledWith(invisibleGame);
        expect(component.gameIsValid).toBeFalsy();
        flush();
    }));

    it('should not reload an invisible selected game', fakeAsync(() => {
        component.selectedGame = invisibleGame;
        spyOn(gameService, 'getGameById').and.returnValue(of(invisibleGame));
        const spy = spyOn(component, 'revalidateGame');
        component.reloadSelectedGame();
        tick();
        expect(spy).toHaveBeenCalled();
        expect(component.gameIsValid).toBeFalsy();
        flush();
    }));

    it('should not load a deleted selected game', fakeAsync(() => {
        notificationSpy.displayErrorMessageAction.and.returnValue(snackBarMock);
        spyOn(gameService, 'getGameById').and.returnValue(throwError(() => new Error('error')));
        const spy = spyOn(component, 'validateGame');
        component.loadSelectedGame({ id: '' } as Game);
        tick();
        expect(spy).not.toHaveBeenCalled();
        expect(component.gameIsValid).toBeFalsy();
        flush();
    }));

    it('should not reload a deleted selected game', fakeAsync(() => {
        component.selectedGame = {} as Game;
        const spy = spyOn(component, 'revalidateGame');
        component.reloadSelectedGame();
        tick();
        expect(spy).not.toHaveBeenCalled();
        expect(component.gameIsValid).toBeFalsy();
        flush();
    }));

    it('should open a snackbar when selecting an invisible game', fakeAsync(() => {
        notificationSpy.displayErrorMessageAction.and.returnValue(snackBarMock);
        component.validateGame(invisibleGame);
        tick();
        expect(notificationSpy.displayErrorMessageAction).toHaveBeenCalledWith(SnackBarError.INVISIBLE, action);
        flush();
    }));

    it('should open a snackbar when revalidating an invisible game', fakeAsync(() => {
        notificationSpy.displayErrorMessageAction.and.returnValue(snackBarMock);
        component.selectedGame = invisibleGame;
        component.revalidateGame();
        tick();
        expect(notificationSpy.displayErrorMessageAction).toHaveBeenCalledWith(SnackBarError.INVISIBLE, action);
        flush();
    }));

    it('should open a snackbar when selecting a deleted game', fakeAsync(() => {
        notificationSpy.displayErrorMessageAction.and.returnValue(snackBarMock);
        spyOn(gameService, 'getGameById').and.returnValue(throwError(() => new Error('error')));
        component.loadSelectedGame({ id: '' } as Game);
        expect(notificationSpy.displayErrorMessageAction).toHaveBeenCalledWith(SnackBarError.DELETED, action);
        flush();
    }));

    it('should open a snackbar when revalidating a deleted game', fakeAsync(() => {
        component.selectedGame = { id: '' } as Game;
        notificationSpy.displayErrorMessageAction.and.returnValue(snackBarMock);
        spyOn(gameService, 'getGameById').and.returnValue(throwError(() => new Error('error')));
        component.reloadSelectedGame();
        expect(notificationSpy.displayErrorMessageAction).toHaveBeenCalledWith(SnackBarError.DELETED, action);
        flush();
    }));

    it('should select game without errors if game is visible and defined. No snackbars should open', fakeAsync(() => {
        component.validateGame(fakeGame);
        spyOn(gameService, 'getGameById').and.returnValue(of(fakeGame));
        component.loadSelectedGame(fakeGame);
        tick();
        expect(component.selectedGame).toEqual(fakeGame);
        expect(component.gameIsValid).toBeTruthy();
        expect(notificationSpy.displayErrorMessageAction).not.toHaveBeenCalled();
        flush();
    }));

    it('createMatch() should create a playing match', () => {
        const reloadSpy = spyOn(component, 'reloadSelectedGame');
        component.createMatch(MatchContext.HostView);
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('createMatch() should revalidate random game if it is selected', () => {
        component.isRandomGame = true;
        const reloadSpy = spyOn(component, 'revalidateRandomGame');
        component.createMatch(MatchContext.RandomMode);
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('should handle revalidate random game', () => {
        component.handleRevalidateRandomGame(mockData);

        expect(component.isRandomGame).toBeTrue();
        expect(component.gameIsValid).toBeTrue();
        expect(matchServiceSpy.currentGame).toEqual(RANDOM_MODE_GAME);
        expect(matchServiceSpy.createMatch).toHaveBeenCalled();
    });

    it('handleRevalidateRandomGame() should display error message if not enough random questions', () => {
        const notEnoughData: Question[] = [];
        const errorMessage = "Il n'y a pas assez de questions pour un jeu aléatoire 😿";
        component.handleRevalidateRandomGame(notEnoughData);
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalledWith(errorMessage);
    });

    it('should revalidate random game', () => {
        const handleSpy = spyOn(component, 'handleRevalidateRandomGame');
        component.revalidateRandomGame();
        questionsSubject.next(mockData);
        expect(questionServiceSpy.getAllQuestions).toHaveBeenCalled();
        expect(handleSpy).toHaveBeenCalled();
    });

    it('should return true and set isRandomGame and gameIsValid to true if questions count is equal to minimum', () => {
        const questionsCount = MINIMUM_QUESTIONS;

        const result = component.hasEnoughRandomQuestions(questionsCount);

        expect(result).toBeTrue();
        expect(component.isRandomGame).toBeTrue();
        expect(component.gameIsValid).toBeTrue();
    });

    it('should return true and set isRandomGame and gameIsValid to true if questions count is greater than minimum', () => {
        const questionsCount = 10;

        const result = component.hasEnoughRandomQuestions(questionsCount);

        expect(result).toBeTrue();
        expect(component.isRandomGame).toBeTrue();
        expect(component.gameIsValid).toBeTrue();
    });
    it('should return false and display error message if questions count is less than minimum', () => {
        const questionsCount = 3;
        const errorMessage = "Il n'y a pas assez de questions pour un jeu aléatoire 😿";
        const result = component.hasEnoughRandomQuestions(questionsCount);
        expect(result).toBeFalsy();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalledWith(errorMessage);
        expect(component.isRandomGame).toBeFalsy();
        expect(component.gameIsValid).toBeFalsy();
    });
});
