import { getMockQuestion } from '@app/constants/question-mocks';
import { Choice } from '@app/model/database/choice';
import { Game } from '@app/model/database/game';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BackupController } from './backup.controller';

describe('MatchController', () => {
    let controller: BackupController;
    let matchBackupService: SinonStubbedInstance<MatchBackupService>;

    beforeEach(async () => {
        matchBackupService = createStubInstance(MatchBackupService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BackupController],
            providers: [
                {
                    provide: MatchBackupService,
                    useValue: matchBackupService,
                },
            ],
        }).compile();

        controller = module.get<BackupController>(BackupController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allChoices() should return all question choices', () => {
        const mockChoices = [new Choice(), new Choice()];
        const spyGetChoices = jest.spyOn(matchBackupService, 'getChoices').mockReturnValue(mockChoices);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (choices) => {
            expect(choices).toEqual(mockChoices);
            return res;
        };
        controller.allChoices('', '', res);
        expect(spyGetChoices).toHaveBeenCalled();
    });

    it('allChoices() should return NOT_FOUND if service cannot get choices', () => {
        const spyGetChoices = jest.spyOn(matchBackupService, 'getChoices').mockReturnValue(undefined);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        controller.allChoices('', '', res);
        expect(spyGetChoices).toHaveBeenCalled();
    });

    it('validatePlayerChoice() should return OK with true value in body if validatePlayerChoice returns true', () => {
        const spyGet = jest.spyOn(matchBackupService, 'getBackupQuestion').mockReturnValue(getMockQuestion());
        const spyValidate = jest.spyOn(matchBackupService, 'validatePlayerChoice').mockReturnValue(true);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (isValid) => {
            expect(isValid).toEqual(true);
            return res;
        };
        controller.validatePlayerChoice('', '', { selected: [''] }, res);
        expect(spyGet).toHaveBeenCalled();
        expect(spyValidate).toHaveBeenCalled();
    });

    it('validatePlayerChoice() should return OK with false value in body if validatePlayerChoice returns false', () => {
        const spyGet = jest.spyOn(matchBackupService, 'getBackupQuestion').mockReturnValue(getMockQuestion());
        const spyValidate = jest.spyOn(matchBackupService, 'validatePlayerChoice').mockReturnValue(false);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (isValid) => {
            expect(isValid).toEqual(false);
            return res;
        };
        controller.validatePlayerChoice('', '', { selected: [''] }, res);
        expect(spyGet).toHaveBeenCalled();
        expect(spyValidate).toHaveBeenCalled();
    });

    it('validatePlayerChoice() should return NOT FOUND if validatePlayerChoice does not resolve', () => {
        const spyGet = jest.spyOn(matchBackupService, 'getBackupQuestion').mockReturnValue(undefined);
        const spyValidate = jest.spyOn(matchBackupService, 'validatePlayerChoice');
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        controller.validatePlayerChoice('', '', { selected: [''] }, res);
        expect(spyGet).toHaveBeenCalled();
        expect(spyValidate).not.toHaveBeenCalled();
    });

    it('getBackupGame() should return the backup game with the corresponding ID', () => {
        const mockGame = new Game();
        const spyGet = jest.spyOn(matchBackupService, 'getBackupGame').mockReturnValue(mockGame);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(mockGame);
            return res;
        };
        controller.getBackupGame('', res);
        expect(spyGet).toHaveBeenCalled();
    });
    it('getBackupGame() should return NOT_FOUND if the backup game cannot be found', () => {
        const spyGet = jest.spyOn(matchBackupService, 'getBackupGame').mockReturnValue(undefined);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        controller.getBackupGame('', res);
        expect(spyGet).toHaveBeenCalled();
    });
    it('saveBackupGame() should save ("create") backup game locally in the server and return a copy of the game', async () => {
        const mockGame = new Game();
        matchBackupService.saveBackupGame.resolves(mockGame);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(mockGame);
            return res;
        };
        await controller.saveBackupGame('', res);
    });
    it('saveBackupGame() should return NOT FOUND if backup could not be saved ("created")', async () => {
        matchBackupService.saveBackupGame.rejects();
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        await controller.saveBackupGame('', res);
    });
    it('deleteBackupGame() should delete the backup and return NO CONTENT', () => {
        const spyDelete = jest.spyOn(matchBackupService, 'deleteBackupGame').mockReturnValue(true);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;
        controller.deleteBackupGame('', res);
        expect(spyDelete).toHaveBeenCalled();
    });
    it('deleteBackupGame() should return NOT FOUND if backup cannot be deleted', () => {
        const spyDelete = jest.spyOn(matchBackupService, 'deleteBackupGame').mockReturnValue(false);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        controller.deleteBackupGame('', res);
        expect(spyDelete).toHaveBeenCalled();
    });
});
