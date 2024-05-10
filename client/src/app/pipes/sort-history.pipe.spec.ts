import {
    MOCK_HISTORY_ITEM_1,
    MOCK_HISTORY_ITEM_2,
    MOCK_HISTORY_ITEM_3,
    MOCK_HISTORY_ITEM_4,
    MOCK_HISTORY_ITEM_5,
} from '@app/constants/history-mocks';
import { HistoryItem } from '@app/interfaces/history-item';
import { SortHistoryPipe } from './sort-history.pipe';

const MOCK_HISTORY_3_ITEMS = [MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_2];
const REVERSED_HISTORY_3_ITEMS = [MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_1];
const ALTERNATE_HISTORY_3_ITEMS = [MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_3];
const REVERSED_ALTERNATE_HISTORY_3_ITEMS = [MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_1];
const BASE_COMBINATIONS = [MOCK_HISTORY_3_ITEMS, REVERSED_HISTORY_3_ITEMS, REVERSED_ALTERNATE_HISTORY_3_ITEMS, ALTERNATE_HISTORY_3_ITEMS];

const MOCK_HISTORY_5_ITEMS = [MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_5, MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_4];
const MOCK_HISTORY_5_ITEMS_REVERSED = [MOCK_HISTORY_ITEM_4, MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_5, MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_3];
const MOCK_HISTORY_5_ITEMS_ALTERNATE = [MOCK_HISTORY_ITEM_2, MOCK_HISTORY_ITEM_5, MOCK_HISTORY_ITEM_1, MOCK_HISTORY_ITEM_3, MOCK_HISTORY_ITEM_4];
const MOCK_HISTORY_5_ITEMS_ALTERNATE_REVERSED = [
    MOCK_HISTORY_ITEM_4,
    MOCK_HISTORY_ITEM_3,
    MOCK_HISTORY_ITEM_1,
    MOCK_HISTORY_ITEM_5,
    MOCK_HISTORY_ITEM_2,
];
const BASE_COMBINATIONS_5_ITEMS = [
    MOCK_HISTORY_5_ITEMS,
    MOCK_HISTORY_5_ITEMS_REVERSED,
    MOCK_HISTORY_5_ITEMS_ALTERNATE,
    MOCK_HISTORY_5_ITEMS_ALTERNATE_REVERSED,
];

describe('SortHistoryPipe', () => {
    const pipe = new SortHistoryPipe();
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should sort items by title, ascending order', () => {
        BASE_COMBINATIONS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'ascending', 'title').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['A', 'B', 'C']);
        });
        BASE_COMBINATIONS_5_ITEMS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'ascending', 'title').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
        });
    });

    it('should sort items by title, descending order', () => {
        BASE_COMBINATIONS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'descending', 'title').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['C', 'B', 'A']);
        });

        BASE_COMBINATIONS_5_ITEMS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'descending', 'title').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['E', 'D', 'C', 'B', 'A']);
        });
    });

    it('should sort items by date, asccending order', () => {
        BASE_COMBINATIONS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'ascending', 'date').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['C', 'B', 'A']);
        });

        BASE_COMBINATIONS_5_ITEMS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'ascending', 'date').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['D', 'C', 'B', 'A', 'E']);
        });
    });

    it('should sort items by date, descending order', () => {
        BASE_COMBINATIONS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'descending', 'date').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['A', 'B', 'C']);
        });
        BASE_COMBINATIONS_5_ITEMS.forEach((history: HistoryItem[]) => {
            const result = pipe.transform(history, 'descending', 'date').map((historyItem: HistoryItem) => historyItem.title);
            expect(result).toEqual(['E', 'A', 'B', 'C', 'D']);
        });
    });

    it('should return unchanged list if invalid parameters', () => {
        const result = pipe.transform(MOCK_HISTORY_3_ITEMS, '', '').map((historyItem: HistoryItem) => historyItem.title);
        expect(result).toEqual([MOCK_HISTORY_3_ITEMS[0].title, MOCK_HISTORY_3_ITEMS[1].title, MOCK_HISTORY_3_ITEMS[2].title]);
    });
});
