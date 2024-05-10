import { ERROR_DEFAULT, ERROR_INVALID_QUESTION, ERROR_QUESTION_BANK_SAME_TITLE, ERROR_QUESTION_NOT_FOUND } from '@app/constants/request-errors';
import { Question, QuestionDocument } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question-dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question-dto';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionService {
    constructor(
        @InjectModel(Question.name) public questionModel: Model<QuestionDocument>,
        private readonly validation: GameValidationService,
    ) {}

    async getAllQuestions(): Promise<Question[]> {
        return await this.questionModel.find({});
    }

    async getQuestionByName(name: string): Promise<Question> {
        return await this.questionModel.findOne({ text: name });
    }

    async getQuestionById(questionId: string): Promise<Question> {
        return await this.questionModel.findOne({ id: questionId });
    }

    async addQuestion(question: CreateQuestionDto): Promise<Question> {
        if (await this.getQuestionByName(question.text)) {
            return Promise.reject(`${ERROR_QUESTION_BANK_SAME_TITLE}`);
        }
        question.id = uuidv4();
        question.lastModification = new Date();
        const errorMessages = this.validation.findQuestionErrors(question);
        if (errorMessages.length) {
            return Promise.reject(`${ERROR_INVALID_QUESTION}\n${errorMessages.join('\n')}`);
        }
        try {
            await this.questionModel.create(question);
            return question;
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }

    async updateQuestion(question: UpdateQuestionDto): Promise<Question> {
        const filterQuery = { id: question.id };
        try {
            if (!(await this.getQuestionById(question.id))) {
                return Promise.reject(`${ERROR_QUESTION_NOT_FOUND}`);
            }
            question.lastModification = new Date();
            const errorMessages = this.validation.findQuestionErrors(question);
            if (errorMessages.length) {
                return Promise.reject(`${ERROR_INVALID_QUESTION}\n${errorMessages.join('\n')}`);
            }
            await this.questionModel.updateOne(filterQuery, question);
            return question;
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }

    async deleteQuestion(questionId: string): Promise<void> {
        try {
            if (!(await this.getQuestionById(questionId))) {
                return Promise.reject(`${ERROR_QUESTION_NOT_FOUND}`);
            }
            await this.questionModel.deleteOne({
                id: questionId,
            });
        } catch (error) {
            return Promise.reject(`${ERROR_DEFAULT} ${error}`);
        }
    }

    async validateNewQuestion(question: CreateQuestionDto): Promise<boolean> {
        const errorMessages = this.validation.findQuestionErrors(question);
        if (errorMessages.length) {
            return Promise.reject(`${ERROR_INVALID_QUESTION}\n${errorMessages.join('\n')}`);
        }
        return true;
    }
}
