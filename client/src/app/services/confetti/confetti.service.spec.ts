/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';

import { ConfettiService } from './confetti.service';
import { Router } from '@angular/router';
import spyObj = jasmine.SpyObj;
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { ConfettiOptions } from '@common/constants/confetti-options';
class SocketHandlerServiceMock extends SocketHandlerService {
    // Override connect() is required to not actually connect the socket
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    override connect() {}
}

describe('ConfettiService', () => {
    let service: ConfettiService;
    let routerSpy: spyObj<Router>;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(routerSpy);
        socketSpy.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            providers: [{ provide: SocketHandlerService, useValue: socketSpy }],
        });
        service = TestBed.inject(ConfettiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getWinner() should call startWinnerConfett after receiving winner event', () => {
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb('');
        });
        spyOn(service, 'startWinnerConfetti').and.returnValue();
        service.onWinner();
        socketHelper.peerSideEmit('winner');
        expect(onSpy).toHaveBeenCalled();
    });

    it('shootConfetti() should shoot confetti with random parameters', () => {
        const confettiSpy = spyOn<any>(service, 'confetti');

        service.shootConfetti();

        expect(confettiSpy).toHaveBeenCalledWith(
            jasmine.objectContaining({
                angle: jasmine.any(Number),
                spread: jasmine.any(Number),
                particleCount: jasmine.any(Number),
            }),
        );
    });

    it('should start winner confetti with correct interval', fakeAsync(() => {
        const shootConfettiSpy = spyOn(service, 'shootConfetti').and.returnValue();
        const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();

        service.startWinnerConfetti();

        let count;
        for (count = 0; count < ConfettiOptions.WINNER_CONFETTI_COUNT; count++) {
            tick(ConfettiOptions.WINNER_CONFETTI_DELAY);
        }
        expect(shootConfettiSpy).toHaveBeenCalledTimes(count);
        expect(clearIntervalSpy).toHaveBeenCalled();
    }));

    it('should generate random number within range', () => {
        spyOn(Math, 'random').and.returnValue(0.5);
        const min = 10;
        const max = 20;
        const result = service['randomInRange'](min, max);

        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
    });
});
