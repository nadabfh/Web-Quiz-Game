import { Question } from './question';

export interface Game {
    id: string;
    title: string;
    description: string;
    lastModification: string;
    duration: number;
    isVisible?: boolean;
    questions: Question[];
}
