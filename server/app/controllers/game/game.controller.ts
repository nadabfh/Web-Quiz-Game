import { ERROR_GAME_SAME_TITLE } from '@app/constants/request-errors';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { UpdateGameDto } from '@app/model/dto/game/update-game.dto';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('games')
@Controller('admin/games')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Get('/')
    async getAllGames(@Res() response: Response) {
        try {
            const allGames = await this.gameService.getAllGames();
            response.status(HttpStatus.OK).json(allGames);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Get('/:id')
    async getGameById(@Param('id') id: string, @Res() response: Response) {
        try {
            const game = await this.gameService.getGameById(id);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Post('/')
    async addGame(@Body() createGameDto: CreateGameDto, @Res() response: Response) {
        try {
            const newGame = await this.gameService.addGame(createGameDto);
            response.status(HttpStatus.CREATED).send(JSON.stringify(newGame));
        } catch (error) {
            if (error === ERROR_GAME_SAME_TITLE) {
                response.status(HttpStatus.CONFLICT).send({ message: error });
            } else {
                response.status(HttpStatus.BAD_REQUEST).send({ message: error });
            }
        }
    }

    @Patch('/:id')
    async toggleGameVisibility(@Param('id') id: string, @Res() response: Response) {
        try {
            await this.gameService.toggleGameVisibility(id);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Put('/:id')
    async upsertGame(@Body() updateGameDto: UpdateGameDto, @Res() response: Response) {
        try {
            await this.gameService.upsertGame(updateGameDto);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send({ message: error });
        }
    }

    @Delete('/:id')
    async deleteGame(@Param('id') id: string, @Res() response: Response) {
        try {
            await this.gameService.deleteGame(id);
            response.status(HttpStatus.NO_CONTENT).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }
}
