import { AnswerCorrectness } from '../constants/answer-correctness';

export interface Feedback {
    score: number;
    answerCorrectness: AnswerCorrectness;
    correctAnswer?: string[];
}
