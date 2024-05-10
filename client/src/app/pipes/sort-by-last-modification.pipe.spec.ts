/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Question } from '@app/interfaces/question';
import { SortByLastModificationPipe } from '@app/pipes/sort-by-last-modification.pipe';

const mockQuestion: Question[] = [
    {
        id: 'question1',
        type: 'QCM',
        text: 'Question1?',
        points: 10,
        choices: [],
        lastModification: new Date(2024, 2, 1).toString(),
    },
    {
        id: 'question2',
        type: 'QCM',
        text: 'Question2?',
        points: 20,
        choices: [],
        lastModification: new Date(1999, 5, 17).toString(),
    },
    {
        id: 'question3',
        type: 'QCM',
        text: 'Question3?',
        points: 30,
        choices: [],
        lastModification: new Date(2007, 3, 21).toString(),
    },
    {
        id: 'question4',
        type: 'QCM',
        text: 'Question4?',
        points: 40,
        choices: [],
        lastModification: new Date(2007, 3, 21).toString(),
    },
];

describe('SortByLastModificationPipe', () => {
    const pipe = new SortByLastModificationPipe();

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should sort quesstions by ascending date order', () => {
        const sortedQuestions = pipe.transform(mockQuestion, 'ascending').map((question) => question.id);
        expect(sortedQuestions).toEqual(['question1', 'question3', 'question4', 'question2']);
    });

    it('should sort questions by descending date order', () => {
        const sortedQuestions = pipe.transform(mockQuestion, 'descending').map((question) => question.id);
        expect(sortedQuestions).toEqual(['question2', 'question3', 'question4', 'question1']);
    });

    it('should not sort questions if direction is not specified', () => {
        const sortedQuestions = pipe.transform(mockQuestion, 'undefined');
        expect(sortedQuestions).toBe(sortedQuestions);
    });
});
