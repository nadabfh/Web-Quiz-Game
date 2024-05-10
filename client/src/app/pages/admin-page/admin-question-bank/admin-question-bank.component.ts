import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { QuestionCreationFormComponent } from '@app/components/question-creation-form/question-creation-form.component';
import { TEMPLATE_QUESTION } from '@app/constants/question-creation';
import { ManagementState } from '@app/constants/states';
import { Question } from '@app/interfaces/question';
import { BankService } from '@app/services/bank/bank.service';
import { QuestionService } from '@app/services/question/question.service';

@Component({
    selector: 'app-admin-question-bank',
    templateUrl: './admin-question-bank.component.html',
    styleUrls: ['./admin-question-bank.component.scss'],
})
export class AdminQuestionBankComponent implements OnInit {
    @Output() createQuestionEventQuestionBank: EventEmitter<Question> = new EventEmitter<Question>();
    @Input() createNewQuestionButton: boolean = false;
    @Input() createNewQuestionToBankButton: boolean = false;

    @ViewChild(MatAccordion) accordion: MatAccordion;

    response: string = '';
    newQuestion: Question = TEMPLATE_QUESTION;
    dialogState: unknown;

    constructor(
        public dialog: MatDialog,
        public bankService: BankService,
        private readonly questionService: QuestionService,
    ) {}

    ngOnInit() {
        this.bankService.getAllQuestions();
    }

    deleteQuestion(questionId: string) {
        this.bankService.deleteQuestion(questionId);
    }

    addQuestion(newQuestion: Question = this.newQuestion) {
        this.bankService.addQuestion(newQuestion);
    }

    updateQuestion(newQuestion: Question) {
        this.bankService.updateQuestion(newQuestion);
        this.accordion.closeAll();
    }

    openDialog() {
        if (!this.dialogState) {
            const dialogRef = this.questionService.openCreateQuestionModal(ManagementState.BankCreate);
            dialogRef.componentInstance.createQuestionEvent.subscribe((newQuestion: Question) => {
                this.handleDialog(newQuestion, dialogRef);
            });
        }
    }

    handleDialog(newQuestion: Question, dialogRef: MatDialogRef<QuestionCreationFormComponent, unknown>) {
        if (newQuestion) {
            this.addQuestion(newQuestion);
            dialogRef.close();
        }
        this.dialogState = false;
    }
}
