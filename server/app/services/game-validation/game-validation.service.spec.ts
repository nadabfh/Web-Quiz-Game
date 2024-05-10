import { GAME_VALID_QUESTION, getMockGame } from '@app/constants/game-mocks';
import {
    MAX_CHOICES_NUMBER,
    MAX_DURATION,
    MAX_POINTS,
    MIN_CHOICES_NUMBER,
    MIN_DURATION,
    MIN_POINTS,
} from '@app/constants/game-validation-constraints';
import {
    ERROR_CHOICES_NUMBER,
    ERROR_CHOICES_RATIO,
    ERROR_DURATION,
    ERROR_EMPTY_DESCRIPTION,
    ERROR_EMPTY_QUESTION,
    ERROR_EMPTY_TITLE,
    ERROR_POINTS,
    ERROR_QUESTIONS_NUMBER,
    ERROR_QUESTION_TYPE,
    ERROR_REPEAT_CHOICES,
} from '@app/constants/game-validation-errors';
import { ALL_FALSE_QUESTION, ALL_TRUE_QUESTION, FOUR_CHOICES_QUESTION, VALID_QUESTION, getMockQuestion } from '@app/constants/question-mocks';
import { QuestionType } from '@app/constants/question-types';
import { Test, TestingModule } from '@nestjs/testing';
import { GameValidationService } from './game-validation.service';
describe('GameValidationService', () => {
    let service: GameValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameValidationService],
        }).compile();

        service = module.get<GameValidationService>(GameValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('isValidString() should return false if the string is only made of whitespace; else true', () => {
        const invalidNullString = '';
        const invalidSpaceString = ' ';
        expect(service.isValidString(invalidNullString)).toBeFalsy();
        expect(service.isValidString(invalidSpaceString)).toBeFalsy();
    });
    it('isValidString() should return true if the string is not made only of whitespace', () => {
        const validString = 'abc';
        const validStringWithSpace = 'abc abc';
        expect(service.isValidString(validString)).toBeTruthy();
        expect(service.isValidString(validStringWithSpace)).toBeTruthy();
    });

    it('isValidRange() should return true only if the quantity is in the range', () => {
        const minimum = -5;
        const maximum = 5;
        const validTestNumber = 4;
        const invalidStepNumber = 3;
        const inferiorTestNumber = -10;
        const superiorTestNumber = 10;

        expect(service.isValidRange(validTestNumber, minimum, maximum)).toBeTruthy();
        expect(service.isValidRange(invalidStepNumber, minimum, maximum)).toBeTruthy();
        expect(service.isValidRange(inferiorTestNumber, minimum, maximum)).toBeFalsy();
        expect(service.isValidRange(superiorTestNumber, minimum, maximum)).toBeFalsy();
        expect(service.isValidRange(minimum, minimum, maximum)).toBeTruthy();
        expect(service.isValidRange(maximum, minimum, maximum)).toBeTruthy();
    });

    it('isValidChoicesRatio() should return true only if there is at least one good choice and one wrong choice', () => {
        expect(service.isValidChoicesRatio(VALID_QUESTION)).toBeTruthy();
        expect(service.isValidChoicesRatio(FOUR_CHOICES_QUESTION)).toBeTruthy();
        expect(service.isValidChoicesRatio(ALL_FALSE_QUESTION)).toBeFalsy();
        expect(service.isValidChoicesRatio(ALL_TRUE_QUESTION)).toBeFalsy();
    });
    it('isUniqueChoices() should return true only if all choices texts are unique and not duplicated', () => {
        const uniqueChoices = [{ text: 'a' }, { text: 'b' }];
        const repeatChoices = [{ text: 'a' }, { text: 'b' }, { text: 'a' }];
        expect(service.isUniqueChoices(uniqueChoices)).toBeTruthy();
        expect(service.isUniqueChoices(repeatChoices)).toBeFalsy();
    });
    it('findChoicesQuestionErrors() should return an empty array if the question has no error', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(true);
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(true);
        const spyChoicesRatio = jest.spyOn(service, 'isValidChoicesRatio').mockReturnValue(true);
        const spyUniqueChoices = jest.spyOn(service, 'isUniqueChoices').mockReturnValue(true);
        expect(service.findChoicesQuestionErrors(VALID_QUESTION)).toEqual([]);
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.choices.length, MIN_CHOICES_NUMBER, MAX_CHOICES_NUMBER);
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.points, MIN_POINTS, MAX_POINTS);
        expect(spyValidString).toHaveBeenCalledWith(VALID_QUESTION.text);
        expect(spyChoicesRatio).toHaveBeenCalledWith(VALID_QUESTION);
        expect(spyUniqueChoices).toHaveBeenCalledWith(VALID_QUESTION.choices);
    });

    it('findChoicesQuestionErrors() should return an array containing ERROR_CHOICES_NUMBER if the number of choices is invalid', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const foundErrors = service.findChoicesQuestionErrors(VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_CHOICES_NUMBER)).toBeTruthy();
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.choices.length, MIN_CHOICES_NUMBER, MAX_CHOICES_NUMBER);
    });

    it('findChoicesQuestionErrors() should return an array containing ERROR_REPEAT_CHOICES if there are duplicate choices', () => {
        const spyUniqueChoices = jest.spyOn(service, 'isUniqueChoices').mockReturnValue(false);
        const foundErrors = service.findChoicesQuestionErrors(VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_REPEAT_CHOICES)).toBeTruthy();
        expect(spyUniqueChoices).toHaveBeenCalledWith(VALID_QUESTION.choices);
    });

    it('findGeneralQuestionErrors() should return an array containing ERROR_QUESTION_TYPE if the type of the question is invalid', () => {
        const mockQuestion = getMockQuestion();
        mockQuestion.type = 'mock';
        const foundErrors = service.findGeneralQuestionErrors(mockQuestion);
        expect(foundErrors.find((message: string) => message === ERROR_QUESTION_TYPE)).toBeTruthy();
    });

    it('findGeneralQuestionErrors() should return an array containing ERROR_POINTS if the number of points is not in correct range', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const foundErrors = service.findGeneralQuestionErrors(VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_POINTS)).toBeTruthy();
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.points, MIN_POINTS, MAX_POINTS);
    });

    it('findChoicesQuestionErrors() should return array containing ERROR_POINTS if number of points is not correct multiple', () => {
        const testWrongPointsQuestion = VALID_QUESTION;
        testWrongPointsQuestion.points = 55;
        const foundErrors = service.findChoicesQuestionErrors(testWrongPointsQuestion);
        expect(foundErrors.find((message: string) => message === ERROR_POINTS)).toBeTruthy();
    });

    it('findGeneralQuestionErrors() should return an array containing ERROR_EMPTY_QUESTION if the question text is empty', () => {
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(false);
        const foundErrors = service.findGeneralQuestionErrors(VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_EMPTY_QUESTION)).toBeTruthy();
        expect(spyValidString).toHaveBeenCalledWith(VALID_QUESTION.text);
    });

    it('findChoicesQuestionErrors() should return an array containing ERROR_CHOICES_RATIO if the choices ratio is invalid', () => {
        const spyChoicesRatio = jest.spyOn(service, 'isValidChoicesRatio').mockReturnValue(false);
        const foundErrors = service.findChoicesQuestionErrors(VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_CHOICES_RATIO)).toBeTruthy();
        expect(spyChoicesRatio).toHaveBeenCalledWith(VALID_QUESTION);
    });

    it('findGeneralQuestionErrors() should return an array with all the applicable general question errors', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(false);
        expect(service.findGeneralQuestionErrors(VALID_QUESTION)).toEqual([ERROR_POINTS, ERROR_EMPTY_QUESTION]);
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.points, MIN_POINTS, MAX_POINTS);
        expect(spyValidString).toHaveBeenCalledWith(VALID_QUESTION.text);
    });

    it('findChoicesQuestionErrors() should return an array with all the question errors', () => {
        const mockMessage = 'mock';
        const spyGeneralErrors = jest.spyOn(service, 'findGeneralQuestionErrors').mockReturnValue([mockMessage, mockMessage]);
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const spyChoicesRatio = jest.spyOn(service, 'isValidChoicesRatio').mockReturnValue(false);
        const spyUniqueChoices = jest.spyOn(service, 'isUniqueChoices').mockReturnValue(false);
        expect(service.findChoicesQuestionErrors(VALID_QUESTION)).toEqual([
            mockMessage,
            mockMessage,
            ERROR_CHOICES_NUMBER,
            ERROR_REPEAT_CHOICES,
            ERROR_CHOICES_RATIO,
        ]);
        expect(spyGeneralErrors).toHaveBeenCalled();
        expect(spyRange).toHaveBeenCalledWith(VALID_QUESTION.choices.length, MIN_CHOICES_NUMBER, MAX_CHOICES_NUMBER);
        expect(spyChoicesRatio).toHaveBeenCalledWith(VALID_QUESTION);
        expect(spyUniqueChoices).toHaveBeenCalledWith(VALID_QUESTION.choices);
    });

    it('findGameErrors() should return an empty array if the game is valid', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(true);
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(true);
        const spyValidateQuestion = jest.spyOn(service, 'findChoicesQuestionErrors').mockImplementation(() => []);
        expect(service.findGameErrors(GAME_VALID_QUESTION)).toEqual([]);
        expect(spyValidString).toHaveBeenCalledWith(GAME_VALID_QUESTION.title);
        expect(spyValidString).toHaveBeenCalledWith(GAME_VALID_QUESTION.description);
        expect(spyRange).toHaveBeenCalledWith(GAME_VALID_QUESTION.duration, MIN_DURATION, MAX_DURATION);
        expect(spyValidateQuestion).toHaveBeenCalledTimes(GAME_VALID_QUESTION.questions.length);
    });

    it('findGameErrors() should return an array containing ERROR_EMPTY_TITLE if title is empty', () => {
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(false);
        const foundErrors = service.findGameErrors(GAME_VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_EMPTY_TITLE));
        expect(spyValidString).toHaveBeenCalledWith(GAME_VALID_QUESTION.title);
    });

    it('findGameErrors() should return an array containing ERROR_EMPTY_DESCRIPTION if description is empty', () => {
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(false);
        const foundErrors = service.findGameErrors(GAME_VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_EMPTY_DESCRIPTION));
        expect(spyValidString).toHaveBeenCalledWith(GAME_VALID_QUESTION.description);
    });

    it('findGameErrors() should return an array containing ERROR_DURATION if duration is invalid', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const foundErrors = service.findGameErrors(GAME_VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_DURATION));
        expect(spyRange).toHaveBeenCalledWith(GAME_VALID_QUESTION.duration, MIN_DURATION, MAX_DURATION);
    });

    it('findGameErrors() should return an array containing ERROR_QUESTIONS_NUMBER if it contains no question', () => {
        const testNoQuestionGame = GAME_VALID_QUESTION;
        testNoQuestionGame.questions = [];
        const foundErrors = service.findGameErrors(GAME_VALID_QUESTION);
        expect(foundErrors.find((message: string) => message === ERROR_QUESTIONS_NUMBER));
    });

    it('findGameErrors() should return an array containing all errors from invalid choices questions', () => {
        const spyValidateQuestion = jest.spyOn(service, 'findChoicesQuestionErrors').mockImplementation(() => [ERROR_EMPTY_QUESTION]);

        const invalidQuestionsGame = GAME_VALID_QUESTION;
        invalidQuestionsGame.questions = [];
        for (let i = 0; i < 2; i++) {
            invalidQuestionsGame.questions.push(VALID_QUESTION);
        }

        const foundErrors = service.findGameErrors(invalidQuestionsGame);

        const firstQuestionErrorMessage = 'La question 1 est invalide:';
        const secondQuestionErrorMessage = 'La question 2 est invalide:';

        expect(foundErrors).toEqual([firstQuestionErrorMessage, ERROR_EMPTY_QUESTION, secondQuestionErrorMessage, ERROR_EMPTY_QUESTION]);
        expect(spyValidateQuestion).toHaveBeenCalledTimes(invalidQuestionsGame.questions.length);
    });

    it('findGameErrors() should return an array containing all errors from invalid long questions', () => {
        const spyValidateQuestion = jest.spyOn(service, 'findGeneralQuestionErrors').mockImplementation(() => [ERROR_EMPTY_QUESTION]);

        const invalidQuestionsGame = GAME_VALID_QUESTION;
        invalidQuestionsGame.questions = [];
        for (let i = 0; i < 2; i++) {
            const newQuestion = VALID_QUESTION;
            newQuestion.type = 'QRL';
            invalidQuestionsGame.questions.push(newQuestion);
        }

        const foundErrors = service.findGameErrors(invalidQuestionsGame);

        const firstQuestionErrorMessage = 'La question 1 est invalide:';
        const secondQuestionErrorMessage = 'La question 2 est invalide:';

        expect(foundErrors).toEqual([firstQuestionErrorMessage, ERROR_EMPTY_QUESTION, secondQuestionErrorMessage, ERROR_EMPTY_QUESTION]);
        expect(spyValidateQuestion).toHaveBeenCalledTimes(invalidQuestionsGame.questions.length);
    });

    it('findGameErrors() should return an array containing all game errors', () => {
        const spyRange = jest.spyOn(service, 'isValidRange').mockReturnValue(false);
        const spyValidString = jest.spyOn(service, 'isValidString').mockReturnValue(false);
        const spyValidateChoiceQuestion = jest.spyOn(service, 'findChoicesQuestionErrors').mockImplementation(() => []);
        const spyValidateLongQuestion = jest.spyOn(service, 'findGeneralQuestionErrors').mockImplementation(() => []);
        const mockGame = getMockGame();
        const mockQuestion = getMockQuestion();
        mockQuestion.type = QuestionType.MultipleChoice;
        mockGame.questions = [mockQuestion];
        expect(service.findGameErrors(mockGame)).toEqual([ERROR_EMPTY_TITLE, ERROR_EMPTY_DESCRIPTION, ERROR_DURATION]);
        expect(spyValidString).toHaveBeenCalledWith(mockGame.title);
        expect(spyValidString).toHaveBeenCalledWith(mockGame.description);
        expect(spyRange).toHaveBeenCalledWith(mockGame.duration, MIN_DURATION, MAX_DURATION);
        expect(spyValidateChoiceQuestion).toHaveBeenCalledTimes(mockGame.questions.length);
        expect(spyValidateLongQuestion).toHaveBeenCalledTimes(0);
    });
});
