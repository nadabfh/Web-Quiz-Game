import { Answer } from '@app/model/answer-types/abstract-answer/answer';

export class LongAnswer extends Answer {
    answer: string = '';

    resetAnswer(): void {
        super.resetAnswer();
        this.answer = '';
    }

    updateChoice(choice: string): void {
        this.answer = choice;
    }
}
