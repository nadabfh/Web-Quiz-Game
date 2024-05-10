import { Tally } from '@common/interfaces/choice-tally';

export abstract class Tracker<T extends Tally> {
    question: string = '';
    items: { [key: string]: T } = {};

    incrementCount(key: string): void {
        if (this.items[key]) this.items[key].tally++;
    }

    decrementCount(key: string): void {
        if (this.items[key] && this.items[key].tally > 0) this.items[key].tally--;
    }

    resetTracker(questionText: string): void {
        this.question = questionText;
        this.items = {};
    }
}
