import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { PlayerRoomService } from '@app/services/player-room/player-room.service';
import { MatchRoomCodeInfo } from '@common/interfaces/match-room-code-info';
import { MatchUsernameInfo } from '@common/interfaces/match-username-info';
import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('match')
export class MatchController {
    constructor(
        private readonly matchBackupService: MatchBackupService,
        private readonly matchRoomService: MatchRoomService,
        private readonly playerRoomService: PlayerRoomService,
    ) {}

    @Get('/games')
    async allVisibleGames(@Res() response: Response) {
        try {
            const allVisibleGames = await this.matchBackupService.getAllVisibleGames();
            response.status(HttpStatus.OK).json(allVisibleGames);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error.message });
        }
    }

    @Get('/games/:gameId')
    async gameByIdWithoutIsCorrect(@Param('gameId') gameId: string, @Res() response: Response) {
        try {
            const game = await this.matchBackupService.getGameByIdWithoutIsCorrect(gameId);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error.message });
        }
    }

    @Post('validate-code')
    validateMatchRoomCode(@Body() data: MatchRoomCodeInfo, @Res() response: Response) {
        const errors = this.matchRoomService.getRoomCodeErrors(data.matchRoomCode);
        if (!errors) {
            response.status(HttpStatus.OK).send();
        } else {
            response.status(HttpStatus.FORBIDDEN).send({ message: errors });
        }
    }

    @Post('validate-username')
    validateUsername(@Body() data: MatchUsernameInfo, @Res() response: Response) {
        const errors = this.playerRoomService.getUsernameErrors(data.matchRoomCode, data.username);
        if (!errors) {
            response.status(HttpStatus.OK).send();
        } else {
            response.status(HttpStatus.FORBIDDEN).send({ message: errors });
        }
    }
}
