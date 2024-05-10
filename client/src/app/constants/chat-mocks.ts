/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Message } from '@app/interfaces/message';
import { Player } from '@app/interfaces/player';

export const MOCK_DATE = new Date(2024, 1, 1);

export const MOCK_MESSAGE: Message = { text: 'Test Text', author: 'User', date: MOCK_DATE };

export const MOCK_MESSAGES: Message[] = [
    {
        text: 'Test Text',
        author: 'User1',
        date: MOCK_DATE,
    },
];

export const MOCK_ROOM_CODE = '1234';

export const MOCK_USERNAME = MOCK_MESSAGE.author;

export const PLAYER_MOCK: Player = {
    username: '',
    score: 0,
    bonusCount: 0,
    isPlaying: true,
    isChatActive: true,
    state: '',
};
