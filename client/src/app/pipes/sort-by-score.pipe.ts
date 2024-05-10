import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '@app/interfaces/player';

const ALTERNATIVE_OPTION = -1;

@Pipe({
    name: 'sortByScore',
})
export class SortByScorePipe implements PipeTransform {
    transform(players: Player[]): Player[] {
        return players.sort((firstPlayer: Player, secondPlayer: Player) => {
            const scoreComparison = secondPlayer.score - firstPlayer.score;
            const nameComparison = firstPlayer.username.toUpperCase() > secondPlayer.username.toUpperCase() ? 1 : ALTERNATIVE_OPTION;
            return scoreComparison !== 0 ? scoreComparison : nameComparison;
        });
    }
}
