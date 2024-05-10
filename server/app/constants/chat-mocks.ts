import { Message } from '@app/model/schema/message.schema';
import { ChatStateInfo } from '@common/interfaces/message-info';

export const MOCK_MESSAGE: Message = { text: 'Test Text', author: 'User', date: new Date() };
export const MOCK_ROOM_CODE = '1234';

export const MOCK_CHAT_STATE_DATA: ChatStateInfo = {
    roomCode: MOCK_ROOM_CODE,
    playerUsername: '',
};

export const MOCK_MATCH_ROOM_INDEX = 0;
export const MOCK_PLAYER_INDEX = 0;

export const MOCK_YEAR = 2024;
export const MOCK_DATE = new Date(MOCK_YEAR, 1, 1);
