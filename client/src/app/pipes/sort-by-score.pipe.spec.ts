import { Player } from '@app/interfaces/player';
import { SortByScorePipe } from './sort-by-score.pipe';

// Magic numbers verifications are disabled because we need these numbers to test if players are sorted by score.
/* eslint-disable @typescript-eslint/no-magic-numbers */
const MOCK_PLAYER_0 = { username: 'z', score: 1000, bonusCount: 0, isPlaying: true } as Player;
const MOCK_PLAYER_1 = { username: 'ab', score: 100, bonusCount: 0, isPlaying: true } as Player;
const MOCK_PLAYER_2 = { username: 'b', score: 50, bonusCount: 0, isPlaying: false } as Player;
const MOCK_PLAYER_3 = { username: 'c', score: 50, bonusCount: 0, isPlaying: false } as Player;
const MOCK_PLAYER_4 = { username: 'aa', score: 0, bonusCount: 0, isPlaying: true } as Player;
const MOCK_PLAYERS: Player[] = [MOCK_PLAYER_4, MOCK_PLAYER_3, MOCK_PLAYER_0, MOCK_PLAYER_2, MOCK_PLAYER_1];

describe('SortByScorePipe', () => {
    const pipe = new SortByScorePipe();
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should sort players by score, then alphabetical order if score are equal', () => {
        const sortedPlayers = pipe.transform(MOCK_PLAYERS);
        expect(sortedPlayers).toEqual([MOCK_PLAYER_0, MOCK_PLAYER_1, MOCK_PLAYER_2, MOCK_PLAYER_3, MOCK_PLAYER_4]);
    });
});
