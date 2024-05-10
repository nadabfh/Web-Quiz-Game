import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { QuestionListItemComponent } from '@app/components/question-list-item/question-list-item.component';
import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { DialogManagement, QuestionCreationFormComponent } from './question-creation-form.component';
import { QuestionService } from '@app/services/question/question.service';
import { QuestionType } from '@common/constants/question-types';
import { BankService } from '@app/services/bank/bank.service';
import { forwardRef } from '@angular/core';

const mockQuestion: Question = {
    id: '1',
    text: 'Test Question',
    points: 10,
    type: 'QCM',
    choices: [
        { text: 'Choice 1', isCorrect: true },
        { text: 'Choice 2', isCorrect: false },
    ],
    lastModification: '',
};

const maxchoicesLengthTest = 5;
const minchoicesLengthTest = 3;

describe('QuestionCreationFormComponent', () => {
    let component: QuestionCreationFormComponent;
    let fixture: ComponentFixture<QuestionCreationFormComponent>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let bankServiceSpy: jasmine.SpyObj<BankService>;
    let formBuilder: FormBuilder;
    const dialogData: DialogManagement = { modificationState: ManagementState.GameCreate };

    beforeEach(() => {
        const snackBarSpyObj = jasmine.createSpyObj('MatSnackBar', ['open']);
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['validateChoicesLength']);
        bankServiceSpy = jasmine.createSpyObj('QuestionService', ['addQuestion']);

        TestBed.configureTestingModule({
            declarations: [QuestionCreationFormComponent, QuestionListItemComponent],
            imports: [
                ReactiveFormsModule,
                FormsModule,
                MatSnackBarModule,
                MatSelectModule,
                MatOptionModule,
                MatFormFieldModule,
                MatInputModule,
                NoopAnimationsModule,
                MatIconModule,
            ],
            providers: [
                { provide: MatSnackBar, useValue: snackBarSpyObj },
                FormBuilder,
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: BankService, useValue: bankServiceSpy },
                {
                    provide: NG_VALUE_ACCESSOR,
                    useExisting: forwardRef(() => 'bankToggle'),
                    multi: true,
                },
            ],
        }).compileComponents();

        snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
        fixture = TestBed.createComponent(QuestionCreationFormComponent);
        formBuilder = TestBed.inject(FormBuilder);
        component = fixture.componentInstance;
        component.question = mockQuestion;
        fixture.detectChanges();
        component.dialogData = dialogData;
        component.questionForm.setValue({
            text: 'Test',
            points: 10,
            type: 'QCM',
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the form correctly', () => {
        expect(component.questionForm).toBeDefined();
        expect(component.questionForm.get('text')).toBeTruthy();
        expect(component.questionForm.get('type')).toBeTruthy();
        expect(component.questionForm.get('points')).toBeTruthy();
        expect(component.questionForm.get('choices')).toBeTruthy();
    });

    it('should update question choices when form value changes', () => {
        component.question = mockQuestion;
        component.modifyingForm = true;

        component.ngOnInit();

        component.questionForm.patchValue({
            text: 'New Test',
            points: 10,
            type: 'QCM',
            choices: [
                { text: 'New Choice 1', isCorrect: false },
                { text: 'New Choice 2', isCorrect: true },
            ],
        });
        component.question.lastModification = '2024-01-26T14:21:19+00:00';
        component.questionForm.value.id = '1';
        component.questionForm.value.lastModification = '2024-01-26T14:21:19+00:00';
        expect(component.question).toEqual(component.questionForm.value);
    });

    it('should remove choices control when question type is QRL', () => {
        component.questionForm.patchValue({
            text: 'Test question',
            points: 10,
            type: QuestionType.LongAnswer,
        });
        expect(component.questionForm.contains('choices')).toBeFalse();
    });

    it('should submit the form to create a question in the question list', () => {
        spyOn(component.createQuestionEvent, 'emit');
        component.onSubmit();
        expect(component.createQuestionEvent.emit).toHaveBeenCalled();
    });

    it('should submit the form to create a question in the bank', () => {
        spyOn(component.createQuestionEvent, 'emit');
        const mockQuestionSubmit: Question = component.questionForm.value;
        mockQuestion.lastModification = '';
        component.onSubmit();
        expect(component.createQuestionEvent.emit).toHaveBeenCalledWith(mockQuestionSubmit);
    });

    it('should submit the form to modify a question if state is ModifyBank', () => {
        component.modificationState = ManagementState.BankModify;
        spyOn(component.modifyQuestionEvent, 'emit');
        const mockQuestionSubmit: Question = component.questionForm.value;
        mockQuestion.lastModification = '';
        component.onSubmit();
        expect(component.modifyQuestionEvent.emit).toHaveBeenCalledWith(mockQuestionSubmit);
    });

    it('should create copy of question in the bank if toggled', () => {
        spyOn(component.modifyQuestionEvent, 'emit');

        bankServiceSpy.addToBank = false;
        component.modificationState = ManagementState.GameModify;
        component.onSubmit();
        bankServiceSpy.addToBank = true;
        component.onSubmit();

        expect(bankServiceSpy.addQuestion).toHaveBeenCalledTimes(1);
    });

    it('should update form values when ngOnChanges is called', () => {
        spyOn(component, 'ngOnChanges').and.callThrough();
        const changedQuestion = {
            id: '1',
            text: 'Test Updates',
            points: 20,
            type: 'QCM',
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
            lastModification: '2024-01-26T14:21:19+00:00',
        };
        component.question = changedQuestion;
        component.ngOnChanges({
            question: { currentValue: changedQuestion, previousValue: null, isFirstChange: () => true, firstChange: true },
        });
        component.onSubmit();
        component.questionForm.value.lastModification = '2024-01-26T14:21:19+00:00';
        component.questionForm.value.id = '1';
        expect(component.questionForm.value).toEqual(changedQuestion);
    });

    it('should not submit an invalid form', () => {
        spyOn(component.createQuestionEvent, 'emit');
        component.questionForm.setValue({
            text: '',
            points: 10,
            type: 'QCM',
            choices: [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: true },
            ],
        });
        component.onSubmit();
        expect(component.createQuestionEvent.emit).not.toHaveBeenCalled();
    });

    it('should add a choice to form', () => {
        const initialChoicesLength = component.choices.length;
        component.addChoice();
        expect(component.choices.length).toBe(initialChoicesLength + 1);
    });

    it('should remove a choice from form', () => {
        component.addChoice();
        const initialChoicesLength = component.choices.length;
        component.removeChoice(0);
        expect(component.choices.length).toBe(initialChoicesLength - 1);
    });

    it('should open snack bar with the specified message : General case', () => {
        component.openSnackBar('Test message');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Test message', undefined, { duration: 0 });
    });

    it('should not remove more than 2 choices', () => {
        for (let i = 0; i < minchoicesLengthTest; i++) {
            component.removeChoice(i);
        }
        expect(snackBarSpy.open).toHaveBeenCalled();
    });

    it('should not remove more than 2 choices', () => {
        for (let i = 0; i < maxchoicesLengthTest; i++) {
            component.addChoice();
        }
        expect(snackBarSpy.open).toHaveBeenCalled();
    });

    it('should set modificationState if dialogData is provided', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.modificationState).toBe(ManagementState.GameCreate);
    });

    it('should return the correct button text for BankCreate state', () => {
        component.modificationState = ManagementState.BankCreate;
        expect(component.getButtonText()).toBe('Ajouter la question à la banque');
    });

    it('should return the correct button text for GameCreate state', () => {
        component.modificationState = ManagementState.GameCreate;
        expect(component.getButtonText()).toBe('Vérifier si la question est valide');
    });

    it('should return the correct button text for BankModify state', () => {
        component.modificationState = ManagementState.BankModify;
        expect(component.getButtonText()).toBe('Modifier la question');
    });

    it('should return an empty string for an GameModify state', () => {
        component.modificationState = ManagementState.GameModify;
        expect(component.getButtonText()).toBe('Modifier la question');
    });

    it('should handle drag and drop event', () => {
        component.questionForm.setControl(
            'choices',
            formBuilder.array([
                formBuilder.group({
                    text: 'Choice 1',
                    isCorrect: true,
                }),
                formBuilder.group({
                    text: 'Choice 2',
                    isCorrect: false,
                }),
            ]),
        );

        component.question = mockQuestion;
        const mockEvent = {
            previousIndex: 1,
            currentIndex: 0,
            container: { data: component.questionForm.controls.value },
            previousContainer: { data: component.questionForm.controls.value },
        } as unknown as CdkDragDrop<QuestionCreationFormComponent>;

        fixture.detectChanges();
        component.dropChoice(mockEvent);

        expect(component.questionForm.value.choices[0].text).toEqual('Choice 2');
        expect(component.questionForm.value.choices[1].text).toEqual('Choice 1');
        expect(component.question.choices).toEqual(component.questionForm.value.choices);
    });
});
