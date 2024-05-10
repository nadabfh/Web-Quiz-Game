import { Injectable } from '@angular/core';
import { GameService } from '@app/services/game/game.service';

@Injectable({
    providedIn: 'root',
})
export class UploadGameService {
    constructor(private readonly gameService: GameService) {}

    onFileSelected(event: Event): void {
        // Reference: https://blog.angular-university.io/angular-file-upload/
        // Reference: https://stackoverflow.com/questions/43176560/property-files-does-not-exist-on-type-eventtarget-error-in-typescript
        const target = event.target as HTMLInputElement;
        const file: File = (target.files as FileList)[0];
        this.readFile(file);
    }

    async readFile(file: File): Promise<void | undefined> {
        // Reference: https://stackoverflow.com/questions/47581687/read-a-file-and-parse-its-content
        return await new Promise<void>(() => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const stringifiedGame = fileReader.result?.toString();
                this.addStringifiedGame(stringifiedGame);
            };
            fileReader.readAsText(file);
        });
    }

    addStringifiedGame(newGameStringified: string | undefined): void {
        if (newGameStringified) {
            const newGame = JSON.parse(newGameStringified);
            this.gameService.uploadGame(newGame);
        }
    }
}
