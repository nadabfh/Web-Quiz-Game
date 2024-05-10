import { Injectable } from '@angular/core';
import { PANIC_SOUND } from '@app/constants/sounds-sources';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { TimerEvents } from '@common/events/timer.events';

@Injectable({
    providedIn: 'root',
})
export class AudioPlayerService {
    isPoop: boolean;
    private audioObject: HTMLAudioElement = new Audio();
    constructor(
        private readonly socketService: SocketHandlerService,
        private readonly notificationService: NotificationService,
    ) {}

    onPanicTimer() {
        this.socketService.on(TimerEvents.PanicTimer, () => {
            this.playPanicSound();
        });
    }

    private playPanicSound() {
        this.setAudio(PANIC_SOUND);
        this.playAudio();
    }

    private setAudio(url: string) {
        this.audioObject.src = url;
    }

    private playAudio() {
        this.audioObject.play().catch(() => this.notificationService.displayErrorMessage('❗ MODE PANIQUE ACTIVÉ! ❗'));
    }
}
