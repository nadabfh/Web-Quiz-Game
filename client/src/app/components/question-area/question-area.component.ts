import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { WarningMessage } from '@app/constants/feedback-messages';
import { MatchContext } from '@app/constants/states';
import { CanDeactivateType } from '@app/interfaces/can-component-deactivate';
import { AnswerService } from '@app/services/answer/answer.service';
import { AudioPlayerService } from '@app/services/audio-player/audio-player.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { TimeService } from '@app/services/time/time.service';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { QuestionType } from '@common/constants/question-types';
import { Subject } from 'rxjs';
import { AlertComponent } from '@app/components/alert/alert.component';
@Component({
    selector: 'app-question-area',
    templateUrl: './question-area.component.html',
    styleUrls: ['./question-area.component.scss'],
})
export class QuestionAreaComponent implements OnInit {
    @ViewChild('panicAlert') panicAlert: AlertComponent;

    gameDuration: number;
    context: MatchContext;
    isFirstQuestion: boolean = true;

    // Allow more constructor parameters to decouple services
    // eslint-disable-next-line max-params
    constructor(
        public matchRoomService: MatchRoomService,
        public timeService: TimeService,
        public answerService: AnswerService,
        public audioService: AudioPlayerService,
        public router: Router,
        private readonly matchContextService: MatchContextService,
        private readonly notificationService: NotificationService,
    ) {}

    get time() {
        return this.timeService.time;
    }

    get currentQuestion() {
        return this.matchRoomService.currentQuestion;
    }

    get answerOptions(): typeof AnswerCorrectness {
        return AnswerCorrectness;
    }

    get matchContext(): typeof MatchContext {
        return MatchContext;
    }

    get questionType(): typeof QuestionType {
        return QuestionType;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (document?.activeElement?.id === 'chat-input') return;

        if (event.key === 'Enter' && this.answerService.isSelectionEnabled) {
            this.submitAnswers();
            return;
        }
    }

    canDeactivate(): CanDeactivateType {
        if (this.matchRoomService.isResults) return true;
        if (this.matchRoomService.isQuitting) return true;
        if (this.matchContextService.getContext() === MatchContext.TestPage) {
            this.matchRoomService.isQuitting = true;
            this.matchRoomService.disconnect();
            return true;
        }
        if (!this.matchRoomService.isHostPlaying) return true;

        const deactivateSubject = new Subject<boolean>();
        this.notificationService.openWarningDialog(WarningMessage.QUIT).subscribe((confirm: boolean) => {
            deactivateSubject.next(confirm);
            if (confirm) {
                this.matchRoomService.isQuitting = true;
                this.matchRoomService.disconnect();
            }
        });
        return deactivateSubject;
    }

    ngOnInit(): void {
        this.resetStateForNewQuestion();
        this.listenToGameEvents();
        this.matchRoomService.isQuitting = false;
        this.answerService.playerScore = 0;
        this.context = this.matchContextService.getContext();
        if (this.isFirstQuestion) {
            this.isFirstQuestion = false;
        }
    }

    submitAnswers(): void {
        this.answerService.submitAnswer({ username: this.matchRoomService.getUsername(), roomCode: this.matchRoomService.getRoomCode() });
    }

    goToNextQuestion() {
        this.matchRoomService.goToNextQuestion();
        this.answerService.isNextQuestionButtonEnabled = false;
    }

    routeToResultsPage() {
        this.matchRoomService.routeToResultsPage();
    }

    quitGame() {
        this.router.navigateByUrl('/home');
    }

    triggerPanicTimer() {
        const roomCode = this.matchRoomService.getRoomCode();
        this.timeService.triggerPanicTimer(roomCode);
    }

    pauseTimer() {
        this.timeService.pauseTimer(this.matchRoomService.getRoomCode());
    }

    private listenToGameEvents() {
        this.timeService.listenToTimerEvents();
        this.answerService.listenToAnswerEvents();
        this.audioService.onPanicTimer();
    }

    private resetStateForNewQuestion(): void {
        this.answerService.resetStateForNewQuestion();
    }
}
