import { Question } from '@app/model/database/question';

const BASE_36 = 36;
export const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

export const stringifyQuestionPublicValues = (question: Question): string => {
    return JSON.stringify(question, (key, value) => {
        if (key !== '_id' && key !== '__v') return value;
    });
};
