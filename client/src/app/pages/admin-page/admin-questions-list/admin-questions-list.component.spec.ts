/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { SortByLastModificationPipe } from '@app/pipes/sort-by-last-modification.pipe';
import { NotificationService } from '@app/services/notification/notification.service';
import { AdminQuestionsListComponent } from './admin-questions-list.component';
import { QuestionListItemComponent } from '@app/components/question-list-item/question-list-item.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameModificationService } from '@app/services/game-modification/game-modification.service';
import { getMockGame } from '@app/constants/game-mocks';
import { getMockQuestion } from '@app/constants/question-mocks';
import { Subject, of, throwError } from 'rxjs';
import { GameStatus, WarningMessage } from '@app/constants/feedback-messages';

describe('AdminQuestionsListComponent', () => {
    let component: AdminQuestionsListComponent;
    let fixture: ComponentFixture<AdminQuestionsListComponent>;

    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let gameModificationSpy: jasmine.SpyObj<GameModificationService>;

    @Component({
        selector: 'app-question-creation-form',
        template: '',
    })
    class MockCreateQuestionComponent {
        @Input() modificationState: ManagementState;
        @Input() question: Question;
        @Output() createQuestionEvent: EventEmitter<Question> = new EventEmitter<Question>();
    }

    @Component({
        selector: 'app-short-question',
        template: '',
    })
    class MockShortQuestionComponent {
        @Input() question: Question;
    }

    beforeEach(() => {
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['params', 'data', 'navigate']);
        activatedRouteSpy.params = of({ id: '1' });

        notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'openWarningDialog',
            'displayErrorMessage',
            'displaySuccessMessage',
            'confirmBankUpload',
        ]);

        gameModificationSpy = jasmine.createSpyObj('GameModificationService', ['setGame', 'setNewGame']);

        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                MatDialogModule,
                RouterTestingModule,
                MatIconModule,
                MatCardModule,
                MatExpansionModule,
                MatFormFieldModule,
                MatInputModule,
                BrowserAnimationsModule,
                DragDropModule,
                ReactiveFormsModule,
                MatSidenavModule,
                ScrollingModule,
                MatSliderModule,
            ],
            declarations: [
                AdminQuestionsListComponent,
                SortByLastModificationPipe,
                MockCreateQuestionComponent,
                QuestionListItemComponent,
                MockShortQuestionComponent,
            ],
            providers: [
                { provide: MatSnackBar, useValue: {} },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: GameModificationService, useValue: gameModificationSpy },
            ],
        }).compileComponents();

        gameModificationSpy.gameForm = new FormGroup({
            title: new FormControl(''),
            description: new FormControl(''),
            duration: new FormControl('10'),
        });
        gameModificationSpy.gameForm.setValue({ title: 'Test', description: 'Test', duration: '10' });
        gameModificationSpy.game = JSON.parse(JSON.stringify(getMockGame()));
        gameModificationSpy.originalBankQuestions = [JSON.parse(JSON.stringify(getMockQuestion()))];
        gameModificationSpy.bankQuestions = [JSON.parse(JSON.stringify(getMockQuestion()))];

        fixture = TestBed.createComponent(AdminQuestionsListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return true when there are no pending changes', () => {
        gameModificationSpy.isPendingChanges = false;
        const result = component.canDeactivate();
        expect(result).toBeTrue();
    });

    it('should prompt user if they try to leave while there are pending changes and only deactivate if user confirms', () => {
        gameModificationSpy.isPendingChanges = true;
        const deactivateSubject = new Subject<boolean>();
        notificationServiceSpy.openWarningDialog.and.returnValue(deactivateSubject);
        const result = component.canDeactivate();
        deactivateSubject.next(true);
        expect(result instanceof Subject).toBeTrue();
        expect(notificationServiceSpy.openWarningDialog).toHaveBeenCalledWith(WarningMessage.PENDING);
    });

    it('should call openWarningDialog when there are pending changes', () => {
        gameModificationSpy.isPendingChanges = true;
        const confirmSubject = new Subject<boolean>();
        notificationServiceSpy.openWarningDialog.and.returnValue(confirmSubject);
        component.canDeactivate();
        expect(notificationServiceSpy.openWarningDialog).toHaveBeenCalledWith(WarningMessage.PENDING);
    });

    it('should set state to Modification and call setGame when game is to be modified', () => {
        activatedRouteSpy.params = of({ id: 'id' });
        component['getGameIdFromUrl']();
        expect(component.state).toEqual(ManagementState.GameModify);
        expect(gameModificationSpy.setGame).toHaveBeenCalledWith('id');
    });

    it('should set state to Creation and call setGame when game is to be created', () => {
        activatedRouteSpy.params = of({});
        component['getGameIdFromUrl']();
        expect(component.state).toEqual(ManagementState.GameCreate);
        expect(gameModificationSpy.setNewGame).toHaveBeenCalled();
    });

    it('should display error message on error', () => {
        const error = new HttpErrorResponse({ error: 'Test Error', status: 404 });
        activatedRouteSpy.params = throwError(() => error);
        component['getGameIdFromUrl']();
        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalledWith(`${GameStatus.FAILURE}\n${error.message}`);
    });
});
