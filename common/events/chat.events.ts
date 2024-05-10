export enum ChatEvents {
    RoomMessage = 'roomMessage',
    SendMessagesHistory = 'sendMessagesHistory',
    FetchOldMessages = 'fetchOldMessages',
    NewMessage = 'newMessage',
    ChangeChatState = 'changeChatState',
    ToggleChatState = 'toggleChatState',
    ReturnCurrentChatState = 'returnCurrentChatState',
    ChatReactivated = 'chatReactivated'
}
