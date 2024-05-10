import { getMockGame } from '@app/constants/game-mocks';
import {
    ERROR_DEFAULT,
    ERROR_GAME_NOT_FOUND,
    ERROR_GAME_SAME_TITLE,
    ERROR_INVALID_GAME,
    ERROR_QUESTION_NOT_FOUND,
    ERROR_WRONG_FORMAT,
} from '@app/constants/request-errors';
import { Game, GameDocument } from '@app/model/database/game';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;
    let gameValidationService: SinonStubbedInstance<GameValidationService>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;

    beforeEach(async () => {
        gameCreationService = createStubInstance(GameCreationService);
        gameValidationService = createStubInstance(GameValidationService);
        gameModel = {
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
            deleteMany: jest.fn(),
            findOneAndUpdate: jest.fn(),
        } as unknown as Model<GameDocument>;
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                Logger,
                {
                    provide: getModelToken(Game.name),
                    useValue: gameModel,
                },
                {
                    provide: GameValidationService,
                    useValue: gameValidationService,
                },
                {
                    provide: GameCreationService,
                    useValue: gameCreationService,
                },
            ],
        }).compile();
        service = module.get<GameService>(GameService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getAllGames() should return all games from database', async () => {
        const mockGames = [getMockGame(), getMockGame()];
        const spyFind = jest.spyOn(gameModel, 'find').mockResolvedValue(mockGames);
        const returnedGames = await service.getAllGames();
        expect(spyFind).toHaveBeenCalledWith({});
        expect(returnedGames).toEqual(mockGames);
    });

    it('getAllVisibleGames() should return all visible games from database', async () => {
        const mockGames = [getMockGame(), getMockGame()];
        const spyFind = jest.spyOn(gameModel, 'find').mockResolvedValue(mockGames);
        const returnedGames = await service.getAllVisibleGames();
        expect(spyFind).toHaveBeenCalledWith({ isVisible: true });
        expect(returnedGames).toEqual(mockGames);
    });

    it('getGameById should return the game with the corresponding ID', async () => {
        const mockGame = getMockGame();
        const spyFindOne = jest.spyOn(gameModel, 'findOne').mockResolvedValue(mockGame);
        const returnedGame = await service.getGameById(mockGame.id);
        expect(returnedGame).toEqual(mockGame);
        expect(spyFindOne).toHaveBeenCalledWith({ id: mockGame.id });
    });

    it('getGameById should fail if there is no game with the corresponding ID', async () => {
        const spyFindOne = jest.spyOn(gameModel, 'findOne').mockResolvedValue(null);
        await service.getGameById('').catch((error) => {
            expect(error).toBe(`${ERROR_GAME_NOT_FOUND}`);
        });
        expect(spyFindOne).toHaveBeenCalled();
    });

    it('getGameByTitle should return the game with the corresponding title', async () => {
        const mockGame = getMockGame();
        const spyFindOne = jest.spyOn(gameModel, 'findOne').mockResolvedValue(mockGame);
        const returnedGame = await service.getGameByTitle(mockGame.title);
        expect(returnedGame).toEqual(mockGame);
        expect(spyFindOne).toHaveBeenCalledWith({ title: mockGame.title });
    });

    it('getChoices() should return the choices of the question in the game with the corresponding IDs', async () => {
        const mockGame = getMockGame();
        const mockQuestion = mockGame.questions[0];
        const mockChoices = mockQuestion.choices;
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockGame);
        const returnedChoices = await service.getChoices(mockGame.id, mockQuestion.id);
        expect(returnedChoices).toEqual(mockChoices);
        expect(spyGet).toHaveBeenCalledWith(mockGame.id);
    });
    it('getChoices() should reject if question cannot be found in the game', async () => {
        const mockGame = getMockGame();
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockGame);
        await service.getChoices(mockGame.id, '').catch((error) => {
            expect(error).toBe(`${ERROR_QUESTION_NOT_FOUND}`);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.id);
    });

    it('addGame() should add the game to the database if it is valid and has new title', async () => {
        const mockGame = getMockGame();
        const spyCompleteIsCorrect = jest.spyOn(gameCreationService, 'completeIsCorrectField').mockReturnValue(mockGame);
        const spyGet = jest.spyOn(service, 'getGameByTitle').mockResolvedValue(null);
        const spyCreate = jest.spyOn(gameModel, 'create').mockImplementation();
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue([]);
        const spyDateVisibility = jest.spyOn(gameCreationService, 'updateDateAndVisibility').mockReturnValue(mockGame);
        const spyGenerateId = jest.spyOn(gameCreationService, 'generateId').mockReturnValue(mockGame);
        const createdGame = await service.addGame({ ...mockGame });
        expect(createdGame).toEqual(mockGame);
        expect(spyGet).toHaveBeenCalledWith(mockGame.title);
        expect(spyGenerateId).toHaveBeenCalledWith(mockGame);
        expect(spyDateVisibility).toHaveBeenCalledWith(mockGame);
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
        expect(spyCreate).toHaveBeenCalledWith(mockGame);
        expect(spyCompleteIsCorrect).toHaveBeenCalled();
    });
    it('addGame() should not add the game to the database if another game with the same title already exists', async () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameByTitle').mockResolvedValue(new Game());
        await service.addGame({ ...mockGame }).catch((error) => {
            expect(error).toBe(ERROR_GAME_SAME_TITLE);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.title);
    });
    it('addGame should not add the game to the database if it is invalid', async () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameByTitle').mockResolvedValue(null);
        const mockErrorMessages = ['mock'];
        const spyCompleteIsCorrect = jest.spyOn(gameCreationService, 'completeIsCorrectField').mockReturnValue(mockGame);
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue(mockErrorMessages);
        const spyDateVisibility = jest.spyOn(gameCreationService, 'updateDateAndVisibility').mockReturnValue(mockGame);
        const spyGenerateId = jest.spyOn(gameCreationService, 'generateId').mockReturnValue(mockGame);
        await service.addGame({ ...mockGame }).catch((error) => {
            expect(error).toBe(`${ERROR_INVALID_GAME}\nmock`);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.title);
        expect(spyGenerateId).toHaveBeenCalledWith(mockGame);
        expect(spyDateVisibility).toHaveBeenCalledWith(mockGame);
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
        expect(spyCompleteIsCorrect).toHaveBeenCalled();
    });
    it('addGame() should not add the game to the database if mongo query fails', async () => {
        const mockGame = getMockGame();
        const spyCompleteIsCorrect = jest.spyOn(gameCreationService, 'completeIsCorrectField').mockReturnValue(mockGame);
        const spyGet = jest.spyOn(service, 'getGameByTitle').mockResolvedValue(null);
        const spyCreate = jest.spyOn(gameModel, 'create').mockImplementation(async () => Promise.reject(''));
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue([]);
        const spyDateVisibility = jest.spyOn(gameCreationService, 'updateDateAndVisibility').mockReturnValue(mockGame);
        const spyGenerateId = jest.spyOn(gameCreationService, 'generateId').mockReturnValue(mockGame);
        await service.addGame({ ...mockGame }).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} ${ERROR_WRONG_FORMAT}`);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.title);
        expect(spyGenerateId).toHaveBeenCalledWith(mockGame);
        expect(spyDateVisibility).toHaveBeenCalledWith(mockGame);
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
        expect(spyCreate).toHaveBeenCalledWith(mockGame);
        expect(spyCompleteIsCorrect).toHaveBeenCalled();
    });

    it('toggleGameVisibility() should make a visible game invisible', async () => {
        const mockVisibleGame = getMockGame();
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockVisibleGame);
        const spyUpdate = jest.spyOn(gameModel, 'updateOne').mockImplementation();
        const updatedGame = await service.toggleGameVisibility(mockVisibleGame.id);
        expect(spyGet).toHaveBeenCalledWith(mockVisibleGame.id);
        expect(spyUpdate).toHaveBeenCalled();
        expect(updatedGame.isVisible).toBeFalsy();
        expect(updatedGame.id).toEqual(mockVisibleGame.id);
    });

    it('toggleGameVisibility() should make an invisible game visible', async () => {
        const mockVisibleGame = getMockGame();
        mockVisibleGame.isVisible = false;
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockVisibleGame);
        const spyUpdate = jest.spyOn(gameModel, 'updateOne').mockImplementation();
        const updatedGame = await service.toggleGameVisibility(mockVisibleGame.id);
        expect(spyGet).toHaveBeenCalledWith(mockVisibleGame.id);
        expect(spyUpdate).toHaveBeenCalled();
        expect(updatedGame.isVisible).toBeTruthy();
        expect(updatedGame.id).toEqual(mockVisibleGame.id);
    });

    it('toggleGameVisibility() should fail if game cannot be found', async () => {
        const mockVisibleGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameById').mockRejectedValue('');
        await service.toggleGameVisibility(mockVisibleGame.id).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyGet).toHaveBeenCalledWith(mockVisibleGame.id);
    });

    it('upsertGame() should upsert the game if it is valid', async () => {
        const mockGame = getMockGame();
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue([]);
        const spyDateVisibility = jest.spyOn(gameCreationService, 'updateDateAndVisibility').mockReturnValue(mockGame);
        const spyModel = jest.spyOn(gameModel, 'findOneAndUpdate').mockImplementation();
        const upsertedGame = await service.upsertGame(mockGame);
        expect(upsertedGame).toEqual(mockGame);
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
        expect(spyDateVisibility).toHaveBeenCalledWith(mockGame);
        expect(spyModel).toHaveBeenCalledWith({ id: mockGame.id }, mockGame, { new: true, upsert: true });
    });

    it('upsertGame() should fail if the game is not valid', async () => {
        const mockGame = getMockGame();
        const mockErrorMessages = ['mock'];
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue(mockErrorMessages);
        await service.upsertGame(mockGame).catch((error) => {
            expect(error).toBe(`${ERROR_INVALID_GAME}\nmock`);
        });
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
    });

    it('upsertGame() should fail if mongo query fails', async () => {
        const mockGame = getMockGame();
        const spyValidate = jest.spyOn(gameValidationService, 'findGameErrors').mockReturnValue([]);
        const spyDateVisibility = jest.spyOn(gameCreationService, 'updateDateAndVisibility').mockReturnValue(mockGame);
        const spyModel = jest.spyOn(gameModel, 'findOneAndUpdate').mockRejectedValue('');
        await service.upsertGame(mockGame).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyValidate).toHaveBeenCalledWith(mockGame);
        expect(spyDateVisibility).toHaveBeenCalledWith(mockGame);
        expect(spyModel).toHaveBeenCalledWith({ id: mockGame.id }, mockGame, { new: true, upsert: true });
    });

    it('deleteGame() should delete the game with the corresponding ID', async () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockGame);
        const spyDelete = jest.spyOn(gameModel, 'deleteOne').mockImplementation();
        await service.deleteGame(mockGame.id);
        expect(spyGet).toHaveBeenCalledWith(mockGame.id);
        expect(spyDelete).toHaveBeenCalledWith({ id: mockGame.id });
    });
    it('deleteGame() should fail if the game with the corresponding ID cannot be found', async () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameById').mockRejectedValue('');
        await service.deleteGame(mockGame.id).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.id);
    });
    it('deleteGame() should fail if mongo query fails', async () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(service, 'getGameById').mockResolvedValue(mockGame);
        const spyDelete = jest.spyOn(gameModel, 'deleteOne').mockRejectedValue('');
        await service.deleteGame(mockGame.id).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyGet).toHaveBeenCalledWith(mockGame.id);
        expect(spyDelete).toHaveBeenCalledWith({ id: mockGame.id });
    });
});
