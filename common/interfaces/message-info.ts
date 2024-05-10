import { Message } from './message';

export interface MessageInfo {
    roomCode: string;
    message: Message;
}

export interface ChatStateInfo{
    roomCode: string;
    playerUsername: string;
}

