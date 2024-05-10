/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { of, throwError } from 'rxjs';

import { GameService } from '@app/services/game/game.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { QuestionService } from '@app/services/question/question.service';

import { MatSnackBar } from '@angular/material/snack-bar';

import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BankStatus, QuestionStatus } from '@app/constants/feedback-messages';
import { getMockGame } from '@app/constants/game-mocks';
import { getMockQuestion } from '@app/constants/question-mocks';
import { ManagementState } from '@app/constants/states';
import { Game } from '@app/interfaces/game';
import { Question } from '@app/interfaces/question';
import { BankService } from '@app/services/bank/bank.service';
import { GameModificationService } from './game-modification.service';

describe('GameModificationService', () => {
    let service: GameModificationService;
    let mockGame: Game;

    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let bankServiceSpy: jasmine.SpyObj<BankService>;
    let routerSpy: jasmine.SpyObj<Router>;

    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any, any>>;

    const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(getMockQuestion()) });

    const mockQuestions: Question[] = [
        {
            id: '1',
            type: 'QCM',
            text: 'Combien de motifs blancs et noirs y a-t-il respectivement sur un ballon de soccer?',
            points: 20,
            lastModification: '2018-11-13T20:20:39+00:00',
        },
    ];

    const mockBankQuestions: Question[] = [
        {
            id: '1',
            type: 'QCM',
            text: 'Combien de motifs blancs et noirs y a-t-il respectivement sur un ballon de soccer?',
            points: 20,
            lastModification: '2018-11-13T20:20:39+00:00',
        },
        {
            id: '2',
            type: 'QCM',
            text: "Le ratio d'or est de 1:1.618, mais connaissez-vous le ratio d'argent?",
            points: 40,
            lastModification: '2024-01-20T14:17:39+00:00',
        },
    ];

    @Component({
        selector: 'app-question-creation-form',
        template: '',
    })
    class MockCreateQuestionComponent {
        @Input() modificationState: ManagementState;
        @Input() question: Question;
        @Output() createQuestionEvent: EventEmitter<Question> = new EventEmitter<Question>();
        mockEmit() {
            this.createQuestionEvent.emit(getMockQuestion());
        }
    }

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'openWarningDialog',
            'displayErrorMessage',
            'displaySuccessMessage',
            'confirmBankUpload',
        ]);

        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'getGames',
            'getGameById',
            'toggleGameVisibility',
            'deleteGame',
            'uploadGame',
            'downloadGameAsJson',
            'replaceGame',
            'submitGame',
            'displaySuccessMessage',
            'displayErrorMessage',
            'isPendingChangesObservable',
        ]);

        questionServiceSpy = jasmine.createSpyObj('QuestionService', [
            'getAllQuestions',
            'createQuestion',
            'verifyQuestion',
            'openCreateQuestionModal',
        ]);

        notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'openWarningDialog',
            'displayErrorMessage',
            'displaySuccessMessage',
            'confirmBankUpload',
        ]);

        bankServiceSpy = jasmine.createSpyObj('BankService', ['addQuestion']);

        questionServiceSpy.createQuestion.and.returnValue(of(mockHttpResponse));

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockDialogRef = dialogRefSpy as jasmine.SpyObj<MatDialogRef<any, any>>;

        TestBed.configureTestingModule({
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatSnackBar, useValue: {} },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: BankService, useValue: bankServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        service = TestBed.inject(GameModificationService);

        mockGame = getMockGame();
        service.game = mockGame;

        service.gameForm = new FormGroup({
            title: new FormControl(''),
            description: new FormControl(''),
            duration: new FormControl(''),
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should handle submit when state is modify', () => {
        const resetSpy = spyOn<any, any>(service, 'resetPendingChanges').and.returnValue({});
        service.state = ManagementState.GameModify;
        gameServiceSpy.submitGame.and.returnValue(of(mockHttpResponse));

        service.handleSubmit();

        expect(gameServiceSpy.submitGame).toHaveBeenCalled();
        expect(notificationServiceSpy.displaySuccessMessage).toHaveBeenCalledWith('Jeux modifié avec succès! 😺');
        expect(resetSpy).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/games/']);
    });

    it('should handle submit when state is create', () => {
        const resetSpy = spyOn<any, any>(service, 'resetPendingChanges').and.returnValue({});
        service.state = ManagementState.GameCreate;
        gameServiceSpy.submitGame.and.returnValue(of(mockHttpResponse));

        service.handleSubmit();

        expect(gameServiceSpy.submitGame).toHaveBeenCalled();
        expect(notificationServiceSpy.displaySuccessMessage).toHaveBeenCalledWith('Jeux créé avec succès! 😺');
        expect(resetSpy).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/games/']);
    });

    it('should handle modify submit error', () => {
        service.state = ManagementState.GameModify;
        const errorMessage = 'Error submitting game';
        gameServiceSpy.submitGame.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));

        service.handleSubmit();

        expect(gameServiceSpy.submitGame).toHaveBeenCalled();
        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should handle create submit error', () => {
        service.state = ManagementState.GameCreate;
        const errorMessage = 'Error submitting game';
        gameServiceSpy.submitGame.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));

        service.handleSubmit();

        expect(gameServiceSpy.submitGame).toHaveBeenCalled();
        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalled();
    });

    it('should set bank message to UNAVAILABLE when bankQuestions is empty', () => {
        service.bankQuestions = [];
        service['setBankMessage']();
        expect(service.currentBankMessage).toEqual(BankStatus.UNAVAILABLE);
    });

    it('should set bank message to AVAILABLE when bankQuestions is not empty', () => {
        service.bankQuestions = [getMockQuestion()];
        service['setBankMessage']();
        expect(service.currentBankMessage).toEqual(BankStatus.AVAILABLE);
    });

    it('should filter questions correctly', () => {
        const filteredQuestions = service['filterBankQuestions'](mockBankQuestions, mockQuestions);
        expect(filteredQuestions.length).toEqual(1);
        expect(filteredQuestions).toEqual([mockBankQuestions[1]]);
    });

    it('should return true if new question has a duplicate in the bank', () => {
        const isDuplicate = service['isDuplicateQuestion'](mockQuestions[0], mockBankQuestions);
        expect(isDuplicate).toBeTrue();
    });

    it('should return false if new question doesn not have a duplicate in the bank', () => {
        const isDuplicate = service['isDuplicateQuestion'](getMockQuestion(), mockBankQuestions);
        expect(isDuplicate).toBeFalse();
    });

    it('should mark pending changes', () => {
        service.isPendingChanges = false;
        service['markPendingChanges']();
        expect(service.isPendingChanges).toBeTrue();
    });

    it('should reset pending changes', () => {
        service.isPendingChanges = true;
        service['resetPendingChanges']();
        expect(service.isPendingChanges).toBeFalse();
    });

    it('openDialog() should open a dialog if dialogState is false', () => {
        const spyHandleDialog = spyOn<any>(service, 'handleCreateQuestionDialog');
        service.dialogState = false;
        questionServiceSpy.openCreateQuestionModal.and.returnValue(mockDialogRef);
        const mock = new MockCreateQuestionComponent();
        mockDialogRef.componentInstance = mock;
        service.openCreateQuestionDialog();
        mock.mockEmit();
        expect(questionServiceSpy.openCreateQuestionModal).toHaveBeenCalled();
        expect(spyHandleDialog).toHaveBeenCalled();
    });

    it('should set currentQuestion on dragQuizQuestion', () => {
        const mockQuestion: Question = getMockQuestion();
        service.dragQuizQuestion(mockQuestion);
        expect(service.currentQuestion).toEqual(mockQuestion);
    });

    it('should call openConfirmDialog on dropQuizQuestion if container is present', () => {
        const mockEvent = { event: { target: { closest: () => true } } } as unknown as CdkDragEnd<Question[]>;
        spyOn(service, 'openConfirmDialog');
        service.dropQuizQuestion(mockEvent);
        expect(service.openConfirmDialog).toHaveBeenCalled();
    });

    it('should not call openConfirmDialog on dropQuizQuestion if container is not present', () => {
        const mockEvent = {
            event: { target: { closest: () => false } },
        } as unknown as CdkDragEnd<Question[]>;

        spyOn(service, 'openConfirmDialog');
        service.dropQuizQuestion(mockEvent);
        expect(service.openConfirmDialog).not.toHaveBeenCalled();
    });

    it('should set isBankQuestionDragged to true on dragBankQuestion', () => {
        service.dragBankQuestion();
        expect(service.isBankQuestionDragged).toBeTrue();
    });

    it('should set isBankQuestionDragged to false on dropBankQuestion', () => {
        service.dropBankQuestion();
        expect(service.isBankQuestionDragged).toBeFalse();
    });

    it('should move question within the quiz list and mark changes', () => {
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});

        const mockListQuestions: Question[] = [
            { id: '1', text: 'Question 1', type: 'QCM', points: 10, lastModification: '' },
            { id: '2', text: 'Question 2', type: 'QCM', points: 20, lastModification: '' },
            { id: '3', text: 'Question 3', type: 'QCM', points: 30, lastModification: '' },
        ];
        service.game.questions = [...mockListQuestions];

        const container = { data: service.game.questions };
        const mockDragDropEvent = {
            previousIndex: 0,
            currentIndex: 1,
            container,
            previousContainer: container,
        } as unknown as CdkDragDrop<Question[]>;
        service.dropInQuizList(mockDragDropEvent);
        expect(service.game.questions[0].id).toEqual('2');
        expect(service.game.questions[1].id).toEqual('1');
        expect(changesSpy).toHaveBeenCalled();
    });

    it('should transfer question to another list if not duplicate and mark changes', () => {
        const mockDragDropEvent = {
            previousContainer: { data: [...mockBankQuestions] },
            container: { data: service.game.questions },
            previousIndex: 0,
            currentIndex: 0,
        } as unknown as CdkDragDrop<Question[]>;

        const duplicateSpy = spyOn<any>(service, 'isDuplicateQuestion').and.returnValue(false);
        spyOn<any>(service, 'setBankMessage').and.returnValue({});
        const changesSpy = spyOn<any>(service, 'markPendingChanges').and.returnValue({});

        service.dropInQuizList(mockDragDropEvent);

        expect(duplicateSpy).toHaveBeenCalled();
        expect(changesSpy).toHaveBeenCalled();
    });

    it('should display error message if dropping duplicate question in quiz list', () => {
        spyOn<any>(service, 'isDuplicateQuestion').and.returnValue(true);

        const mockDragDropEvent = {
            previousContainer: { data: mockBankQuestions },
            container: { data: mockQuestions },
            previousIndex: 0,
            currentIndex: 0,
        } as unknown as CdkDragDrop<Question[]>;

        service.dropInQuizList(mockDragDropEvent);
        expect(service['notificationService'].displayErrorMessage).toHaveBeenCalled();
    });

    it('should prompt user to confirm adding question to bank', async () => {
        const addQuestionSpy = spyOn<any, any>(service, 'addQuestionToBank').and.returnValue({});
        const mockConfirmation = true;
        service.currentQuestion = mockBankQuestions[0];
        notificationServiceSpy.confirmBankUpload.and.returnValue(of(mockConfirmation));
        await service.openConfirmDialog();
        expect(notificationServiceSpy.confirmBankUpload).toHaveBeenCalled();
        expect(addQuestionSpy).toHaveBeenCalled();
    });

    it('should not add question to bank if user cancels on confirmation dialog', async () => {
        const addQuestionSpy = spyOn<any, any>(service, 'addQuestionToBank').and.returnValue({});
        const mockConfirmation = false;
        service.currentQuestion = mockBankQuestions[0];
        notificationServiceSpy.confirmBankUpload.and.returnValue(of(mockConfirmation));

        await service.openConfirmDialog();

        expect(notificationServiceSpy.confirmBankUpload).toHaveBeenCalled();
        expect(questionServiceSpy.createQuestion).not.toHaveBeenCalled();
        expect(addQuestionSpy).not.toHaveBeenCalled();
    });

    it('should add verified question to game and mark pending changes', () => {
        bankServiceSpy.addToBank = false;
        const newQuestion: Question = getMockQuestion();
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});

        questionServiceSpy.verifyQuestion.and.returnValue(of(mockHttpResponse));

        service['addQuestionToGame'](newQuestion);

        expect(notificationServiceSpy.displaySuccessMessage).toHaveBeenCalledWith(QuestionStatus.VERIFIED);
        expect(service.game.questions).toContain(newQuestion);
        expect(changesSpy).toHaveBeenCalled();
    });

    it('should add verified question to game and bank if addToBank is toggled', () => {
        bankServiceSpy.addToBank = true;
        service.originalBankQuestions = [getMockQuestion()];
        const previousBankLength = service.originalBankQuestions.length;
        const newQuestion: Question = getMockQuestion();

        questionServiceSpy.verifyQuestion.and.returnValue(of(mockHttpResponse));

        service['addQuestionToGame'](newQuestion);

        expect(service.game.questions).toContain(newQuestion);
        expect(service.originalBankQuestions.length).toEqual(previousBankLength + 1);
    });

    it('should display error message when verification fails', () => {
        const errorMessage = 'Question should contain at least 1 wrong and 1 right answer';
        questionServiceSpy.verifyQuestion.and.returnValue(throwError(() => new Error(errorMessage)));
        service['addQuestionToGame'](getMockQuestion());
        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalledWith(`${QuestionStatus.UNVERIFIED} \n ${errorMessage}`);
    });

    it('handleDialog() should add question if applicable and close dialog', () => {
        const spyAdd = spyOn<any, any>(service, 'addQuestionToGame').and.returnValue({});
        const mockQuestion = getMockQuestion();
        service['handleCreateQuestionDialog'](mockQuestion, mockDialogRef);
        expect(spyAdd).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(service.dialogState).toBeFalsy();
    });

    it('setGame() should set the game with correct id', () => {
        const resetSpy = spyOn<any, any>(service, 'resetStateForNewGame').and.returnValue({});
        gameServiceSpy.getGameById.and.returnValue(of(mockGame));

        service.setGame('id');

        expect(service.state).toEqual(ManagementState.GameModify);
        expect(service.game).toBe(mockGame);
        expect(resetSpy).toHaveBeenCalled();
    });

    it('setNewGame() should set the game as an empty game ', () => {
        const resetSpy = spyOn<any, any>(service, 'resetStateForNewGame').and.returnValue({});

        service.setNewGame();

        expect(service.state).toEqual(ManagementState.GameCreate);
        expect(service.game.id).toBe('');
        expect(service.game.questions.length).toBe(0);
        expect(resetSpy).toHaveBeenCalled();
    });

    it('deleteQuestion() should be able to delete a question from the list and update bank question list', () => {
        const messageSpy = spyOn<any, any>(service, 'setBankMessage').and.returnValue({});
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});
        service.originalBankQuestions = [...mockBankQuestions];
        service.bankQuestions = [];
        service.game.questions = Object.assign([], mockBankQuestions);

        service.deleteQuestion('1');

        expect(service.game.questions.length).toBe(1);
        expect(service.bankQuestions.length).toBe(1);
        expect(messageSpy).toHaveBeenCalled();
        expect(changesSpy).toHaveBeenCalled();
    });

    it('resetStateForNewGame() should initialise game form', () => {
        const subscribeSpy = spyOn<any, any>(service, 'subscribeToFormChanges').and.returnValue({});
        const setBannkSpy = spyOn<any, any>(service, 'setBankQuestions').and.returnValue({});
        const changesSpy = spyOn<any, any>(service, 'resetPendingChanges').and.returnValue({});

        service['resetStateForNewGame']();

        expect(service.gameForm.value).toEqual({
            title: mockGame.title,
            description: mockGame.description,
            duration: mockGame.duration.toString(),
        });
        expect(subscribeSpy).toHaveBeenCalled();
        expect(setBannkSpy).toHaveBeenCalled();
        expect(changesSpy).toHaveBeenCalled();
    });

    it('setBankQuestions() should fill local question bank', () => {
        questionServiceSpy.getAllQuestions.and.returnValue(of(mockBankQuestions));
        const filterSpy = spyOn<any, any>(service, 'filterBankQuestions').and.returnValue(mockQuestions);
        const messageSpy = spyOn<any, any>(service, 'setBankMessage').and.returnValue({});

        service['setBankQuestions']();

        expect(filterSpy).toHaveBeenCalled();
        expect(messageSpy).toHaveBeenCalled();
        expect(service.originalBankQuestions).toEqual(mockBankQuestions);
        expect(service.bankQuestions).toEqual(mockQuestions);
    });

    it('setBankQuestions() should handle http error', () => {
        const errorMessage = 'Error getting bank questions';
        questionServiceSpy.getAllQuestions.and.returnValue(throwError(() => new HttpErrorResponse({ error: errorMessage })));
        const filterSpy = spyOn<any, any>(service, 'filterBankQuestions').and.returnValue({});
        const messageSpy = spyOn<any, any>(service, 'setBankMessage').and.returnValue({});

        service['setBankQuestions']();

        expect(notificationServiceSpy.displayErrorMessage).toHaveBeenCalled();
        expect(filterSpy).not.toHaveBeenCalled();
        expect(messageSpy).not.toHaveBeenCalled();
    });

    it('addQuestionToBank() delegate adding bank question to bank service if new question is unique', () => {
        spyOn<any, any>(service, 'isDuplicateQuestion').and.returnValue(false);
        const newQuestion = getMockQuestion();
        service.originalBankQuestions = [getMockQuestion()];
        const previousBankLength = service.originalBankQuestions.length;

        service['addQuestionToBank'](newQuestion);

        expect(service.originalBankQuestions.length).toEqual(previousBankLength + 1);
        expect(bankServiceSpy.addQuestion).toHaveBeenCalledWith(newQuestion);
    });

    it('subscribeToFormChanges() should subscribe to all form changes', () => {
        const titleSpy = spyOn<any, any>(service, 'subscribeToFormTitle').and.returnValue(false);
        const descriptionSpy = spyOn<any, any>(service, 'subscribeToFormDescription').and.returnValue(false);
        const durationSpy = spyOn<any, any>(service, 'subscribeToFormDuration').and.returnValue(false);

        service['subscribeToFormChanges']();

        expect(titleSpy).toHaveBeenCalled();
        expect(descriptionSpy).toHaveBeenCalled();
        expect(durationSpy).toHaveBeenCalled();
    });

    it('subscribeToFormTitle() should subscribe to form title', () => {
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});

        service['subscribeToFormTitle']();
        service.gameForm.setValue({ title: mockGame.title, description: mockGame.description, duration: mockGame.duration.toString() });

        expect(service.game.title).toEqual(mockGame.title);
        expect(changesSpy).toHaveBeenCalled();
    });

    it('subscribeToFormDescription() should subscribe to form description', () => {
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});
        service['subscribeToFormDescription']();
        service.gameForm.setValue({ title: mockGame.title, description: mockGame.description, duration: mockGame.duration.toString() });

        expect(service.game.description).toEqual(mockGame.description);
        expect(changesSpy).toHaveBeenCalled();
    });

    it('subscribeToFormDuration() should subscribe to form duration', () => {
        const changesSpy = spyOn<any, any>(service, 'markPendingChanges').and.returnValue({});
        service['subscribeToFormDuration']();
        service.gameForm.setValue({ title: mockGame.title, description: mockGame.description, duration: mockGame.duration.toString() });

        expect(service.game.duration).toEqual(mockGame.duration);
        expect(changesSpy).toHaveBeenCalled();
    });
});
