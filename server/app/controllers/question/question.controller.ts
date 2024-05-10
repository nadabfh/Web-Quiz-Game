import { ERROR_QUESTION_NOT_FOUND } from '@app/constants/request-errors';
import { CreateQuestionDto } from '@app/model/dto/question/create-question-dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question-dto';
import { QuestionService } from '@app/services/question/question.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @Get('/')
    async getAllQuestions(@Res() response: Response) {
        try {
            const allQuestions = await this.questionService.getAllQuestions();
            response.status(HttpStatus.OK).json(allQuestions);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Post('/')
    async addQuestion(@Body() questionDto: CreateQuestionDto, @Res() response: Response) {
        try {
            const question = await this.questionService.addQuestion(questionDto);
            response.status(HttpStatus.CREATED).send(JSON.stringify(question));
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send({ message: error });
        }
    }

    @Get('/:id')
    async getQuestionById(@Param('id') id: string, @Res() response: Response) {
        try {
            const question = await this.questionService.getQuestionById(id);
            response.status(HttpStatus.OK).json(question);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Patch('/:id')
    async updateQuestion(@Body() updateQuestionDto: UpdateQuestionDto, @Res() response: Response) {
        try {
            await this.questionService.updateQuestion(updateQuestionDto);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            if (error === ERROR_QUESTION_NOT_FOUND) {
                response.status(HttpStatus.NOT_FOUND).send({ message: error });
            } else {
                response.status(HttpStatus.BAD_REQUEST).send({ message: error });
            }
        }
    }

    @Delete('/:id')
    async deleteQuestion(@Param('id') id: string, @Res() response: Response) {
        try {
            await this.questionService.deleteQuestion(id);
            response.status(HttpStatus.NO_CONTENT).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send({ message: error });
        }
    }

    @Post('/validate-question/')
    async validateQuestion(@Body() createQuestionDto: CreateQuestionDto, @Res() response: Response) {
        try {
            const isValidQuestion = await this.questionService.validateNewQuestion(createQuestionDto);
            response.status(HttpStatus.OK).send(isValidQuestion);
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send({ message: error });
        }
    }
}
