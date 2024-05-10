/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import spyObj = jasmine.SpyObj;
import { AudioPlayerService } from './audio-player.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { Router } from '@angular/router';

class SocketHandlerServiceMock extends SocketHandlerService {
    // Override connect() is required to not actually connect the socket
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    override connect() {}
}

describe('AudioPlayerService', () => {
    let service: AudioPlayerService;
    let notificationServiceSpy: spyObj<NotificationService>;
    let socketSpy: SocketHandlerServiceMock;
    let socketHelper: SocketTestHelper;
    let router: spyObj<Router>;
    let mockAudioElement: any;

    beforeEach(() => {
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage']);

        socketHelper = new SocketTestHelper();
        socketSpy = new SocketHandlerServiceMock(router);
        socketSpy.socket = socketHelper as unknown as Socket;

        mockAudioElement = jasmine.createSpyObj('HTMLAudioElement', ['play']);

        spyOn(window, 'Audio').and.returnValue(mockAudioElement);

        TestBed.configureTestingModule({
            providers: [
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: SocketHandlerService, useValue: socketSpy },
                { provide: Router, useValue: router },
            ],
        });
        service = TestBed.inject(AudioPlayerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onPanicTimer() should call playPanicSound when event is received', () => {
        const soundSpy = spyOn<any, any>(service, 'playPanicSound').and.returnValue({});
        // Any is required to simulate Function type in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onSpy = spyOn(socketSpy, 'on').and.callFake((event: string, cb: (param: any) => any) => {
            cb('');
        });
        service.onPanicTimer();
        socketHelper.peerSideEmit('panicTimer');
        expect(onSpy).toHaveBeenCalled();
        expect(soundSpy).toHaveBeenCalled();
    });

    it('playPanicSound() should play panic audio', () => {
        const setSoundSpy = spyOn<any, any>(service, 'setAudio').and.returnValue({});
        const playSoundSpy = spyOn<any, any>(service, 'playAudio').and.returnValue({});

        service['playPanicSound']();

        expect(setSoundSpy).toHaveBeenCalled();
        expect(playSoundSpy).toHaveBeenCalled();
    });

    it('setAudio() should set audio url', () => {
        const mockUrl = 'mockUrl';

        service['setAudio'](mockUrl);

        expect(service['audioObject'].src).toContain(mockUrl);
    });

    it('playAudio() should play audio', () => {
        mockAudioElement.play.and.returnValue(Promise.resolve());

        service['playAudio']();

        expect(mockAudioElement.play).toHaveBeenCalled();
    });

    it('should display error message if audio playback fails', async () => {
        mockAudioElement.play.and.returnValue(Promise.reject());

        await service['playAudio']();

        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalled();
    });
});
