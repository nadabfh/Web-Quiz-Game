import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WarningMessage } from '@app/constants/feedback-messages';
import { MatchContext } from '@app/constants/states';
import { CanDeactivateType } from '@app/interfaces/can-component-deactivate';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchService } from '@app/services/match/match.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { TimeService } from '@app/services/time/time.service';
import { HOST_USERNAME } from '@common/constants/match-constants';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-wait-page',
    templateUrl: './wait-page.component.html',
    styleUrls: ['./wait-page.component.scss'],
})
export class WaitPageComponent implements OnInit {
    isLocked: boolean;
    isHostPlaying: boolean;

    // permit more class parameters to decouple services
    // eslint-disable-next-line max-params
    constructor(
        public matchRoomService: MatchRoomService,
        public timeService: TimeService,
        public router: Router,
        public matchService: MatchService,
        private readonly matchContextService: MatchContextService,
        private readonly notificationService: NotificationService,
    ) {}

    get time() {
        return this.timeService.time;
    }

    get isHost() {
        return this.matchRoomService.getUsername() === 'Organisateur';
    }

    get currentGame() {
        return this.matchService.currentGame;
    }

    canDeactivate(): CanDeactivateType {
        if (this.matchRoomService.isQuitting) return true;
        if (!this.matchRoomService.isHostPlaying) return true;
        if (this.matchRoomService.isWaitOver) return true;
        if (this.matchRoomService.isBanned) return true;

        const deactivateSubject = new Subject<boolean>();
        this.notificationService.openWarningDialog(WarningMessage.QUIT).subscribe((confirm: boolean) => {
            deactivateSubject.next(confirm);
            if (confirm) {
                this.matchRoomService.disconnect();
            }
        });
        return deactivateSubject;
    }

    ngOnInit(): void {
        this.resetWaitPage();
        this.timeService.listenToTimerEvents();

        if (this.isHost) {
            this.matchRoomService.gameTitle = this.currentGame.title;
        } else {
            if (!this.matchContextService.getContext()) {
                this.matchContextService.setContext(MatchContext.PlayerView);
            }
        }
    }

    toggleLock() {
        this.matchRoomService.toggleLock();
    }

    banPlayerUsername(username: string) {
        if (username === HOST_USERNAME) return;
        this.matchRoomService.banUsername(username);
    }

    startMatch() {
        this.matchRoomService.startMatch();
    }

    quitGame() {
        this.router.navigateByUrl('/home');
    }

    private resetWaitPage() {
        this.isLocked = false;
        this.matchRoomService.isMatchStarted = false;
        this.matchRoomService.isHostPlaying = true;
        this.matchRoomService.isBanned = false;
        this.matchRoomService.isQuitting = false;
    }
}
