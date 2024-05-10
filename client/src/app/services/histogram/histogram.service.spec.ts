import { TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { Histogram, MultipleChoiceHistogram } from '@common/interfaces/histogram';
import { Socket } from 'socket.io-client';
import { HistogramService } from './histogram.service';
import SpyObj = jasmine.SpyObj;

class SocketHandlerServiceMock extends SocketHandlerService {
    // Override is required to not actually connect the socket
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('HistogramService', () => {
    let service: HistogramService;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;
    let router: SpyObj<Router>;

    beforeEach(() => {
        router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(router);
        socketSpy.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketHandlerService, useValue: socketSpy },
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(HistogramService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call currentHistogram', () => {
        const histogram: MultipleChoiceHistogram = {
            question: 'question',
            type: 'QCM',
            choiceTallies: [],
        };
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb({ histogram });
        });

        service.onCurrentHistogram();

        expect(onSpy).toHaveBeenCalled();
    });

    it('should call histogramHistory', () => {
        const histogram: Histogram[] = [];
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb({ histogram });
        });

        service.onHistogramHistory();

        expect(onSpy).toHaveBeenCalled();
    });
});
