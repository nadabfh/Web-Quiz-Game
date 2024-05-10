import { LongAnswer } from '@app/model/answer-types/long-answer/long-answer';
import { MultipleChoiceAnswer } from '@app/model/answer-types/multiple-choice-answer/multiple-choice-answer';
import { Socket } from 'socket.io';
import { AnswerCorrectness } from '@common/constants/answer-correctness';

export interface Player {
    username: string;
    answer: MultipleChoiceAnswer | LongAnswer;
    score: number;
    answerCorrectness: AnswerCorrectness;
    bonusCount: number;
    isPlaying: boolean;
    isChatActive: boolean;
    socket: Socket;
    state: string;
}
