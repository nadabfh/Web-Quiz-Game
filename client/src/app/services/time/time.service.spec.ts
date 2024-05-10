/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { Socket } from 'socket.io-client';
import { TimeService } from './time.service';
import SpyObj = jasmine.SpyObj;
import { TimerInfo } from '@common/interfaces/timer-info';
import { PANIC_ALERT_DELAY } from '@common/constants/match-constants';

class SocketHandlerServiceMock extends SocketHandlerService {
    override connect() {
        /* Do nothing */
    }
}

describe('TimeService', () => {
    let service: TimeService;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;
    let router: SpyObj<Router>;

    const FAKE_ROOM_ID = '1234';
    const TIME = 3;

    beforeEach(() => {
        router = jasmine.createSpyObj('Router', ['navigateByUrl']);
        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(router);
        socketSpy.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketHandlerService, useValue: socketSpy },
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(TimeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('it should set the time', () => {
        service['counter'] = 0;
        service.time = 10;
        expect(service['counter']).toEqual(10);
    });

    it('should emit startTimer event when startTimer() is called', () => {
        const spy = spyOn(socketSpy, 'send');
        service.startTimer(FAKE_ROOM_ID, TIME);
        expect(spy).toHaveBeenCalledWith('startTimer', { roomCode: FAKE_ROOM_ID, time: TIME });
    });

    it('should emit stopTimer event when stopTimer() is called', () => {
        const spy = spyOn(socketSpy, 'send');
        service.stopTimer(FAKE_ROOM_ID);
        expect(spy).toHaveBeenCalledWith('stopTimer', { roomCode: FAKE_ROOM_ID });
    });

    it('should emit pauseTimer event when pauseTimer() is called', () => {
        const spy = spyOn(socketSpy, 'send');
        service.pauseTimer(FAKE_ROOM_ID);
        expect(spy).toHaveBeenCalledWith('pauseTimer', FAKE_ROOM_ID);
    });

    it('should emit panicTimer event when panicTimer() is called', () => {
        const spy = spyOn(socketSpy, 'send');
        service.triggerPanicTimer(FAKE_ROOM_ID);
        expect(spy).toHaveBeenCalledWith('panicTimer', FAKE_ROOM_ID);
        expect(service.isPanicking).toBeTrue();
    });

    it('should detect timer event and update its time attribute', () => {
        const timerInfo: TimerInfo = { currentTime: 1, duration: 10 };
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(timerInfo);
        });
        service.handleTimer();
        socketHelper.peerSideEmit('timer', timerInfo);
        expect(service.time).toEqual(1);
        expect(spy).toHaveBeenCalledWith('timer', jasmine.any(Function));
    });

    it('should detect stopTimer event and stop the panic mode', () => {
        service.isPanicking = true;
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(true);
        });
        service.handleStopTimer();
        socketHelper.peerSideEmit('stopTimer');
        expect(spy).toHaveBeenCalledWith('stopTimer', jasmine.any(Function));
        expect(service.isPanicking).toBe(false);
    });

    it('should compute timer progress with computeTimerProgress() and return a percentage', () => {
        service['initialValue'] = 10;
        service.time = 5;
        const result = service.computeTimerProgress();
        expect(result).toEqual(50);
    });

    it('listenToTimerEvents() should listen to correct events', () => {
        const timerSpy = spyOn(service, 'handleTimer').and.returnValue();
        const stopTimeSpy = spyOn(service, 'handleStopTimer').and.returnValue();
        service.listenToTimerEvents();

        expect(timerSpy).toHaveBeenCalled();
        expect(stopTimeSpy).toHaveBeenCalled();
    });

    it('should detect panic timer event and display panic alert', () => {
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(true);
        });
        const displaySpy = spyOn<any, any>(service, 'displayPanicAlert').and.returnValue({});

        service.onPanicTimer();
        socketHelper.peerSideEmit('panicTimer');

        expect(spy).toHaveBeenCalledWith('panicTimer', jasmine.any(Function));
        expect(service.alertSymbol).toEqual('❗');
        expect(displaySpy).toHaveBeenCalled();
    });

    it('should detect pause timer event and display pause alert', () => {
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(true);
        });
        const displaySpy = spyOn<any, any>(service, 'displayPanicAlert').and.returnValue({});

        service.onPauseTimer();
        socketHelper.peerSideEmit('pauseTimer');

        expect(spy).toHaveBeenCalledWith('pauseTimer', jasmine.any(Function));
        expect(service.alertSymbol).toEqual('II');
        expect(displaySpy).toHaveBeenCalled();
    });

    it('should detect resume timer event and display resume alert', () => {
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(true);
        });
        const displaySpy = spyOn<any, any>(service, 'displayPanicAlert').and.returnValue({});

        service.onResumeTimer();
        socketHelper.peerSideEmit('resumeTimer');

        expect(spy).toHaveBeenCalledWith('resumeTimer', jasmine.any(Function));
        expect(service.alertSymbol).toEqual('▶');
        expect(displaySpy).toHaveBeenCalled();
    });

    it('should detect disable panic timer event and disable panic mode', () => {
        service.isPanicModeDisabled = false;
        const spy = spyOn(socketSpy, 'on').and.callFake((event: string, callback: (params: any) => any) => {
            callback(true);
        });

        service.onDisablePanicTimer();
        socketHelper.peerSideEmit('disablePanicTimer');

        expect(spy).toHaveBeenCalledWith('disablePanicTimer', jasmine.any(Function));
        expect(service.isPanicModeDisabled).toBeTrue();
    });

    it('should display panic alert and hide it after delay', fakeAsync(() => {
        const delay = PANIC_ALERT_DELAY;

        service['displayPanicAlert']();

        expect(service.isAlertDisplayed).toBeTrue();
        tick(delay - 1);
        expect(service.isAlertDisplayed).toBeTrue();
        tick(1);
        expect(service.isAlertDisplayed).toBeFalse();
    }));

    it('should toggle pause status', () => {
        service.isTimerPaused = false;
        service.togglePauseStatus();
        expect(service.isTimerPaused).toBeTrue();
        service.togglePauseStatus();
        expect(service.isTimerPaused).toBeFalse();
    });
});
