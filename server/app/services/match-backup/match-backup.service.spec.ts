import { FIRST_CORRECT_CHOICE, INCORRECT_CHOICE, SECOND_CORRECT_CHOICE } from '@app/constants/choice-mocks';
import { GAME_WITHOUT_IS_CORRECT_FIELD, GAME_WITH_IS_CORRECT_FIELD } from '@app/constants/game-mocks';
import { getMockQuestionWithChoices } from '@app/constants/question-mocks';
import { ERROR_GAME_NOT_FOUND } from '@app/constants/request-errors';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { GameService } from '@app/services/game/game.service';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { RandomGameService } from '@app/services/random-game/random-game/random-game.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import * as uuid from 'uuid';
jest.mock('uuid');

describe('MatchBackupService', () => {
    let service: MatchBackupService;
    let gameService: SinonStubbedInstance<GameService>;
    let randomGameService: SinonStubbedInstance<RandomGameService>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        randomGameService = createStubInstance(RandomGameService);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchBackupService,
                { provide: GameService, useValue: gameService },
                { provide: RandomGameService, useValue: randomGameService },
            ],
        }).compile();

        service = module.get<MatchBackupService>(MatchBackupService);
    });

    beforeEach(() => {
        service.backupGames = [];
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getAllVisibleGames() should return all visible games and remove isCorrect Choice property on each one', async () => {
        const mockVisibleGames = [new Game(), new Game()];
        const spyRemoveIsCorrectField = jest.spyOn(service, 'removeIsCorrectField');
        gameService.getAllVisibleGames.resolves(mockVisibleGames);
        const games = await service.getAllVisibleGames();
        expect(games.length).toEqual(mockVisibleGames.length);
        mockVisibleGames.forEach((game) => {
            expect(spyRemoveIsCorrectField).toHaveBeenCalledWith(game);
        });
    });

    it('getGameByIdWithoutIsCorrect() should return the game with the corresponding ID, but without the isCorrect Choice property', async () => {
        const mockGame = new Game();
        const spyRemoveIsCorrectField = jest.spyOn(service, 'removeIsCorrectField');
        gameService.getGameById.resolves(mockGame);
        const game = await service.getGameByIdWithoutIsCorrect('');
        expect(spyRemoveIsCorrectField).toHaveBeenCalledWith(mockGame);
        expect(game.id).toEqual(mockGame.id);
    });

    it('getBackupGame() should return the game with the corresponding ID among the backups', () => {
        const firstMockGame = new Game();
        firstMockGame.id = '0';
        const secondMockGame = new Game();
        secondMockGame.id = '1';
        service.backupGames = [firstMockGame, secondMockGame];
        const spyFindUsingDB = jest.spyOn(gameService, 'getGameById');
        const game = service.getBackupGame(firstMockGame.id);
        expect(game).toEqual(firstMockGame);
        expect(game).not.toEqual(secondMockGame);
        expect(spyFindUsingDB).not.toHaveBeenCalled();
    });

    it('getBackupRandomGame() should return a generated random game', async () => {
        const bankSpy = jest.spyOn(randomGameService, 'fetchAllQuestions').mockReturnThis();
        const spy = jest.spyOn(randomGameService, 'generateRandomGame').mockReturnThis();
        await service.getBackupRandomGame();
        expect(bankSpy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('getBackupQuestion() should return the question with the corresponding ID among the backups', () => {
        const mockGame = new Game();
        const firstMockQuestion = new Question();
        firstMockQuestion.id = '0';
        const secondMockQuestion = new Question();
        secondMockQuestion.id = '1';
        mockGame.questions = [firstMockQuestion, secondMockQuestion];
        const spyGetBackupGame = jest.spyOn(service, 'getBackupGame').mockReturnValue(mockGame);
        const question = service.getBackupQuestion('', '0');
        expect(question).toEqual(firstMockQuestion);
        expect(spyGetBackupGame).toHaveBeenCalled();
    });

    it('getChoices() should return the question choices from the backup data', () => {
        const mockQuestion = new Question();
        mockQuestion.choices = [new Choice(), new Choice()];
        const spyGetBackupQuestion = jest.spyOn(service, 'getBackupQuestion').mockReturnValue(mockQuestion);
        const choices = service.getChoices('', '');
        expect(choices).toEqual(mockQuestion.choices);
        expect(spyGetBackupQuestion).toHaveBeenCalled();
    });

    it('validatePlayerChoice() should return true only if all choices from player are correct', () => {
        const mockQuestion = getMockQuestionWithChoices();
        const correctPlayerTry = service.validatePlayerChoice(mockQuestion, [FIRST_CORRECT_CHOICE.text, SECOND_CORRECT_CHOICE.text]);
        expect(correctPlayerTry).toBe(true);
    });

    it('validatePlayerChoice() should return false if at least one choice from player is incorrect', () => {
        const mockQuestion = getMockQuestionWithChoices();
        const correctPlayerTry = service.validatePlayerChoice(mockQuestion, [
            FIRST_CORRECT_CHOICE.text,
            SECOND_CORRECT_CHOICE.text,
            INCORRECT_CHOICE.text,
        ]);
        expect(correctPlayerTry).toBe(false);
    });

    it('validatePlayerChoice() should return false if the player does not submit ALL correct choices.', () => {
        const mockQuestion = getMockQuestionWithChoices();
        const correctPlayerTry = service.validatePlayerChoice(mockQuestion, [FIRST_CORRECT_CHOICE.text]);
        expect(correctPlayerTry).toBe(false);
    });

    it('saveBackupGame() should get the game from database, add it to the backup data, and return the game without isCorrect property', async () => {
        const mockGame = new Game();
        mockGame.id = '0';
        const spyGetGameById = jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
        const spyRemoveIsCorrectField = jest.spyOn(service, 'removeIsCorrectField').mockReturnValue(mockGame);
        const uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mockedValue');
        service.backupGames = [new Game()];
        await service.saveBackupGame('0');
        expect(uuidSpy).toHaveBeenCalled();
        expect(spyGetGameById).toHaveBeenCalled();
        expect(spyRemoveIsCorrectField).toHaveBeenCalled();
        expect(service.backupGames.length).toBe(2);
    });

    it('saveBackupGame() should reject if gameService fails to fetch game', async () => {
        const spyGetGameById = jest.spyOn(gameService, 'getGameById').mockRejectedValue('');
        await service.saveBackupGame('').catch((error) => {
            expect(error).toBe(`${ERROR_GAME_NOT_FOUND}`);
        });
        expect(spyGetGameById).toHaveBeenCalled();
    });

    it('deleteBackupGame() should delete one game with the corresponding ID from the backup data', () => {
        const mockGame = new Game();
        mockGame.id = '0';
        service.backupGames = [mockGame, mockGame];
        const isDeleted = service.deleteBackupGame('0');
        expect(isDeleted).toBeTruthy();
        expect(service.backupGames.length).toBe(1);
    });

    it('deleteBackupGame() should reject if the game cannot be found', () => {
        service.backupGames = [new Game()];
        const isDeleted = service.deleteBackupGame('');
        expect(isDeleted).toBeFalsy();
        expect(service.backupGames.length).toBe(1);
    });

    it('removeIsCorrectField should return a game without the field isCorrect in question choices', () => {
        const game = service.removeIsCorrectField(GAME_WITH_IS_CORRECT_FIELD);
        expect(JSON.stringify(game)).toBe(JSON.stringify(GAME_WITHOUT_IS_CORRECT_FIELD));

        const gameNoIsCorrect = service.removeIsCorrectField(GAME_WITHOUT_IS_CORRECT_FIELD);
        expect(JSON.stringify(gameNoIsCorrect)).toBe(JSON.stringify(GAME_WITHOUT_IS_CORRECT_FIELD));
    });
});
