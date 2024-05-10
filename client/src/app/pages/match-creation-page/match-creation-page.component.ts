import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RandomModeStatus, SnackBarAction, SnackBarError } from '@app/constants/feedback-messages';
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
import { QuestionType } from '@common/constants/question-types';

@Component({
    selector: 'app-match-creation-page',
    templateUrl: './match-creation-page.component.html',
    styleUrls: ['./match-creation-page.component.scss'],
})
export class MatchCreationPageComponent implements OnInit {
    games: Game[] = [];
    selectedGame: Game;
    gameIsValid: boolean;
    matchContext = MatchContext;
    isRandomGame: boolean;
    isLoadingGames: boolean;
    isLoadingSelectedGame: boolean;

    // Services are required to decouple logic
    // eslint-disable-next-line max-params
    constructor(
        private readonly gameService: GameService,
        private readonly notificationService: NotificationService,
        private readonly matchService: MatchService,
        private readonly matchContextService: MatchContextService,
        private readonly questionService: QuestionService,
    ) {
        this.gameIsValid = false;
        this.isRandomGame = false;
        this.isLoadingGames = false;
        this.isLoadingSelectedGame = false;
    }

    ngOnInit(): void {
        this.reloadAllGames();
    }

    reloadAllGames(): void {
        this.isLoadingGames = true;
        this.matchService.getAllGames().subscribe((data: Game[]) => {
            this.games = data;
            this.isLoadingGames = false;
        });
    }

    handleLoadRandomGame(data: Question[]) {
        const questionsCount = [...data].length;
        if (this.hasEnoughRandomQuestions(questionsCount)) {
            this.selectedGame = RANDOM_MODE_GAME;
        }
        this.isLoadingSelectedGame = false;
    }

    loadRandomGame(): void {
        this.isLoadingSelectedGame = true;
        this.questionService.getAllQuestions().subscribe({
            next: (data: Question[]) => {
                data = data.filter((question) => question.type === QuestionType.MultipleChoice);
                this.handleLoadRandomGame(data);
            },
        });
    }

    hasEnoughRandomQuestions(questionsCount: number): boolean {
        if (questionsCount < MINIMUM_QUESTIONS) {
            this.notificationService.displayErrorMessage(RandomModeStatus.FAILURE);
            this.isRandomGame = this.gameIsValid = false;
            return false;
        }
        this.isRandomGame = this.gameIsValid = true;
        return true;
    }

    loadSelectedGame(selectedGame: Game): void {
        this.isLoadingSelectedGame = true;
        this.isRandomGame = false;
        this.gameService.getGameById(selectedGame.id).subscribe({
            next: (data: Game) => {
                this.selectedGame = data;
                this.validateGame(this.selectedGame);
                this.isLoadingSelectedGame = false;
            },
            error: () => {
                const snackBarRef = this.notificationService.displayErrorMessageAction(SnackBarError.DELETED, SnackBarAction.REFRESH);
                snackBarRef.onAction().subscribe(() => this.reloadAllGames());
            },
        });
    }

    reloadSelectedGame(): void {
        this.isRandomGame = false;
        this.gameService.getGameById(this.selectedGame.id).subscribe({
            next: (data: Game) => {
                this.selectedGame = data;
                this.revalidateGame();
            },
            error: () => {
                const snackBarRef = this.notificationService.displayErrorMessageAction(SnackBarError.DELETED, SnackBarAction.REFRESH);
                snackBarRef.onAction().subscribe(() => this.reloadAllGames());
            },
        });
    }

    validateGame(selectedGame: Game): void {
        if (selectedGame.isVisible) {
            this.gameIsValid = true;
        } else {
            const snackBarRef = this.notificationService.displayErrorMessageAction(SnackBarError.INVISIBLE, SnackBarAction.REFRESH);
            snackBarRef.onAction().subscribe(() => this.reloadAllGames());
        }
    }

    revalidateGame(): void {
        if (this.selectedGame.isVisible) {
            this.gameIsValid = true;
            this.matchService.currentGame = this.selectedGame;
            this.matchService.saveBackupGame(this.selectedGame.id).subscribe((response: HttpResponse<string>) => {
                if (response.body) {
                    const backupGame = JSON.parse(response.body);
                    this.matchService.currentGame = backupGame;
                    this.matchService.createMatch();
                }
            });
        } else {
            const snackBarRef = this.notificationService.displayErrorMessageAction(SnackBarError.INVISIBLE, SnackBarAction.REFRESH);
            snackBarRef.onAction().subscribe(() => this.reloadAllGames());
        }
    }

    createMatch(context: MatchContext): void {
        this.matchContextService.setContext(context);
        if (!this.isRandomGame) this.reloadSelectedGame();
        else {
            this.revalidateRandomGame();
        }
    }

    handleRevalidateRandomGame(data: Question[]) {
        const questionsCount = [...data].length;

        const hasEnoughRandomQuestions = this.hasEnoughRandomQuestions(questionsCount);

        if (hasEnoughRandomQuestions && this.isRandomGame && this.gameIsValid) {
            this.matchService.currentGame = RANDOM_MODE_GAME;
            this.matchService.createMatch();
        } else {
            this.notificationService.displayErrorMessage(RandomModeStatus.FAILURE);
        }
    }

    revalidateRandomGame() {
        this.questionService.getAllQuestions().subscribe({
            next: (data: Question[]) => {
                data = data.filter((question) => question.type === QuestionType.MultipleChoice);
                this.handleRevalidateRandomGame(data);
            },
        });
    }
}
