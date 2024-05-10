// www.kirilv.com/canvas-confetti/
import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';
import { ConfettiOptions } from '@common/constants/confetti-options';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';

@Injectable({
    providedIn: 'root',
})
export class ConfettiService {
    private confetti = confetti;

    constructor(public socketService: SocketHandlerService) {}

    onWinner(): void {
        this.socketService.on('winner', () => {
            this.startWinnerConfetti();
        });
    }

    shootConfetti(): void {
        this.confetti({
            angle: this.randomInRange(ConfettiOptions.MIN_CONFETTI_ANGLE, ConfettiOptions.MAX_CONFETTI_ANGLE),
            spread: this.randomInRange(ConfettiOptions.MIN_CONFETTI_SPREAD, ConfettiOptions.MAX_CONFETTI_SPREAD),
            particleCount: this.randomInRange(ConfettiOptions.MIN_CONFETTI_PARTICLE_COUNT, ConfettiOptions.MAX_CONFETTI_PARTICLE_COUNT),
        });
    }

    startWinnerConfetti(): void {
        let count = 0;
        this.shootConfetti();
        const interval = setInterval(() => {
            if (++count < ConfettiOptions.WINNER_CONFETTI_COUNT) this.shootConfetti();
            else clearInterval(interval);
        }, ConfettiOptions.WINNER_CONFETTI_DELAY);
    }

    private randomInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
}
