import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';

@Injectable({
    providedIn: 'root',
})
export class DownloadGameService {
    isValidKey(key: string): boolean {
        return key !== 'isVisible' && key !== '_id' && key !== '__v';
    }

    formatGameToExport(game: Game): string {
        return JSON.stringify(game, (key, value) => {
            if (this.isValidKey(key)) {
                return value;
            }
        });
    }

    useDownloadLink(gameToDownload: Game, downloadLink: HTMLAnchorElement, url: string): HTMLAnchorElement {
        downloadLink.href = url;
        downloadLink.download = `${gameToDownload.title}.json`;
        downloadLink.click();
        return downloadLink;
    }

    downloadGameAsJson(gameToStringify: Game): void {
        const stringifiedGame = this.formatGameToExport(gameToStringify);
        const blob = new Blob([stringifiedGame], { type: 'text/json' });
        // Reference: https://runninghill.azurewebsites.net/downloading-objects-as-json-files-in-angular/
        const url = window.URL.createObjectURL(blob);
        let downloadLink = document.createElement('a');
        downloadLink = this.useDownloadLink(gameToStringify, downloadLink, url);
        window.URL.revokeObjectURL(url);
        downloadLink.remove();
    }
}
