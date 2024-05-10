export abstract class Answer {
    isSubmitted: boolean = false;
    timestamp?: number = undefined;

    resetAnswer(): void {
        this.isSubmitted = false;
        this.timestamp = undefined;
    }

    abstract updateChoice(choice: string, selection: boolean): void;
}
