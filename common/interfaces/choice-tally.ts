import { Choice } from './choice';

export interface Tally {
    tally: number;
}

export interface Grade {
    score: string;
}

export interface ChoiceTally extends Choice, Tally {}
export interface GradeTally extends Grade, Tally {}
