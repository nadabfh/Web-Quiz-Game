import { TestBed, waitForAsync } from '@angular/core/testing';

import { getMockGame } from '@app/constants/game-mocks';
import { GameService } from '@app/services/game/game.service';
import { UploadGameService } from './upload-game.service';
const NEW_MOCK_GAME = getMockGame();
describe('UploadGameService', () => {
    let service: UploadGameService;
    let gameSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameSpy = jasmine.createSpyObj('GameService', ['uploadGame']);
        TestBed.configureTestingModule({
            providers: [{ provide: GameService, useValue: gameSpy }],
        });
        service = TestBed.inject(UploadGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onFileSelected should call readFile()', () => {
        const readFileSpy = spyOn(service, 'readFile');
        const dataTransfer = new DataTransfer();
        const mockFile = new File([JSON.stringify(NEW_MOCK_GAME)], 'file.json', { type: 'application/json' });
        dataTransfer.items.add(mockFile);
        const mockEvent = {
            dataTransfer,
            target: { files: dataTransfer },
        } as unknown as InputEvent;
        service.onFileSelected(mockEvent);
        expect(readFileSpy).toHaveBeenCalled();
    });

    it('readFile() should call addStringifiedGame()', waitForAsync(async () => {
        // Reference: https://stackoverflow.com/questions/64642547/how-can-i-test-the-filereader-onload-callback-function-in-angular-jasmine
        const addStringifiedGameSpy = spyOn(service, 'addStringifiedGame');
        const mockFile = new File([JSON.stringify(NEW_MOCK_GAME)], 'file.json', { type: 'application/json' });
        expect(true).toBeTruthy();
        await service.readFile(mockFile).then(() => {
            expect(addStringifiedGameSpy).toHaveBeenCalled();
        });
    }));

    it('addStringifiedGame() should parse the stringified game and call uploadGame()', () => {
        const mockGameStringified = JSON.stringify(NEW_MOCK_GAME);
        service.addStringifiedGame(mockGameStringified);
        expect(gameSpy.uploadGame).toHaveBeenCalledWith(JSON.parse(mockGameStringified));
    });
});
