import { ERROR_GAME_NOT_FOUND } from '@app/constants/request-errors';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { GameService } from '@app/services/game/game.service';
import { RandomGameService } from '@app/services/random-game/random-game/random-game.service';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchBackupService {
    backupGames: Game[];
    constructor(
        private readonly gameService: GameService,
        private readonly randomGameService: RandomGameService,
    ) {
        this.backupGames = [];
    }

    async getAllVisibleGames(): Promise<Game[]> {
        const visibleGames = await this.gameService.getAllVisibleGames();
        const gamesWithoutIsCorrectField: Game[] = [];
        visibleGames.forEach((game) => {
            gamesWithoutIsCorrectField.push(this.removeIsCorrectField(game));
        });
        return gamesWithoutIsCorrectField;
    }

    async getGameByIdWithoutIsCorrect(gameId: string): Promise<Game> {
        let game = await this.gameService.getGameById(gameId);
        game = this.removeIsCorrectField(game);
        return game;
    }

    getBackupGame(gameId: string): Game {
        return this.backupGames.find((currentGame) => {
            return currentGame.id === gameId;
        });
    }

    async getBackupRandomGame(): Promise<Game> {
        await this.randomGameService.fetchAllQuestions();
        return this.randomGameService.generateRandomGame();
    }

    getBackupQuestion(gameId: string, questionId: string): Question {
        const game = this.getBackupGame(gameId);
        return game.questions.find((currentQuestion) => {
            return currentQuestion.id === questionId;
        });
    }

    getChoices(gameId: string, questionId: string): Choice[] {
        return this.getBackupQuestion(gameId, questionId).choices;
    }

    validatePlayerChoice(question: Question, selectedChoices: string[]): boolean {
        const expectedChoices: string[] = [];
        question.choices.forEach((choice) => {
            if (choice.isCorrect) {
                expectedChoices.push(choice.text);
            }
        });
        return expectedChoices.sort().toString() === selectedChoices.sort().toString();
    }

    async saveBackupGame(gameId: string): Promise<Game> {
        try {
            let backupGame = await this.gameService.getGameById(gameId);
            backupGame.id = uuidv4();
            this.backupGames.push(backupGame);
            backupGame = this.removeIsCorrectField(backupGame);
            return backupGame;
        } catch (error) {
            return Promise.reject(`${ERROR_GAME_NOT_FOUND}`);
        }
    }

    deleteBackupGame(gameToDeleteId: string): boolean {
        const deleteIndex = this.backupGames.findIndex((game: Game) => game.id === gameToDeleteId);
        const notFoundIndex = -1;
        if (deleteIndex !== notFoundIndex) {
            this.backupGames.splice(deleteIndex, 1);
            return true;
        }
        return false;
    }

    removeIsCorrectField(game: Game): Game {
        const stringifiedGame = JSON.stringify(game, (key, value) => {
            if (key !== 'isCorrect' && key !== '_id' && key !== '__v') {
                return value;
            }
        });
        return JSON.parse(stringifiedGame);
    }
}
