import { Answer } from '@app/model/answer-types/abstract-answer/answer';

export class MultipleChoiceAnswer extends Answer {
    selectedChoices: Map<string, boolean> = new Map<string, boolean>();

    resetAnswer(): void {
        super.resetAnswer();
        this.selectedChoices.clear();
    }

    updateChoice(choice: string, selection?: boolean): void {
        this.selectedChoices.set(choice, selection);
    }
}
