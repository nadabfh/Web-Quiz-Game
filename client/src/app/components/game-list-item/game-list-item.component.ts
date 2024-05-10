import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { DownloadGameService } from '@app/services/download-game/download-game.service';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-game-list-item',
    templateUrl: './game-list-item.component.html',
    styleUrls: ['./game-list-item.component.scss'],
})
export class GameListItemComponent {
    @Input() game: Game;
    @Input() isAdminMode: boolean;
    @Output() deleteGameFromList: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        private readonly gameService: GameService,
        private readonly downloadGameService: DownloadGameService,
    ) {}

    toggleGameVisibility() {
        if (!this.isAdminMode) return;
        this.gameService.toggleGameVisibility(this.game).subscribe();
    }

    downloadGameAsJson() {
        if (!this.isAdminMode) return;
        this.downloadGameService.downloadGameAsJson(this.game);
    }

    deleteGame() {
        if (!this.isAdminMode) return;
        this.deleteGameFromList.emit(this.game.id);
    }
}
