import { ERROR_GAME_NOT_FOUND, ERROR_QUESTION_NOT_FOUND } from '@app/constants/request-errors';
import { MatchBackupService } from '@app/services/match-backup/match-backup.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';

interface SentChoicesText {
    selected: string[];
}

@Controller('match/backups')
export class BackupController {
    constructor(private readonly matchBackupService: MatchBackupService) {}
    @Get('/:gameId/questions/:questionId/choices')
    allChoices(@Param('gameId') gameId: string, @Param('questionId') questionId: string, @Res() response: Response) {
        const choices = this.matchBackupService.getChoices(gameId, questionId);
        return choices
            ? response.status(HttpStatus.OK).json(choices)
            : response.status(HttpStatus.NOT_FOUND).send({ message: ERROR_QUESTION_NOT_FOUND });
    }
    // permits versatile route to avoid duplication
    // eslint-disable-next-line max-params
    @Post('/:gameId/questions/:questionId/validate-choice')
    validatePlayerChoice(
        @Param('gameId') gameId: string,
        @Param('questionId') questionId: string,
        @Body() choicesDto: SentChoicesText,
        @Res() response: Response,
    ) {
        const question = this.matchBackupService.getBackupQuestion(gameId, questionId);
        if (question) {
            const isValidChoice = this.matchBackupService.validatePlayerChoice(question, choicesDto.selected);
            response.status(HttpStatus.OK).json(isValidChoice);
        } else {
            response.status(HttpStatus.NOT_FOUND).send({ message: ERROR_QUESTION_NOT_FOUND });
        }
    }

    @Get('/:gameId')
    getBackupGame(@Param('gameId') gameId: string, @Res() response: Response) {
        const backupGame = this.matchBackupService.getBackupGame(gameId);
        return backupGame
            ? response.status(HttpStatus.OK).json(backupGame)
            : response.status(HttpStatus.NOT_FOUND).send({ message: ERROR_GAME_NOT_FOUND });
    }

    @Post('/:gameId')
    async saveBackupGame(@Param('gameId') gameId: string, @Res() response: Response) {
        try {
            const game = await this.matchBackupService.saveBackupGame(gameId);
            response.status(HttpStatus.CREATED).json(game);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error.message });
        }
    }

    @Delete('/:gameId')
    async deleteBackupGame(@Param('gameId') gameId: string, @Res() response: Response) {
        const isDeleted = this.matchBackupService.deleteBackupGame(gameId);
        return isDeleted
            ? response.status(HttpStatus.NO_CONTENT).send()
            : response.status(HttpStatus.NOT_FOUND).send({ message: ERROR_GAME_NOT_FOUND });
    }
}
