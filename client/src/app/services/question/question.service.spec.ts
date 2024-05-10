import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogManagement, QuestionCreationFormComponent } from '@app/components/question-creation-form/question-creation-form.component';
import { MatDialogMock } from '@app/constants/mat-dialog-mock';
import { Question } from '@app/interfaces/question';
import { of } from 'rxjs';
import { QuestionService } from './question.service';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { getMockQuestion } from '@app/constants/question-mocks';
import { QuestionType } from '@common/constants/question-types';

const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });

describe('QuestionService', () => {
    let questionService: QuestionService;
    let dialog: MatDialog;

    const mockQuestion: Question = {
        id: 'questionID',
        type: 'QCM',
        text: 'Question?',
        points: 30,
        choices: [],
        lastModification: new Date().toString(),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [QuestionService, { provide: MatDialog, useClass: MatDialogMock }],
        });

        questionService = TestBed.inject(QuestionService);
        dialog = TestBed.inject(MatDialog);
    });

    it('should be created', () => {
        expect(questionService).toBeTruthy();
    });

    it('should get all Questions', () => {
        const spy = spyOn(questionService, 'getAll').and.returnValue(of([mockQuestion]));
        questionService.getAllQuestions();
        expect(spy).toHaveBeenCalled();
    });

    it('should create a new question', () => {
        const spy = spyOn(questionService, 'add').and.returnValue(of(mockHttpResponse));
        questionService.createQuestion(mockQuestion);
        expect(spy).toHaveBeenCalledWith(mockQuestion);
    });

    it('should create a delete question', () => {
        const spy = spyOn(questionService, 'delete').and.returnValue(of(mockHttpResponse));
        questionService.deleteQuestion(mockQuestion.id);
        expect(spy).toHaveBeenCalledWith(mockQuestion.id);
    });

    it('should verify a new question', () => {
        const spy = spyOn(questionService, 'add').and.returnValue(of(mockHttpResponse));
        questionService.verifyQuestion(mockQuestion);
        expect(spy).toHaveBeenCalled();
    });

    it('should modify a question', () => {
        const spy = spyOn(questionService, 'update').and.returnValue(of(mockHttpResponse));
        questionService.updateQuestion(mockQuestion);
        expect(spy).toHaveBeenCalled();
    });

    it('should open a game creation dialog', () => {
        const manageConfig: MatDialogConfig<DialogManagement> = {
            data: {
                modificationState: 0,
            },
            height: '50%',
            width: '100%',
        };
        spyOn(dialog, 'open').and.callThrough();
        questionService.openCreateQuestionModal(0);
        expect(dialog.open).toHaveBeenCalledWith(QuestionCreationFormComponent, manageConfig);
    });

    it('validateChoicesLength() should validate the number of true and false choices in a question creation form (all choices are false) ', () => {
        const formGroup = new FormGroup({
            text: new FormControl(getMockQuestion().text),
            points: new FormControl(getMockQuestion().points),
            type: new FormControl(getMockQuestion().type),
            choices: new FormArray([
                new FormGroup({
                    text: new FormControl('Choice 1'),
                    isCorrect: new FormControl(false),
                }),
                new FormGroup({
                    text: new FormControl('Choice 2'),
                    isCorrect: new FormControl(false),
                }),
            ]),
        });

        const validationResult = questionService.validateChoicesLength(formGroup);

        expect(validationResult).toEqual({ invalidChoicesLength: true });
    });

    it('validateChoicesLength() should validate the number of true and false choices in a question creation form (all choices are true)', () => {
        const formGroup = new FormGroup({
            text: new FormControl(getMockQuestion().text),
            points: new FormControl(getMockQuestion().points),
            type: new FormControl(getMockQuestion().type),
            choices: new FormArray([
                new FormGroup({
                    text: new FormControl('choice 1'),
                    isCorrect: new FormControl(true),
                }),
                new FormGroup({
                    text: new FormControl('choice 2'),
                    isCorrect: new FormControl(true),
                }),
            ]),
        });

        const validationResult = questionService.validateChoicesLength(formGroup);

        expect(validationResult).toEqual({ invalidChoicesLength: true });
    });

    it('validateChoicesLength() should return null if the form has one wrong and one correct answer', () => {
        const formGroup = new FormGroup({
            text: new FormControl(getMockQuestion().text),
            points: new FormControl(getMockQuestion().points),
            type: new FormControl(getMockQuestion().type),
            choices: new FormArray([
                new FormGroup({
                    text: new FormControl('Choice 1'),
                    isCorrect: new FormControl(false),
                }),
                new FormGroup({
                    text: new FormControl('Choice 2'),
                    isCorrect: new FormControl(true),
                }),
            ]),
        });

        const validationResult = questionService.validateChoicesLength(formGroup);

        expect(validationResult).toEqual(null);
    });

    it('validateChoicesLength() should return null for QRL type', () => {
        const formGroup = new FormGroup({
            text: new FormControl(getMockQuestion().text),
            points: new FormControl(getMockQuestion().points),
            type: new FormControl(QuestionType.LongAnswer),
        });

        const validationResult = questionService.validateChoicesLength(formGroup);

        expect(validationResult).toEqual(null);
    });
});
