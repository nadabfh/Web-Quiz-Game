import { Question } from '@app/model/database/question';
import { FIRST_CORRECT_CHOICE, INCORRECT_CHOICE, SECOND_CORRECT_CHOICE } from './choice-mocks';
import { getRandomString } from './test-utils';

const getMockQuestion = (): Question => ({
    id: getRandomString(),
    type: 'QCM',
    text: getRandomString(),
    points: 50,
    choices: [
        {
            text: getRandomString(),
            isCorrect: true,
        },
        {
            text: getRandomString(),
            isCorrect: true,
        },
        {
            text: getRandomString(),
            isCorrect: false,
        },
        {
            text: getRandomString(),
            isCorrect: false,
        },
    ],
    lastModification: new Date(),
});

const VALID_QUESTION = getMockQuestion();
VALID_QUESTION.choices = [
    { text: 'a', isCorrect: true },
    { text: 'b', isCorrect: false },
];

const FOUR_CHOICES_QUESTION = getMockQuestion();
FOUR_CHOICES_QUESTION.choices = [
    { text: 'a', isCorrect: true },
    { text: 'b', isCorrect: false },
    { text: 'c', isCorrect: true },
    { text: 'd', isCorrect: false },
];

const ALL_TRUE_QUESTION = getMockQuestion();
ALL_TRUE_QUESTION.choices = [
    { text: 'a', isCorrect: true },
    { text: 'b', isCorrect: true },
];

const ALL_FALSE_QUESTION = getMockQuestion();
ALL_FALSE_QUESTION.choices = [
    { text: 'a', isCorrect: false },
    { text: 'b', isCorrect: false },
];

const getMockQuestionWithChoices = (): Question => {
    const mockQuestion = new Question();
    mockQuestion.choices = [FIRST_CORRECT_CHOICE, SECOND_CORRECT_CHOICE, INCORRECT_CHOICE];
    return mockQuestion;
};

export { ALL_FALSE_QUESTION, ALL_TRUE_QUESTION, FOUR_CHOICES_QUESTION, VALID_QUESTION, getMockQuestion, getMockQuestionWithChoices };
