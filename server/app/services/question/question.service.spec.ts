import { getMockQuestion } from '@app/constants/question-mocks';
import { ERROR_DEFAULT, ERROR_INVALID_QUESTION, ERROR_QUESTION_BANK_SAME_TITLE, ERROR_QUESTION_NOT_FOUND } from '@app/constants/request-errors';
import { stringifyQuestionPublicValues } from '@app/constants/test-utils';
import { Question, QuestionDocument } from '@app/model/database/question';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
    let service: QuestionService;
    let questionModel: Model<QuestionDocument>;
    let gameValidationService: SinonStubbedInstance<GameValidationService>;

    beforeEach(async () => {
        gameValidationService = createStubInstance(GameValidationService);
        questionModel = {
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
            deleteMany: jest.fn(),
        } as unknown as Model<QuestionDocument>;
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionService,
                Logger,
                {
                    provide: getModelToken(Question.name),
                    useValue: questionModel,
                },
                {
                    provide: GameValidationService,
                    useValue: gameValidationService,
                },
            ],
        }).compile();
        service = module.get<QuestionService>(QuestionService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getAllQuestions() should return all questions in database', async () => {
        const mockQuestions = [getMockQuestion(), getMockQuestion()];
        const spyFind = jest.spyOn(questionModel, 'find').mockResolvedValue(mockQuestions);
        const returnedQuestions = await service.getAllQuestions();
        expect(spyFind).toHaveBeenCalledWith({});
        expect(returnedQuestions).toEqual(mockQuestions);
    });
    it('getQuestionByName() should return question with the corresponding text', async () => {
        const mockQuestion = getMockQuestion();
        const spyFindOne = jest.spyOn(questionModel, 'findOne').mockResolvedValue(mockQuestion);
        const returnedQuestion = await service.getQuestionByName(mockQuestion.text);
        expect(returnedQuestion).toEqual(mockQuestion);
        expect(spyFindOne).toHaveBeenCalledWith({ text: mockQuestion.text });
    });
    it('getQuestionById() should return question with the corresponding ID', async () => {
        const mockQuestion = getMockQuestion();
        const spyFindOne = jest.spyOn(questionModel, 'findOne').mockResolvedValue(mockQuestion);
        const returnedQuestion = await service.getQuestionById(mockQuestion.id);
        expect(returnedQuestion).toEqual(mockQuestion);
        expect(spyFindOne).toHaveBeenCalledWith({ id: mockQuestion.id });
    });

    it('addQuestion() should add the question to the database with new ID and lastModification', async () => {
        const mockQuestion = getMockQuestion();
        const pastYear = 2020;
        mockQuestion.lastModification = new Date(pastYear, 1, 1);
        const spyGet = jest.spyOn(service, 'getQuestionByName');
        const spyCreate = jest.spyOn(questionModel, 'create').mockImplementation();
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue([]);
        const createdQuestion = await service.addQuestion({ ...mockQuestion });
        expect(spyGet).toHaveBeenCalled();
        expect(spyCreate).toHaveBeenCalled();
        expect(spyValidate).toHaveBeenCalled();
        expect(stringifyQuestionPublicValues(mockQuestion)).toEqual(stringifyQuestionPublicValues(mockQuestion));
        expect(createdQuestion.id).not.toEqual(mockQuestion.id);
        expect(createdQuestion.lastModification).not.toEqual(mockQuestion.lastModification);
    });
    it('addQuestion() should fail if mongo query failed', async () => {
        const spyGet = jest.spyOn(service, 'getQuestionByName');
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue([]);
        const spyCreate = jest.spyOn(questionModel, 'create').mockImplementation(async () => Promise.reject(''));
        const mockQuestion = new Question();
        await service.addQuestion({ ...mockQuestion }).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyGet).toHaveBeenCalled();
        expect(spyValidate).toHaveBeenCalled();
        expect(spyCreate).toHaveBeenCalled();
    });
    it('addQuestion() should fail if the question already exists in the bank', async () => {
        const mockQuestion = new Question();
        const spyGetQuestionByName = jest.spyOn(service, 'getQuestionByName').mockResolvedValue(mockQuestion);
        const testQuestion = new Question();
        testQuestion.id = mockQuestion.id;
        await service.addQuestion(testQuestion).catch((error) => {
            expect(error).toBe(`${ERROR_QUESTION_BANK_SAME_TITLE}`);
        });
        expect(spyGetQuestionByName).toHaveBeenCalledWith(testQuestion.text);
    });
    it('addQuestion() should fail if the question is invalid', async () => {
        const mockErrorMessages = ['mock'];
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue(mockErrorMessages);
        const mockQuestion = new Question();
        await service.addQuestion(mockQuestion).catch((error) => {
            expect(error).toBe(`${ERROR_INVALID_QUESTION}\nmock`);
        });
        expect(spyValidate).toBeCalledWith(mockQuestion);
    });
    it('updateQuestion() should update the question in the database with new lastModification', async () => {
        const mockQuestion = new Question();
        const pastYear = 2020;
        mockQuestion.lastModification = new Date(pastYear, 1, 1);
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue([]);
        const spyUpdate = jest.spyOn(questionModel, 'updateOne');
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(mockQuestion);
        const updatedQuestion = await service.updateQuestion({ ...mockQuestion });
        expect(spyGet).toHaveBeenCalled();
        expect(spyUpdate).toHaveBeenCalled();
        expect(spyValidate).toHaveBeenCalled();
        expect(updatedQuestion.id).toEqual(mockQuestion.id);
        expect(updatedQuestion.lastModification).not.toEqual(mockQuestion.lastModification);
    });
    it('updateQuestion() should fail if question cannot be found in database.', async () => {
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(null);
        await service.updateQuestion(new Question()).catch((error) => {
            expect(error).toBe(`${ERROR_QUESTION_NOT_FOUND}`);
        });
        expect(spyGet).toHaveBeenCalled();
    });
    it('updateQuestion() should fail if the question is invalid', async () => {
        const mockErrorMessages = ['mock'];
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue(mockErrorMessages);
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(new Question());
        await service.updateQuestion(new Question()).catch((error) => {
            expect(error).toBe(`${ERROR_INVALID_QUESTION}\nmock`);
        });
        expect(spyValidate).toHaveBeenCalled();
        expect(spyGet).toHaveBeenCalled();
    });
    it('updateQuestion() should fail if mongo query fails', async () => {
        const spyUpdate = jest.spyOn(questionModel, 'updateOne').mockRejectedValue('');
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue([]);
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(new Question());
        await service.updateQuestion(new Question()).catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyValidate).toHaveBeenCalled();
        expect(spyGet).toHaveBeenCalled();
        expect(spyUpdate).toHaveBeenCalled();
    });
    it('deleteQuestion() should delete the corresponding question', async () => {
        const mockQuestion = getMockQuestion();
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(mockQuestion);
        const spyDeleteOne = jest.spyOn(questionModel, 'deleteOne').mockResolvedValue({ acknowledged: true, deletedCount: 1 });
        await service.deleteQuestion(mockQuestion.id);
        expect(spyDeleteOne).toHaveBeenCalledWith({ id: mockQuestion.id });
        expect(spyGet).toHaveBeenCalledWith(mockQuestion.id);
    });
    it('deleteQuestion() should fail if question cannot be found', async () => {
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(null);
        await service.deleteQuestion('').catch((error) => {
            expect(error).toBe(`${ERROR_QUESTION_NOT_FOUND}`);
        });
        expect(spyGet).toHaveBeenCalled();
    });
    it('deleteQuestion() should fail if mongo query failed', async () => {
        const spyGet = jest.spyOn(service, 'getQuestionById').mockResolvedValue(new Question());
        jest.spyOn(questionModel, 'deleteOne').mockRejectedValue('');
        await service.deleteQuestion('').catch((error) => {
            expect(error).toBe(`${ERROR_DEFAULT} `);
        });
        expect(spyGet).toHaveBeenCalled();
    });

    it('validateNewQuestion() should return true if the question is valid (does not have any error messages)', async () => {
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue([]);
        const mockQuestion = new Question();
        expect(service.validateNewQuestion(mockQuestion)).toBeTruthy();
        expect(spyValidate).toHaveBeenCalledWith(mockQuestion);
    });
    it('validateNewQuestion should return the error messages if question is invalid', async () => {
        const mockErrorMessages = ['mock', 'message'];
        const spyValidate = jest.spyOn(gameValidationService, 'findQuestionErrors').mockReturnValue(mockErrorMessages);
        const mockQuestion = new Question();
        await service.validateNewQuestion(mockQuestion).catch((error) => {
            expect(error).toBe(`${ERROR_INVALID_QUESTION}\nmock\nmessage`);
        });
        expect(spyValidate).toHaveBeenCalledWith(mockQuestion);
    });
});
