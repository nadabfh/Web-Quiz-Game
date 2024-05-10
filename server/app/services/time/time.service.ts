import { ExpiredTimerEvents } from '@app/constants/expired-timer-events';
import { TimerDurationEvents } from '@app/constants/timer-events';
import { TimerEvents } from '@common/events/timer.events';
import { TimerInfo } from '@common/interfaces/timer-info';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server } from 'socket.io';

@Injectable()
export class TimeService {
    currentPanicThresholdTime: number;

    private tick: number;
    private roomIntervals: Map<string, NodeJS.Timeout>;
    private pausedRooms: Map<string, boolean>;
    private roomCounters: Map<string, number>;
    private roomDurations: Map<string, number>;
    private isPanicModeEnabled: boolean;

    constructor(private readonly eventEmitter: EventEmitter2) {
        this.roomCounters = new Map();
        this.roomIntervals = new Map();
        this.roomDurations = new Map();
        this.pausedRooms = new Map();
        this.tick = 1000;
    }

    getTime(roomId: string) {
        return this.roomCounters.get(roomId);
    }

    // passing event allows decoupling of timer service
    // eslint-disable-next-line max-params
    startInterval(server: Server, roomId: string, startValue: number, onTimerExpiredEvent: ExpiredTimerEvents) {
        let timerInfo: TimerInfo = { currentTime: startValue, duration: this.roomDurations.get(roomId) };
        this.roomIntervals.set(
            roomId,
            setInterval(() => {
                if (this.pausedRooms.get(roomId)) return;
                const currentTime = this.roomCounters.get(roomId);
                if (currentTime >= 0) {
                    timerInfo = { currentTime, duration: this.roomDurations.get(roomId) };
                    server.in(roomId).emit(TimerEvents.Timer, timerInfo);
                    this.eventEmitter.emit(TimerDurationEvents.Timer, roomId, timerInfo);
                    this.roomCounters.set(roomId, currentTime - 1);
                } else {
                    this.expireTimer(roomId, server, onTimerExpiredEvent);
                }
                if (!this.isPanicModeEnabled) return;
                if (currentTime > 0 && currentTime <= this.currentPanicThresholdTime) this.disablePanicTimer(server, roomId);
            }, this.tick),
        );
    }

    // passing event allows decoupling of timer service
    // eslint-disable-next-line max-params
    startTimer(server: Server, roomId: string, startValue: number, onTimerExpiredEvent: ExpiredTimerEvents) {
        if (this.roomIntervals.has(roomId) && !this.pausedRooms.get(roomId)) return;
        const timerInfo: TimerInfo = { currentTime: startValue, duration: startValue };
        this.tick = 1000;

        this.isPanicModeEnabled = true;
        if (startValue <= this.currentPanicThresholdTime) this.disablePanicTimer(server, roomId);

        server.in(roomId).emit(TimerEvents.Timer, timerInfo);

        this.roomDurations.set(roomId, startValue);
        this.roomCounters.set(roomId, startValue - 1);
        this.pausedRooms.set(roomId, false);
        this.startInterval(server, roomId, startValue, onTimerExpiredEvent);
    }

    startPanicTimer(server: Server, roomId: string) {
        clearInterval(this.roomIntervals.get(roomId));
        this.tick = 250;
        this.startInterval(server, roomId, this.roomCounters.get(roomId), ExpiredTimerEvents.QuestionTimerExpired);
        server.to(roomId).emit(TimerEvents.PanicTimer);
    }

    expireTimer(roomId: string, server: Server, onTimerExpiredEvent: ExpiredTimerEvents) {
        this.terminateTimer(roomId);
        server.to(roomId).emit(TimerEvents.StopTimer);
        this.eventEmitter.emit(onTimerExpiredEvent, roomId);
    }

    pauseTimer(server: Server, roomId: string) {
        if (this.pausedRooms.get(roomId)) {
            this.pausedRooms.set(roomId, false);
            server.to(roomId).emit(TimerEvents.ResumeTimer);
        } else {
            this.pausedRooms.set(roomId, true);
            server.to(roomId).emit(TimerEvents.PauseTimer);
        }
    }

    terminateTimer(roomId: string) {
        clearInterval(this.roomIntervals.get(roomId));
        this.roomIntervals.delete(roomId);
        this.roomCounters.delete(roomId);
    }

    private disablePanicTimer(server: Server, roomId: string) {
        this.isPanicModeEnabled = false;
        server.in(roomId).emit(TimerEvents.DisablePanicTimer);
    }
}
