/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Question } from '@app/interfaces/question';
import { QuestionService } from '@app/services/question/question.service';
import { AdminQuestionBankComponent } from './admin-question-bank.component';

import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QuestionListItemComponent } from '@app/components/question-list-item/question-list-item.component';
import { getMockQuestion } from '@app/constants/question-mocks';
import { ManagementState } from '@app/constants/states';
import { FilterByQuestionTypePipe } from '@app/pipes/filter-by-question-type.pipe';
import { SortByLastModificationPipe } from '@app/pipes/sort-by-last-modification.pipe';
import { BankService } from '@app/services/bank/bank.service';
import { of } from 'rxjs';

describe('AdminQuestionBankComponent', () => {
    let component: AdminQuestionBankComponent;
    let fixture: ComponentFixture<AdminQuestionBankComponent>;
    let questionSpy: jasmine.SpyObj<QuestionService>;
    let bankSpy: jasmine.SpyObj<BankService>;
    let dialog: jasmine.SpyObj<MatDialog>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any, any>>;

    const mockQuestions: Question[] = [
        {
            id: '1',
            type: 'QCM',
            text: 'Combien de motifs blancs et noirs y a-t-il respectivement sur un ballon de soccer?',
            points: 20,
            lastModification: '2024-11-13T20:20:39+00:00',
        },
        {
            id: '2',
            type: 'QCM',
            text: "Le ratio d'or est de 1:1.618, mais connaissez-vous le ratio d'argent?",
            points: 40,
            lastModification: '2018-01-20T14:17:39+00:00',
        },
    ];

    const newQuestionMock: Question = {
        id: 'X',
        type: 'QCM',
        text: 'Quelle est la capitale du canada?',
        points: 20,
        lastModification: '2024-01-26T14:21:19+00:00',
    };
    const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(newQuestionMock) });
    @Component({
        selector: 'app-question-creation-form',
        template: '',
    })
    class MockCreateQuestionComponent {
        @Input() modificationState: ManagementState;
        @Input() question: Question;
        @Output() createQuestionEvent: EventEmitter<Question> = new EventEmitter<Question>();
        mockEmit() {
            this.createQuestionEvent.emit(newQuestionMock);
        }
    }

    beforeEach(() => {
        questionSpy = jasmine.createSpyObj('QuestionService', [
            'getAllQuestions',
            'deleteQuestion',
            'createQuestion',
            'updateQuestion',
            'openCreateQuestionModal',
        ]);
        questionSpy.getAllQuestions.and.returnValue(of(mockQuestions));
        questionSpy.deleteQuestion.and.returnValue(of(mockHttpResponse));
        questionSpy.createQuestion.and.returnValue(of(mockHttpResponse));

        bankSpy = jasmine.createSpyObj('BankService', ['getAllQuestions', 'deleteQuestion', 'addQuestion', 'updateQuestion']);

        const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        TestBed.configureTestingModule({
            declarations: [
                AdminQuestionBankComponent,
                SortByLastModificationPipe,
                QuestionListItemComponent,
                MockCreateQuestionComponent,
                FilterByQuestionTypePipe,
            ],
            imports: [MatButtonToggleModule, MatExpansionModule, MatIconModule, BrowserAnimationsModule, MatCardModule],
            providers: [
                { provide: QuestionService, useValue: questionSpy },
                { provide: BankService, useValue: bankSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        });

        fixture = TestBed.createComponent(AdminQuestionBankComponent);
        component = fixture.componentInstance;
        bankSpy.questions = [];
        dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        mockDialogRef = dialogRefSpy as jasmine.SpyObj<MatDialogRef<any, any>>;
        dialog.open.and.returnValue(mockDialogRef);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display a message when bank is empty', () => {
        bankSpy.questions = [];
        fixture.detectChanges();
        const dom = fixture.nativeElement;
        const emptyBankCard = dom.querySelector('.empty-list-card');
        expect(emptyBankCard).toBeTruthy();
    });

    it('should not display the empty bank message when not empty', () => {
        bankSpy.questions = mockQuestions;
        fixture.detectChanges();
        const dom = fixture.nativeElement;
        const emptyBankCard = dom.querySelector('.empty-bank-card');
        expect(emptyBankCard).toBeFalsy();
    });

    it('deleteQuestion should delete the question using the bank service', () => {
        component.deleteQuestion('');
        expect(bankSpy.deleteQuestion).toHaveBeenCalled();
    });

    it('addQuestion() should add the question using the bank service', () => {
        component.addQuestion();
        expect(bankSpy.addQuestion).toHaveBeenCalled();
    });

    it('updateQuestion() should update the question using the bank service and then close the accordion', () => {
        const mockAccordion: jasmine.SpyObj<MatAccordion> = jasmine.createSpyObj('MatAccordion', ['closeAll']);
        component.accordion = mockAccordion;
        component.updateQuestion(newQuestionMock);
        expect(bankSpy.updateQuestion).toHaveBeenCalled();
        expect(mockAccordion.closeAll).toHaveBeenCalled();
    });

    it('openDialog() should not open a dialog if dialogState is true', () => {
        component.dialogState = true;
        component.openDialog();
        expect(questionSpy.openCreateQuestionModal).not.toHaveBeenCalled();
    });

    it('openDialog() should open a dialog if dialogState is false', () => {
        const spyHandleDialog = spyOn(component, 'handleDialog');

        component.dialogState = false;
        questionSpy.openCreateQuestionModal.and.returnValue(mockDialogRef);
        const mock = new MockCreateQuestionComponent();
        mockDialogRef.componentInstance = mock;
        component.openDialog();
        mock.mockEmit();
        expect(questionSpy.openCreateQuestionModal).toHaveBeenCalled();
        expect(spyHandleDialog).toHaveBeenCalled();
    });

    it('handleDialog() should add question if applicable and close dialog', () => {
        const spyAdd = spyOn(component, 'addQuestion');
        const mockQuestion = getMockQuestion();
        component.handleDialog(mockQuestion, mockDialogRef);
        expect(spyAdd).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(component.dialogState).toBeFalsy();
    });
});
