import { Player } from '@app/interfaces/player';
import { PlayerState } from '@common/constants/player-states';
import { SortPlayersPipe } from './sort-players.pipe';
// Magic numbers verifications are disabled because we need these numbers to test if players are sorted by score.
/* eslint-disable @typescript-eslint/no-magic-numbers */
const MOCK_PLAYER_0 = { username: 'z', score: 1000, bonusCount: 0, isPlaying: true, state: PlayerState.noInteraction } as Player;
const MOCK_PLAYER_1 = { username: 'ab', score: 100, bonusCount: 0, isPlaying: true, state: PlayerState.firstInteraction } as Player;
const MOCK_PLAYER_2 = { username: 'b', score: 50, bonusCount: 0, isPlaying: true, state: PlayerState.default } as Player;
const MOCK_PLAYER_3 = { username: 'c', score: 50, bonusCount: 0, isPlaying: false, state: PlayerState.exit } as Player;
const MOCK_PLAYER_4 = { username: 'aa', score: 0, bonusCount: 0, isPlaying: true, state: PlayerState.finalAnswer } as Player;
const MOCK_PLAYERS: Player[] = [MOCK_PLAYER_4, MOCK_PLAYER_3, MOCK_PLAYER_0, MOCK_PLAYER_2, MOCK_PLAYER_1];

describe('SortPlayersPipe', () => {
    const pipe = new SortPlayersPipe();
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should sort the players by name, ascending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'ascending', 'name');
        expect(result).toEqual([MOCK_PLAYER_4, MOCK_PLAYER_1, MOCK_PLAYER_2, MOCK_PLAYER_3, MOCK_PLAYER_0]);
    });

    it('should sort the players by name, descending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'descending', 'name');
        expect(result).toEqual([MOCK_PLAYER_4, MOCK_PLAYER_1, MOCK_PLAYER_2, MOCK_PLAYER_3, MOCK_PLAYER_0].reverse());
    });

    it('should sort the players by score, ascending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'ascending', 'score');
        expect(result).toEqual([MOCK_PLAYER_4, MOCK_PLAYER_2, MOCK_PLAYER_3, MOCK_PLAYER_1, MOCK_PLAYER_0]);
    });

    it('should sort the players by score, ascending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'descending', 'score');
        expect(result).toEqual([MOCK_PLAYER_4, MOCK_PLAYER_3, MOCK_PLAYER_2, MOCK_PLAYER_1, MOCK_PLAYER_0].reverse());
    });

    it('should sort the players by state, ascending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'ascending', 'state');
        expect(result).toEqual([MOCK_PLAYER_0, MOCK_PLAYER_1, MOCK_PLAYER_4, MOCK_PLAYER_2, MOCK_PLAYER_3]);
    });

    it('should sort the players by state, descending order', () => {
        const result = pipe.transform(MOCK_PLAYERS, 'descending', 'state');
        expect(result).toEqual([MOCK_PLAYER_0, MOCK_PLAYER_1, MOCK_PLAYER_4, MOCK_PLAYER_2, MOCK_PLAYER_3].reverse());
    });

    it('should return the list of no valid parameter', () => {
        const result = pipe.transform(MOCK_PLAYERS, '', '');
        expect(result).toEqual(MOCK_PLAYERS);
    });
});
