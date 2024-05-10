import {
    ERROR_DEFAULT,
    ERROR_GAME_NOT_FOUND,
    ERROR_GAME_SAME_TITLE,
    ERROR_INVALID_GAME,
    ERROR_QUESTION_NOT_FOUND,
    ERROR_WRONG_FORMAT,
} from '@app/constants/request-errors';
import { Choice } from '@app/model/database/choice';
import { Game, GameDocument } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { UpdateGameDto } from '@app/model/dto/game/update-game.dto';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private readonly validation: GameValidationService,
        private readonly creationService: GameCreationService,
    ) {}

    async getAllGames(): Promise<Game[]> {
        return await this.gameModel.find({});
    }

    async getAllVisibleGames(): Promise<Game[]> {
        return await this.gameModel.find({ isVisible: true });
    }

    async getGameById(gameId: string): Promise<Game> {
        const game = await this.gameModel.findOne({ id: gameId });
        if (!game) {
            return Promise.reject(ERROR_GAME_NOT_FOUND);
        } else {
            return game;
        }
    }

    async getGameByTitle(gameTitle: string): Promise<Game> {
        return await this.gameModel.findOne({ title: gameTitle });
    }

    async getChoices(gameId: string, questionId: string): Promise<Choice[]> {
        const game = await this.getGameById(gameId);
        const question = game.questions.find((currentQuestion) => {
            return currentQuestion.id === questionId;
        });
        return question ? question.choices : Promise.reject(ERROR_QUESTION_NOT_FOUND);
    }

    async addGame(newGame: CreateGameDto): Promise<Game> {
        if (await this.getGameByTitle(newGame.title)) {
            return Promise.reject(ERROR_GAME_SAME_TITLE);
        }
        newGame = this.creationService.updateDateAndVisibility(newGame);
        newGame = this.creationService.generateId(newGame);
        newGame = this.creationService.completeIsCorrectField(newGame);
        try {
            const errorMessages = this.validation.findGameErrors(newGame);
            if (!errorMessages.length) {
                await this.gameModel.create(newGame);
                return newGame;
            } else {
                return Promise.reject(`${ERROR_INVALID_GAME}\n${errorMessages.join('\n')}`);
            }
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${ERROR_WRONG_FORMAT}`);
        }
    }

    async toggleGameVisibility(gameId: string): Promise<Game> {
        const filterQuery = { id: gameId };
        try {
            const gameToToggleVisibility = await this.getGameById(gameId);
            gameToToggleVisibility.isVisible = !gameToToggleVisibility.isVisible;
            await this.gameModel.updateOne(filterQuery, gameToToggleVisibility);
            return gameToToggleVisibility;
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }

    async upsertGame(game: UpdateGameDto): Promise<Game> {
        const filterQuery = { id: game.id };
        try {
            const errorMessages = this.validation.findGameErrors(game);
            if (errorMessages.length) {
                return Promise.reject(`${ERROR_INVALID_GAME}\n${errorMessages.join('\n')}`);
            }
            game = this.creationService.updateDateAndVisibility(game);

            await this.gameModel.findOneAndUpdate(filterQuery, game, {
                new: true,
                upsert: true,
            });
            return game;
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }

    async deleteGame(gameId: string): Promise<void> {
        try {
            await this.getGameById(gameId);
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
        try {
            await this.gameModel.deleteOne({ id: gameId });
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }
}
