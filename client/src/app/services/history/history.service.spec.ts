import { TestBed } from '@angular/core/testing';

import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MOCK_HISTORY } from '@app/constants/history-mocks';
import { of } from 'rxjs';
import { HistoryService } from './history.service';

const MOCK_HTTP_RESPONSE: HttpResponse<string> = new HttpResponse({ status: 204, statusText: 'NO_CONTENT' });

describe('HistoryService', () => {
    let service: HistoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(HistoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get all history items', () => {
        const spy = spyOn(service, 'getAll').and.returnValue(of(MOCK_HISTORY));
        service.getHistory();
        expect(spy).toHaveBeenCalled();
        expect(service.historyItems).toEqual(MOCK_HISTORY);
    });

    it('should be able to clear history', () => {
        const spy = spyOn(service, 'delete').and.returnValue(of(MOCK_HTTP_RESPONSE));
        service.historyItems = MOCK_HISTORY;
        service.deleteHistory();
        expect(spy).toHaveBeenCalled();
        expect(service.historyItems.length).toEqual(0);
    });
});
