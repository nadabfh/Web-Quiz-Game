// To let the tests run without errors, mock classes are needed
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { QuestionListItemComponent } from './question-list-item.component';

describe('QuestionListItemComponent', () => {
    let component: QuestionListItemComponent;
    let fixture: ComponentFixture<QuestionListItemComponent>;
    const mockQuestion: Question = {
        id: '1',
        type: 'QCM',
        text: 'Combien de motifs blancs et noirs y a-t-il respectivement sur un ballon de soccer?',
        points: 20,
        lastModification: new Date().toString(),
    };

    @Component({
        // Angular Material Mock: Provided selector does not start by app
        // eslint-disable-next-line @angular-eslint/component-selector
        selector: 'mat-label',
        template: '',
    })
    class MockMatLabelComponent {}
    @Component({
        selector: 'app-question-creation-form',
    })
    class MockQuestionCreationFormComponent {
        @Input() modificationState: ManagementState;
        @Input() question: Question;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [MockQuestionCreationFormComponent, QuestionListItemComponent, MockMatLabelComponent],
            imports: [MatSnackBarModule, MatExpansionModule, MatIconModule, NoopAnimationsModule, MatSelectModule],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionListItemComponent);
        component = fixture.componentInstance;
        component.question = mockQuestion;
        component.isBankQuestion = true;
        component.index = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should display question details', () => {
        fixture.detectChanges();
        const dom = fixture.nativeElement;
        expect(dom.textContent).toContain(mockQuestion.text);
        expect(dom.textContent).toContain(mockQuestion.points);
    });
    it('should emit deleteQuestionEvent when deleteQuestion is called', () => {
        const spy = spyOn(component.deleteQuestionEvent, 'emit').and.callThrough();
        component.deleteQuestion();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(mockQuestion.id);
    });
    it('should emit updateQuestionEvent when dispatchQuestion is called', () => {
        const spy = spyOn(component.updateQuestionEvent, 'emit').and.callThrough();
        component.dispatchModifiedQuestion();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(mockQuestion);
    });
    it('should set modificationState to BankModify if it is a bank question', () => {
        component.isBankQuestion = true;
        component.ngOnInit();
        expect(component.modificationState).toBe(ManagementState.BankModify);
    });
    it('should set modificationState to GameModify if it is not a bank question', () => {
        component.isBankQuestion = false;
        component.ngOnInit();
        expect(component.modificationState).toBe(ManagementState.GameModify);
    });
});
