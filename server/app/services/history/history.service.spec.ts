import { MOCK_MATCH_ROOM } from '@app/constants/match-mocks';
import { HistoryItem, HistoryItemDocument } from '@app/model/database/history-item';
import { Player } from '@app/model/schema/player.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let historyModel: Model<HistoryItemDocument>;

    beforeEach(async () => {
        historyModel = {
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
            deleteMany: jest.fn(),
        } as unknown as Model<HistoryItemDocument>;
        const module: TestingModule = await Test.createTestingModule({
            providers: [HistoryService, { provide: getModelToken(HistoryItem.name), useValue: historyModel }],
        }).compile();

        service = module.get<HistoryService>(HistoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getHistory() should return all history items in database', async () => {
        const mockHistory = [new HistoryItem(), new HistoryItem()];
        const spyFind = jest.spyOn(historyModel, 'find').mockResolvedValue(mockHistory);
        const returnedHistory = await service.getHistory();
        expect(spyFind).toHaveBeenCalledWith({});
        expect(returnedHistory).toEqual(mockHistory);
    });

    it('addHistoryItem() should add the history item to the database', async () => {
        const mockHistory = new HistoryItem();
        const spyCreate = jest.spyOn(historyModel, 'create').mockImplementation();
        service.addHistoryItem(mockHistory);
        expect(spyCreate).toHaveBeenCalledWith(mockHistory);
    });

    it('deleteHistory() should delete the entire history from the database', async () => {
        const spyDelete = jest.spyOn(historyModel, 'deleteMany').mockImplementation();
        service.deleteHistory();
        expect(spyDelete).toHaveBeenCalledWith({});
    });

    it('computeBestScore() should return the highest score', () => {
        const firstPlayer: Player = {
            score: 3,
        } as Player;
        const secondPlayer: Player = {
            score: 2,
        } as Player;
        const thirdPlayer: Player = {
            score: 1,
        } as Player;
        const players = [thirdPlayer, firstPlayer, secondPlayer];
        const result = service.computeBestScore(players);
        expect(result).toEqual(firstPlayer.score);
    });

    it('createHistoryItem() should create new history item and add it to the database', () => {
        const spyBestScore = jest.spyOn(service, 'computeBestScore').mockReturnValue(0);
        const spyAdd = jest.spyOn(service, 'addHistoryItem').mockReturnThis();
        const expectedParameter: HistoryItem = {
            title: MOCK_MATCH_ROOM.game.title,
            date: MOCK_MATCH_ROOM.startTime,
            playersCount: MOCK_MATCH_ROOM.players.length,
            bestScore: 0,
        };
        service.createHistoryItem(MOCK_MATCH_ROOM);
        expect(spyBestScore).toHaveBeenCalledWith(MOCK_MATCH_ROOM.players);
        expect(spyAdd).toHaveBeenCalledWith(expectedParameter);
    });
});
