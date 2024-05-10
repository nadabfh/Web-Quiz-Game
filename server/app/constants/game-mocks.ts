import { Game } from '@app/model/database/game';
import { VALID_QUESTION } from './question-mocks';
import { getRandomString } from './test-utils';
import { Choice } from '@app/model/database/choice';

const gameYear = 2020;

const getMockGame = (): Game => ({
    id: getRandomString(),
    title: getRandomString(),
    description: getRandomString(),
    lastModification: new Date(gameYear, 1, 1),
    duration: 30,
    isVisible: true,
    questions: [
        {
            id: getRandomString(),
            type: 'QCM',
            text: getRandomString(),
            points: 30,
            choices: [
                {
                    text: getRandomString(),
                    isCorrect: true,
                },
                {
                    text: getRandomString(),
                    isCorrect: false,
                },
            ],
            lastModification: new Date(gameYear, 1, 1),
        },
    ],
});

const MOCK_CHOICES: Choice[] = [
    { text: 'correct choice', isCorrect: true },
    { text: 'incorrect choice', isCorrect: false },
];
const GAME_VALID_QUESTION = getMockGame();
GAME_VALID_QUESTION.questions = [VALID_QUESTION];

const pastYear = 2020;
const GAME_WITH_IS_CORRECT_FIELD: Game = {
    id: '',
    title: '',
    description: '',
    lastModification: new Date(pastYear, 1, 1),
    duration: 0,
    isVisible: true,
    questions: [
        {
            id: '0',
            type: 'QCM',
            text: '',
            points: 0,
            lastModification: new Date(pastYear, 1, 1),
            choices: [
                {
                    text: '',
                    isCorrect: true,
                },
                {
                    text: '',
                    isCorrect: false,
                },
            ],
        },
        {
            id: '1',
            type: 'QCM',
            text: '',
            points: 0,
            lastModification: new Date(pastYear, 1, 1),
            choices: [
                {
                    text: '',
                    isCorrect: true,
                },
                {
                    text: '',
                    isCorrect: false,
                },
            ],
        },
    ],
};

const GAME_WITHOUT_IS_CORRECT_FIELD: Game = {
    id: '',
    title: '',
    description: '',
    lastModification: new Date(pastYear, 1, 1),
    duration: 0,
    isVisible: true,
    questions: [
        {
            id: '0',
            type: 'QCM',
            text: '',
            points: 0,
            lastModification: new Date(pastYear, 1, 1),
            choices: [
                {
                    text: '',
                },
                {
                    text: '',
                },
            ],
        },
        {
            id: '1',
            type: 'QCM',
            text: '',
            points: 0,
            lastModification: new Date(pastYear, 1, 1),
            choices: [
                {
                    text: '',
                },
                {
                    text: '',
                },
            ],
        },
    ],
};

export { GAME_VALID_QUESTION, GAME_WITHOUT_IS_CORRECT_FIELD, GAME_WITH_IS_CORRECT_FIELD, MOCK_CHOICES, getMockGame };
