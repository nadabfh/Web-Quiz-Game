import { TestBed } from '@angular/core/testing';

import { Game } from '@app/interfaces/game';
import { DownloadGameService } from './download-game.service';

describe('DownloadGameService', () => {
    let service: DownloadGameService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DownloadGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('isValidKey() should return false if key is isVisible, _id or __v', () => {
        const result = service.isValidKey('isVisible');
        expect(result).toBeFalsy();
    });

    it('formatGameToExport() should return a stringified game without isVisible property', () => {
        const stringifiedMockGame = '{"id":"mock","title":"mock","description":"mock","lastModification":"mock","duration":1,"questions":[]}';
        const result = service.formatGameToExport(mockGame);
        expect(result).toEqual(stringifiedMockGame);
    });

    it('useDownloadLink() should edit the url and download properties and click the anchor', () => {
        const mockUrl = 'mock';
        const anchor: HTMLAnchorElement = document.createElement('a');
        const spyClick = spyOn(anchor, 'click');
        const expectedUrl = `http://${location.host}/${mockUrl}`;
        const result = service.useDownloadLink(mockGame, anchor, mockUrl);
        expect(result.href).toEqual(expectedUrl);
        expect(result.download).toEqual(`${mockGame.title}.json`);
        expect(spyClick).toHaveBeenCalled();
    });

    // Ref : https://stackoverflow.com/questions/59062023/how-to-mock-a-pdf-blob
    // Ref : https://stackoverflow.com/questions/61142428/angular-test-mock-a-httpresponse-containing-a-blob
    it('should return a game as JSON without isVisible, _id or __v attributes', () => {
        const stringifiedGame = JSON.stringify(mockGame);
        const mockBlob = new Blob([stringifiedGame], { type: 'text/json' });
        const createObjectUrlSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('');
        const revokeObjectSpy = spyOn(window.URL, 'revokeObjectURL');
        const useDownloadLinkSpy = spyOn(service, 'useDownloadLink').and.returnValue(document.createElement('a'));
        service.downloadGameAsJson(mockGame);
        expect(createObjectUrlSpy).toHaveBeenCalledWith(mockBlob);
        expect(useDownloadLinkSpy).toHaveBeenCalled();
        expect(revokeObjectSpy).toHaveBeenCalled();
    });
});

const mockGame: Game = {
    id: 'mock',
    title: 'mock',
    description: 'mock',
    lastModification: 'mock',
    duration: 1,
    isVisible: true,
    questions: [],
};
