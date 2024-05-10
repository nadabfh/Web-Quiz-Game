import { Injectable } from '@angular/core';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { TimerInfo } from '@common/interfaces/timer-info';
import { MULTIPLICATION_FACTOR, PANIC_ALERT_DELAY } from '@common/constants/match-constants';
import { TimerEvents } from '@common/events/timer.events';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    isTimerPaused: boolean;
    isPanicModeDisabled: boolean;
    isPanicking: boolean;
    isAlertDisplayed: boolean;
    alertSymbol: string;
    private counter: number;
    private initialValue: number;

    constructor(private readonly socketService: SocketHandlerService) {
        this.counter = 0;
        this.initialValue = 0;
        this.isPanicModeDisabled = false;
        this.isPanicking = false;
        this.isAlertDisplayed = false;
        this.isTimerPaused = false;
    }

    get time() {
        return this.counter;
    }

    get duration() {
        return this.initialValue;
    }

    set time(newTime: number) {
        this.counter = newTime;
    }

    listenToTimerEvents() {
        this.handleTimer();
        this.handleStopTimer();
        this.onPanicTimer();
        this.onPauseTimer();
        this.onResumeTimer();
        this.onDisablePanicTimer();
    }

    startTimer(roomCode: string, time: number): void {
        this.socketService.send(TimerEvents.StartTimer, { roomCode, time });
    }

    stopTimer(roomCode: string): void {
        this.socketService.send(TimerEvents.StopTimer, { roomCode });
    }

    pauseTimer(roomCode: string): void {
        this.socketService.send(TimerEvents.PauseTimer, roomCode);
    }

    triggerPanicTimer(roomCode: string): void {
        this.isPanicking = true;
        this.socketService.send(TimerEvents.PanicTimer, roomCode);
    }

    handleTimer(): void {
        this.socketService.on(TimerEvents.Timer, (timerInfo: TimerInfo) => {
            this.counter = timerInfo.currentTime;
            this.initialValue = timerInfo.duration;
        });
    }

    handleStopTimer(): void {
        this.socketService.on(TimerEvents.StopTimer, () => {
            this.isPanicking = false;
        });
    }

    onPanicTimer() {
        this.socketService.on(TimerEvents.PanicTimer, () => {
            this.alertSymbol = '❗';
            this.displayPanicAlert();
        });
    }

    onPauseTimer() {
        this.socketService.on(TimerEvents.PauseTimer, () => {
            this.alertSymbol = 'II';
            this.displayPanicAlert();
        });
    }

    onResumeTimer() {
        this.socketService.on(TimerEvents.ResumeTimer, () => {
            this.alertSymbol = '▶';
            this.displayPanicAlert();
        });
    }

    onDisablePanicTimer(): void {
        this.socketService.on(TimerEvents.DisablePanicTimer, () => {
            this.isPanicModeDisabled = true;
        });
    }

    computeTimerProgress(): number {
        return (this.time / this.duration) * MULTIPLICATION_FACTOR;
    }

    togglePauseStatus() {
        this.isTimerPaused = !this.isTimerPaused;
    }

    private displayPanicAlert() {
        this.isAlertDisplayed = true;
        setTimeout(() => {
            this.isAlertDisplayed = false;
        }, PANIC_ALERT_DELAY);
    }
}
