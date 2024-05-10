import { HistoryService } from '@app/services/history/history.service';
import { Controller, Delete, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Get('/')
    async allHistoryItems(@Res() response: Response) {
        try {
            const allHistoryItems = await this.historyService.getHistory();
            response.status(HttpStatus.OK).json(allHistoryItems);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Delete('/')
    async deleteHistory(@Res() response: Response) {
        try {
            await this.historyService.deleteHistory();
            response.status(HttpStatus.NO_CONTENT).send();
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send({ message: error });
        }
    }
}
