import { ChoiceTally, GradeTally } from './choice-tally';

export interface Histogram {
    question: string;
    type: string;
}

export interface MultipleChoiceHistogram extends Histogram {
    choiceTallies: ChoiceTally[];
}
export interface PlayerCountHistogram extends Histogram {
    playerCount: number;
    activePlayers: number;
    inactivePlayers: number;
}

export interface GradesHistogram extends Histogram {
    gradeTallies: GradeTally[];
}
