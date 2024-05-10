import { HOST_CONFLICT, INVALID_CODE } from '@app/constants/match-login-errors';
import { Game } from '@app/model/database/game';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { MatchController } from './match.controller';

describe('MatchController', () => {
    let controller: MatchController;
    let matchBackupService: SinonStubbedInstance<MatchBackupService>;
    let matchRoomService: SinonStubbedInstance<MatchRoomService>;
    let playerRoomService: SinonStubbedInstance<PlayerRoomService>;

    beforeEach(async () => {
        matchBackupService = createStubInstance(MatchBackupService);
        matchRoomService = createStubInstance(MatchRoomService);
        playerRoomService = createStubInstance(PlayerRoomService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatchController],
            providers: [
                {
                    provide: MatchBackupService,
                    useValue: matchBackupService,
                },
                {
                    provide: MatchRoomService,
                    useValue: matchRoomService,
                },
                {
                    provide: PlayerRoomService,
                    useValue: playerRoomService,
                },
            ],
        }).compile();

        controller = module.get<MatchController>(MatchController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allVisibleGames() should return all visible games', async () => {
        const mockGames = [new Game(), new Game()];
        matchBackupService.getAllVisibleGames.resolves(mockGames);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (games) => {
            expect(games).toEqual(mockGames);
            return res;
        };
        await controller.allVisibleGames(res);
    });

    it('allGames() should return NOT_FOUND when service is unable to fetch the games', async () => {
        matchBackupService.getAllVisibleGames.rejects();
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.allVisibleGames(res);
    });

    it('gameByIdWithoutIsCorrect() should return the game with the corresponding ID', async () => {
        const mockGame = new Game();
        matchBackupService.getGameByIdWithoutIsCorrect.resolves(mockGame);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(mockGame);
            return res;
        };

        await controller.gameByIdWithoutIsCorrect('', res);
    });

    it('gameByIdWithoutIsCorrect() should return NOT_FOUND when service is unable to fetch the game', async () => {
        matchBackupService.getGameByIdWithoutIsCorrect.rejects();
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;
        await controller.gameByIdWithoutIsCorrect('', res);
    });

    it('validateMatchRoomCode() should return OK if the code is valid', () => {
        matchRoomService.getRoomCodeErrors.returns('');
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;
        controller.validateMatchRoomCode({ matchRoomCode: '' }, res);
    });

    it('validateMatchRoomCode() should return FORBIDDEN if the code is invalid', () => {
        matchRoomService.getRoomCodeErrors.returns(INVALID_CODE);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.FORBIDDEN);
            return res;
        };
        res.send = () => res;
        controller.validateMatchRoomCode({ matchRoomCode: '' }, res);
    });
    it('validateUsername() should return OK if the username is valid', () => {
        playerRoomService.getUsernameErrors.returns('');
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;
        controller.validateUsername({ matchRoomCode: '', username: '' }, res);
    });
    it('validateUsername() should return FORBIDDEN if the username is invalid', () => {
        playerRoomService.getUsernameErrors.returns(HOST_CONFLICT);
        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.FORBIDDEN);
            return res;
        };
        res.send = () => res;
        controller.validateUsername({ matchRoomCode: '', username: '' }, res);
    });
});
