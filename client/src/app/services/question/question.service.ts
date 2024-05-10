import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, ValidationErrors } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogManagement, QuestionCreationFormComponent } from '@app/components/question-creation-form/question-creation-form.component';
import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { CommunicationService } from '@app/services/communication/communication.service';
import { Observable } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class QuestionService extends CommunicationService<Question> {
    constructor(
        public dialog: MatDialog,
        http: HttpClient,
    ) {
        super(http, 'questions');
    }

    getAllQuestions(): Observable<Question[]> {
        return this.getAll();
    }

    createQuestion(question: Question): Observable<HttpResponse<string>> {
        return this.add(question);
    }

    deleteQuestion(questionId: string): Observable<HttpResponse<string>> {
        return this.delete(questionId);
    }

    verifyQuestion(question: Question) {
        return this.add(question, 'validate-question');
    }

    updateQuestion(modifiedQuestion: Question) {
        return this.update(modifiedQuestion, modifiedQuestion.id);
    }

    openCreateQuestionModal(modificationState: ManagementState) {
        const manageConfig: MatDialogConfig<DialogManagement> = {
            data: {
                modificationState,
            },
            height: '50%',
            width: '100%',
        };
        return this.dialog.open(QuestionCreationFormComponent, manageConfig);
    }

    validateChoicesLength(control: AbstractControl): ValidationErrors | null {
        if (control.get('type')?.value !== 'QCM') return null;
        const choices = control.get('choices') as FormArray;
        let hasCorrect = false;
        let hasIncorrect = false;

        for (let i = 0; i < choices.length; i++) {
            const isCorrect = choices.at(i).get('isCorrect')?.value;

            if (isCorrect) {
                hasCorrect = true;
            } else if (!isCorrect) {
                hasIncorrect = true;
            }
        }

        if (hasCorrect && hasIncorrect) {
            return null;
        } else {
            return { invalidChoicesLength: true };
        }
    }
}
