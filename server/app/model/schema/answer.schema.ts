export interface Answer {
    selectedChoices: Map<string, boolean>;
    freeAnswer: string;
    isSubmitted: boolean;
    timestamp?: number;
}

export interface PlayerInfo {
    gameTitle: string;
    start: boolean;
}

export interface Feedback {
    score: number;
    correctAnswer: string[];
}
