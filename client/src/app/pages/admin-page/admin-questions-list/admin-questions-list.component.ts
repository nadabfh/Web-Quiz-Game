import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameStatus, WarningMessage } from '@app/constants/feedback-messages';
import { ManagementState } from '@app/constants/states';
import { CanComponentDeactivate, CanDeactivateType } from '@app/interfaces/can-component-deactivate';
import { Question } from '@app/interfaces/question';
import { GameModificationService } from '@app/services/game-modification/game-modification.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { Subject } from 'rxjs';
@Component({
    selector: 'app-admin-questions-list',
    templateUrl: './admin-questions-list.component.html',
    styleUrls: ['./admin-questions-list.component.scss'],
})
export class AdminQuestionsListComponent implements OnInit, CanComponentDeactivate {
    @Output() createQuestionEvent: EventEmitter<Question> = new EventEmitter<Question>();
    @Output() createQuestionEventQuestionBank: EventEmitter<Question> = new EventEmitter<Question>();

    state: ManagementState;

    constructor(
        public gameModificationService: GameModificationService,
        private readonly notificationService: NotificationService,
        private readonly route: ActivatedRoute,
    ) {}

    get game() {
        return this.gameModificationService.game;
    }

    get managementState(): typeof ManagementState {
        return ManagementState;
    }

    canDeactivate(): CanDeactivateType {
        if (!this.gameModificationService.isPendingChanges) return true;

        const deactivateSubject = new Subject<boolean>();
        this.notificationService.openWarningDialog(WarningMessage.PENDING).subscribe((confirm: boolean) => deactivateSubject.next(confirm));
        return deactivateSubject;
    }

    ngOnInit() {
        this.getGameIdFromUrl();
    }

    private getGameIdFromUrl() {
        this.route.params.subscribe({
            next: (params) => {
                if (params.id) {
                    this.state = ManagementState.GameModify;
                    this.gameModificationService.setGame(params.id);
                } else {
                    this.state = ManagementState.GameCreate;
                    this.gameModificationService.setNewGame();
                }
            },
            error: (error: HttpErrorResponse) => {
                this.notificationService.displayErrorMessage(`${GameStatus.FAILURE}\n${error.message}`);
            },
        });
    }
}
