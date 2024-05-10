import { GAME_WITH_IS_CORRECT_FIELD, getMockGame } from '@app/constants/game-mocks';
import { getMockQuestion } from '@app/constants/question-mocks';
import { QuestionType } from '@app/constants/question-types';
import { Test, TestingModule } from '@nestjs/testing';
import * as uuid from 'uuid';
import { GameCreationService } from './game-creation.service';
jest.mock('uuid');

const MOCK_YEAR = 2024;
const MOCK_DATE = new Date(MOCK_YEAR, 1, 1);
describe('GameCreationService', () => {
    let service: GameCreationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameCreationService],
        }).compile();

        service = module.get<GameCreationService>(GameCreationService);
    });

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_DATE);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('updateDateAndVisibility() should update the game date and make its visibility to false', async () => {
        const mockGame = getMockGame();
        const updatedGame = service.updateDateAndVisibility(mockGame);
        expect(updatedGame.id).toEqual(mockGame.id);
        expect(updatedGame.isVisible).toBeFalsy();
        expect(updatedGame.lastModification).toEqual(MOCK_DATE);
        updatedGame.questions.forEach((question) => {
            expect(question.lastModification).toEqual(MOCK_DATE);
        });
    });
    it('generateId() should generate an ID for game and its questions', () => {
        // Reference: https://stackoverflow.com/questions/51383177/how-to-mock-uuid-with-jest
        const uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mockedValue');
        const mockGame = getMockGame();
        const updatedGame = service.generateId(mockGame);
        expect(uuidSpy).toHaveBeenCalledTimes(1 + updatedGame.questions.length);
    });
    it('completeIsCorrectField() should call completeIsCorrectChoice for each question', () => {
        const spyComplete = jest.spyOn(service, 'completeIsCorrectChoice');
        service.completeIsCorrectField(GAME_WITH_IS_CORRECT_FIELD);
        expect(spyComplete).toHaveBeenCalledTimes(GAME_WITH_IS_CORRECT_FIELD.questions.length);
    });

    it('completeIsCorrectChoice() should return the question if it is of QRL type', () => {
        const mockQuestion = getMockQuestion();
        mockQuestion.type = QuestionType.LongAnswer;
        expect(service.completeIsCorrectChoice(mockQuestion)).toEqual(mockQuestion);
    });

    it('completeIsCorrectChoice() should complete isCorrect property by false if it is not defined or null', () => {
        const mockQuestion = getMockQuestion();
        mockQuestion.choices = [
            { text: 'mock' },
            { text: 'mock', isCorrect: null },
            { text: 'mock', isCorrect: true },
            { text: 'mock', isCorrect: false },
        ];
        const expectedQuestion = mockQuestion;
        expectedQuestion.choices = [
            { text: 'mock', isCorrect: false },
            { text: 'mock', isCorrect: false },
            { text: 'mock', isCorrect: true },
            { text: 'mock', isCorrect: false },
        ];
        const result = service.completeIsCorrectChoice(mockQuestion);
        expect(result).toEqual(expectedQuestion);
    });
});
