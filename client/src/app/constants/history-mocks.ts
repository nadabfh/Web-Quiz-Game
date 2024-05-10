import { HistoryItem } from '@app/interfaces/history-item';

const YEAR = 2024;

const MOCK_HISTORY_ITEM_1: HistoryItem = {
    title: 'A',
    date: new Date(YEAR, 2, 2),
    playersCount: 2,
    bestScore: 3,
};

const MOCK_HISTORY_ITEM_2: HistoryItem = {
    title: 'B',
    date: new Date(YEAR, 1, 1),
    playersCount: 3,
    bestScore: 1,
};

const MOCK_HISTORY_ITEM_3: HistoryItem = {
    title: 'C',
    date: new Date(YEAR - 1, 1, 1),
    playersCount: 1,
    bestScore: 1,
};

const MOCK_HISTORY_ITEM_4: HistoryItem = {
    title: 'D',
    date: new Date(YEAR - 2, 1, 1),
    playersCount: 1,
    bestScore: 1,
};

const MOCK_HISTORY_ITEM_5: HistoryItem = {
    title: 'E',
    date: new Date(YEAR + 1, 1, 1),
    playersCount: 1,
    bestScore: 1,
};

const MOCK_HISTORY = [MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_2];

export { MOCK_HISTORY, MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_4, MOCK_HISTORY_ITEM_5 };
