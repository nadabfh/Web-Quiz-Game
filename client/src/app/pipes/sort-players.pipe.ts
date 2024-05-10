import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '@app/interfaces/player';
import { PlayerState } from '@common/constants/player-states';

const ALTERNATIVE_OPTION = -1;

const compareNames = (firstPlayer: Player, secondPlayer: Player): number => {
    return firstPlayer.username.toUpperCase() > secondPlayer.username.toUpperCase() ? 1 : ALTERNATIVE_OPTION;
};

@Pipe({
    name: 'sortPlayers',
})
export class SortPlayersPipe implements PipeTransform {
    transform(players: Player[], sortDirection: string, sortBy: string): Player[] {
        if (sortBy === 'name') {
            return players.sort((firstPlayer: Player, secondPlayer: Player) => {
                return sortDirection === 'ascending'
                    ? compareNames(firstPlayer, secondPlayer)
                    : compareNames(firstPlayer, secondPlayer) * ALTERNATIVE_OPTION;
            });
        }
        if (sortBy === 'score') {
            return players.sort((firstPlayer: Player, secondPlayer: Player) => {
                const scoreComparison =
                    sortDirection === 'ascending' ? firstPlayer.score - secondPlayer.score : secondPlayer.score - firstPlayer.score;
                const nameComparison = compareNames(firstPlayer, secondPlayer);
                return scoreComparison !== 0 ? scoreComparison : nameComparison;
            });
        }
        if (sortBy === 'state') {
            const noInteractionPlayers = players.filter((player: Player) => player.state === PlayerState.noInteraction);
            const firstInteractionPlayers = players.filter((player: Player) => player.state === PlayerState.firstInteraction);
            const finalAnswerPlayers = players.filter((player: Player) => player.state === PlayerState.finalAnswer);
            const defaultPlayers = players.filter((player: Player) => player.state === PlayerState.default);
            const exitPlayers = players.filter((player: Player) => player.state === PlayerState.exit);

            const categoriesToSort: Player[][] =
                sortDirection === 'ascending'
                    ? [noInteractionPlayers, firstInteractionPlayers, finalAnswerPlayers, defaultPlayers, exitPlayers]
                    : [exitPlayers, defaultPlayers, finalAnswerPlayers, firstInteractionPlayers, noInteractionPlayers];

            const result: Player[] = [];

            categoriesToSort.forEach((playersToSort: Player[]) => {
                const sortedPlayers = playersToSort.sort((firstPlayer: Player, secondPlayer: Player) => compareNames(firstPlayer, secondPlayer));
                sortedPlayers.forEach((player: Player) => result.push(player));
            });
            return result;
        }
        return players;
    }
}
