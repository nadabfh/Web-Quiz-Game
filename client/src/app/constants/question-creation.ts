import { Question } from '@app/interfaces/question';

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 4;
export const SNACK_BAR_DISPLAY_TIME = 2000;

export interface ChatStateInfo {
    matchRoomCode: string;
    playerUsername: string;
}
export const RANDOM_MODE_GAME = {
    id: '',
    title: 'Mode aléatoire',
    description: 'SURPRISE',
    duration: 20,
    isVisible: true,
    questions: [],
    lastModification: '',
};

export const TEMPLATE_QUESTION: Question = {
    id: 'X',
    type: 'QCM',
    text: 'Quelle est la capitale du canada?',
    points: 20,
    lastModification: '2024-01-26T14:21:19+00:00',
};
