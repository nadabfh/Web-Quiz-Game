import { HistoryItem } from '@app/model/database/history-item';
import { HistoryService } from '@app/services/history/history.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { HistoryController } from './history.controller';
describe('HistoryController', () => {
    let controller: HistoryController;
    let historySpy: SinonStubbedInstance<HistoryService>;

    beforeEach(async () => {
        historySpy = createStubInstance(HistoryService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [{ provide: HistoryService, useValue: historySpy }],
        }).compile();

        controller = module.get<HistoryController>(HistoryController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allHistoryItems() should return all the history items', async () => {
        const fakeHistory = [new HistoryItem(), new HistoryItem()];
        historySpy.getHistory.resolves(fakeHistory);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (history) => {
            expect(history).toEqual(history);
            return res;
        };
        await controller.allHistoryItems(res);
    });

    it('allHistoryItems() should return NOT_FOUND if the service fails', async () => {
        historySpy.getHistory.rejects('');
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        await controller.allHistoryItems(res);
    });

    it('deleteHistory() should succeed if the service is able to clear the history', async () => {
        historySpy.deleteHistory.resolves();
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;
        await controller.deleteHistory(res);
    });

    it('deleteHistory() should return BAD_REQUEST if the service is unable to clear the history', async () => {
        historySpy.deleteHistory.rejects('');
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.send = () => res;
        await controller.deleteHistory(res);
    });
});
