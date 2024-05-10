import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BankStatus, GameStatus } from '@app/constants/feedback-messages';
import { Question } from '@app/interfaces/question';
import { NotificationService } from '@app/services/notification/notification.service';
import { QuestionService } from '@app/services/question/question.service';

@Injectable({
    providedIn: 'root',
})
export class BankService {
    questions: Question[] = [];
    addToBank: boolean = false;
    isLoadingBank: boolean = false;

    constructor(
        private readonly questionService: QuestionService,
        private readonly notificationService: NotificationService,
    ) {}

    getAllQuestions(): void {
        this.isLoadingBank = true;
        this.questionService.getAllQuestions().subscribe({
            next: (data: Question[]) => {
                this.questions = [...data];
                this.isLoadingBank = false;
            },
            error: (error: HttpErrorResponse) => this.notificationService.displayErrorMessage(`${BankStatus.UNRETRIEVED}\n ${error.message}`),
        });
    }

    deleteQuestion(questionId: string): void {
        this.questionService.deleteQuestion(questionId).subscribe({
            next: () => {
                this.questions = this.questions.filter((question: Question) => question.id !== questionId);
                this.notificationService.displaySuccessMessage(`${BankStatus.DELETED}`);
            },
            error: (error: HttpErrorResponse) => this.notificationService.displayErrorMessage(`${BankStatus.STILL}\n ${error.message}`),
        });
    }

    addQuestion(newQuestion: Question, isModificationPageQuestion: boolean = false): void {
        this.questionService.createQuestion(newQuestion).subscribe({
            next: (response: HttpResponse<string>) => {
                if (response.body) {
                    newQuestion = JSON.parse(response.body);
                    this.questions.push(newQuestion);
                    if (isModificationPageQuestion) this.notificationService.displaySuccessMessage(GameStatus.ARCHIVED);
                    else this.notificationService.displaySuccessMessage(BankStatus.SUCCESS);
                }
            },
            error: (error: HttpErrorResponse) => this.notificationService.displayErrorMessage(`${BankStatus.FAILURE}\n ${error.message}`),
        });
    }

    updateQuestion(newQuestion: Question): void {
        if (!this.isDuplicateQuestion(newQuestion, this.questions)) {
            this.questionService.updateQuestion(newQuestion).subscribe({
                next: () => {
                    this.notificationService.displaySuccessMessage(BankStatus.MODIFIED);
                },
                error: (error: HttpErrorResponse) => this.notificationService.displayErrorMessage(`${BankStatus.UNMODIFIED} \n ${error.message}`),
            });
        } else {
            this.notificationService.displayErrorMessage(BankStatus.DUPLICATE);
        }
    }

    private isDuplicateQuestion(newQuestion: Question, questionList: Question[]): boolean {
        return !!questionList.find((question) => question.text === newQuestion.text && question.id !== newQuestion.id);
    }
}
