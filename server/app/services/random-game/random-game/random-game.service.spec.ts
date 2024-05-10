/* eslint-disable @typescript-eslint/no-magic-numbers */
import { QuestionType } from '@app/constants/question-types';
import { Game } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { QuestionService } from '@app/services/question/question.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { RandomGameService } from './random-game.service';

describe('RandomGameService', () => {
    let service: RandomGameService;
    let questionService: SinonStubbedInstance<QuestionService>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;

    beforeEach(async () => {
        questionService = createStubInstance(QuestionService);
        gameCreationService = createStubInstance(GameCreationService);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RandomGameService,
                { provide: QuestionService, useValue: questionService },
                { provide: GameCreationService, useValue: gameCreationService },
            ],
        }).compile();

        service = module.get<RandomGameService>(RandomGameService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('fetchAllQuestions() should fetch all questions', async () => {
        let fakeQuestions = [new Question(), new Question()];
        questionService.getAllQuestions.resolves(fakeQuestions);

        await service.fetchAllQuestions();
        fakeQuestions = fakeQuestions.filter((question) => question.type === QuestionType.MultipleChoice);
        expect(service.allBankQuestions).toEqual(fakeQuestions);
    });

    it('fetAllQuestions() should log an error if the service fails', async () => {
        questionService.getAllQuestions.rejects('');
        await service.fetchAllQuestions();
        expect(service.allBankQuestions.length).toEqual(0);
    });

    it('isRandomGameAvailable() should return true if there are enough questions (5)', () => {
        service.allBankQuestions = [new Question(), new Question(), new Question(), new Question(), new Question()];
        expect(service.isRandomGameAvailable()).toBeTruthy();
    });

    it('getRandomQuestions() should return an array of 5 random questions', () => {
        service.allBankQuestions = [new Question(), new Question(), new Question(), new Question(), new Question()];
        const randomQuestions = service.getRandomQuestions();
        expect(randomQuestions.length).toEqual(5);
    });

    it('getRandomQuestions() should return an empty array if there are not enough questions', () => {
        service.allBankQuestions = [];
        const randomQuestions = service.getRandomQuestions();
        expect(randomQuestions.length).toEqual(0);
    });

    it('generateRandomGame() should create a random game with 5 random questions', () => {
        const mockQuestions = [new Question(), new Question(), new Question(), new Question(), new Question()];
        const mockGame: Game = {
            id: '',
            title: 'mode aléatoire',
            description: 'mode aléatoire',
            duration: 20,
            isVisible: true,
            questions: mockQuestions,
            lastModification: new Date(),
        };
        jest.spyOn(service, 'getRandomQuestions').mockReturnValue(mockQuestions);
        jest.spyOn(service['gameCreationService'], 'generateId').mockReturnValue(mockGame);
        const game = service.generateRandomGame();
        expect(game).toEqual(mockGame);
        expect(game.questions).toEqual(mockQuestions);
    });
});
