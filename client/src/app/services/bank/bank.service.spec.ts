/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QuestionListItemComponent } from '@app/components/question-list-item/question-list-item.component';
import { getMockQuestion } from '@app/constants/question-mocks';
import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { SortByLastModificationPipe } from '@app/pipes/sort-by-last-modification.pipe';
import { NotificationService } from '@app/services/notification/notification.service';
import { QuestionService } from '@app/services/question/question.service';
import { of, throwError } from 'rxjs';
import { BankService } from './bank.service';
import { GameStatus } from '@app/constants/feedback-messages';

describe('BankService', () => {
    let service: BankService;
    let questionSpy: jasmine.SpyObj<QuestionService>;
    let notificationSpy: jasmine.SpyObj<NotificationService>;

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
    }

    beforeEach(() => {
        questionSpy = jasmine.createSpyObj('QuestionService', [
            'getAllQuestions',
            'deleteQuestion',
            'createQuestion',
            'updateQuestion',
            'openCreateQuestionModal',
        ]);
        notificationSpy = jasmine.createSpyObj('NotificationService', ['displayErrorMessage', 'displaySuccessMessage']);
        questionSpy.getAllQuestions.and.returnValue(of(mockQuestions));
        questionSpy.deleteQuestion.and.returnValue(of(mockHttpResponse));
        questionSpy.createQuestion.and.returnValue(of(mockHttpResponse));

        TestBed.configureTestingModule({
            declarations: [SortByLastModificationPipe, QuestionListItemComponent, MockCreateQuestionComponent],
            imports: [MatExpansionModule, MatIconModule, BrowserAnimationsModule, MatCardModule],
            providers: [
                { provide: QuestionService, useValue: questionSpy },
                { provide: NotificationService, useValue: notificationSpy },
            ],
        });
        service = TestBed.inject(BankService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('should get all questions', () => {
        questionSpy.getAllQuestions.and.returnValue(of(mockQuestions));
        service.getAllQuestions();
        expect(service.questions.length).toEqual(mockQuestions.length);
    });

    it('should display error message if questions cannot be get', () => {
        questionSpy.getAllQuestions.and.returnValue(throwError(() => new HttpErrorResponse({ error: '' })));
        service.getAllQuestions();
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should delete a question', () => {
        const questionToDeleteId = '1';
        service.questions = mockQuestions;
        const expectedLength = mockQuestions.length - 1;
        service.deleteQuestion('1');
        expect(questionSpy.deleteQuestion).toHaveBeenCalledWith(questionToDeleteId);
        expect(service.questions.length).toBe(expectedLength);
    });

    it('should add a question', () => {
        service.questions = mockQuestions;
        const expectedLength = mockQuestions.length + 1;
        service.addQuestion(newQuestionMock);
        expect(questionSpy.createQuestion).toHaveBeenCalledWith(newQuestionMock);
        expect(service.questions.length).toBe(expectedLength);
    });

    it('should add a question coming from game management page', () => {
        service.questions = mockQuestions;
        const expectedLength = mockQuestions.length + 1;
        service.addQuestion(newQuestionMock, true);
        expect(questionSpy.createQuestion).toHaveBeenCalledWith(newQuestionMock);
        expect(notificationSpy.displaySuccessMessage).toHaveBeenCalledWith(GameStatus.ARCHIVED);
        expect(service.questions.length).toBe(expectedLength);
    });

    it('should return false when questionList is empty', () => {
        const newQuestion: Question = { id: '1', text: 'New question', type: 'QCM', points: 10, lastModification: '' };
        const questionList: Question[] = [];
        const result = service['isDuplicateQuestion'](newQuestion, questionList);
        expect(result).toBeFalse();
    });

    it('should return false when newQuestion is not already in bank', () => {
        const result = service['isDuplicateQuestion'](newQuestionMock, mockQuestions);
        expect(result).toBeFalse();
    });

    it('should return true when newQuestion is in questionList with different id', () => {
        const newQuestion: Question = {
            id: '3',
            text: "Le ratio d'or est de 1:1.618, mais connaissez-vous le ratio d'argent?",
            type: 'QCM',
            points: 10,
            lastModification: '',
        };
        const result = service['isDuplicateQuestion'](newQuestion, mockQuestions);
        expect(result).toBeTrue();
    });

    it('should return false when newQuestion is in questionList with the same id', () => {
        const result = service['isDuplicateQuestion'](mockQuestions[0], mockQuestions);
        expect(result).toBeFalse();
    });

    it('should handle error in deleteQuestion', () => {
        const errorMessage = 'Failed to delete question';
        questionSpy.deleteQuestion.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));

        service.deleteQuestion('123');

        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should update question successfully', () => {
        questionSpy.updateQuestion.and.returnValue(of(mockHttpResponse));
        service.updateQuestion(newQuestionMock);
        expect(notificationSpy.displaySuccessMessage).toHaveBeenCalled();
    });

    it('should handle error when updating question', () => {
        const errorMessage = 'Failed to update question';
        questionSpy.updateQuestion.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));
        service.updateQuestion(newQuestionMock);
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should handle error when adding question', () => {
        const errorMessage = 'Failed to update question';
        questionSpy.createQuestion.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));
        service.addQuestion(newQuestionMock);
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should handle duplicate question', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isDuplicateQuestion').and.returnValue(true);
        service.updateQuestion(newQuestionMock);
        expect(notificationSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should check if duplicate', () => {
        const question = getMockQuestion();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueResult = (service as any).isDuplicateQuestion(question, []);
        expect(uniqueResult).toBeFalsy();
        const newQuestion = getMockQuestion();
        newQuestion.text = question.text;
        newQuestion.id = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const duplicateResult = (service as any).isDuplicateQuestion(newQuestion, [question]);
        expect(duplicateResult).toBeTruthy();
    });
});
