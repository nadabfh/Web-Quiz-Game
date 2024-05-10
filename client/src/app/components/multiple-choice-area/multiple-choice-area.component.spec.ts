import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleChoiceAreaComponent } from './multiple-choice-area.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Choice } from '@app/interfaces/choice';
import { AnswerService } from '@app/services/answer/answer.service';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import spyObj = jasmine.SpyObj;
import { getMockQuestion } from '@app/constants/question-mocks';
import { Question } from '@app/interfaces/question';

describe('MultipleChoiceAreaComponent', () => {
    let component: MultipleChoiceAreaComponent;
    let fixture: ComponentFixture<MultipleChoiceAreaComponent>;
    let answerSpy: spyObj<AnswerService>;
    let matchRoomSpy: spyObj<MatchRoomService>;
    let questionContextSpy: spyObj<MatchContextService>;
    let mockQuestion: Question;
    let mockChoice: Choice;

    beforeEach(() => {
        answerSpy = jasmine.createSpyObj('AnswerService', [
            'selectChoice',
            'deselectChoice',
            'submitAnswer',
            'onFeedback',
            'onBonusPoints',
            'onEndGame',
            'onTimesUp',
            'onGradeAnswers',
            'resetStateForNewQuestion',
            'listenToAnswerEvents',
        ]);

        matchRoomSpy = jasmine.createSpyObj('MatchRoomService', [
            'goToNextQuestion',
            'getUsername',
            'getRoomCode',
            'disconnect',
            'sendPlayersData',
            'onRouteToResultsPage',
            'routeToResultsPage',
            'onGameOver',
        ]);

        questionContextSpy = jasmine.createSpyObj('QuestionContextService', ['getContext']);

        mockQuestion = getMockQuestion();
        matchRoomSpy.currentQuestion = mockQuestion;
        mockChoice = { text: 'Choice', isCorrect: false };
        matchRoomSpy.currentQuestion.choices = [mockChoice];

        TestBed.configureTestingModule({
            declarations: [MultipleChoiceAreaComponent],
            imports: [RouterTestingModule, HttpClientTestingModule, MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule],
            providers: [
                { provide: AnswerService, useValue: answerSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
            ],
        });
        fixture = TestBed.createComponent(MultipleChoiceAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(true).toBeTruthy();
        expect(component).toBeTruthy();
    });

    it('should select a choice when a number key is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: '1' });

        spyOn(component, 'selectChoice');

        component.handleKeyboardEvent(event);
        expect(component.selectChoice).toHaveBeenCalledWith(mockChoice);
    });

    it('should not select a choice when an invalid key is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'A' });

        spyOn(component, 'selectChoice');

        component.handleKeyboardEvent(event);
        expect(component.selectChoice).not.toHaveBeenCalledWith(mockChoice);
    });

    it('should not select a choice when there are no choices', () => {
        const event = new KeyboardEvent('keydown', { key: '1' });
        matchRoomSpy.currentQuestion.choices = [];

        spyOn(component, 'selectChoice');

        component.handleKeyboardEvent(event);
        expect(component.selectChoice).not.toHaveBeenCalled();
    });

    it('should not select a choice when chat is focused', async () => {
        const chatInput = document.createElement('input');
        chatInput.id = 'chat-input';
        Object.defineProperty(document, 'activeElement', { value: chatInput, writable: true });

        const event = new KeyboardEvent('keydown', { key: '1' });
        spyOn(component, 'selectChoice');

        component.handleKeyboardEvent(event);
        expect(component.selectChoice).not.toHaveBeenCalled();

        Object.defineProperty(document, 'activeElement', { value: component, writable: true });
    });

    it('should add the choice to selectedAnswers if it is not already included', () => {
        answerSpy.isSelectionEnabled = true;
        component.selectedAnswers = [];

        component.selectChoice(mockChoice);

        expect(component.selectedAnswers).toContain(mockChoice);
    });

    it('should remove the choice from selectedAnswers if it is already included', () => {
        answerSpy.isSelectionEnabled = true;
        component.selectedAnswers = [mockChoice];

        component.selectChoice(mockChoice);

        expect(component.selectedAnswers).not.toContain(mockChoice);
    });

    it('should not add or remove the choice if isSelectionEnabled is false', () => {
        answerSpy.isSelectionEnabled = false;
        component.selectedAnswers = [];

        component.selectChoice(mockChoice);

        expect(component.selectedAnswers).toEqual([]);
    });

    it('should return true if the choice is included in selectedAnswers', () => {
        component.selectedAnswers = [mockChoice];

        expect(component.isSelected(mockChoice)).toBeTrue();
    });

    it('should return false if the choice is not included in selectedAnswers', () => {
        component.selectedAnswers = [];

        expect(component.isSelected(mockChoice)).toBeFalse();
    });

    it('should return true if the choice is included in correctAnswers', () => {
        answerSpy.correctAnswer = [mockChoice.text];

        expect(component.isCorrectAnswer(mockChoice)).toBeTrue();
    });

    it('should return false if the choice is not included in correctAnswers', () => {
        answerSpy.correctAnswer = [];

        expect(component.isCorrectAnswer(mockChoice)).toBeFalse();
    });

    it('should reset the state for a new question when resetStateForNewQuestion is called', () => {
        answerSpy.showFeedback = true;
        component.selectedAnswers = [mockChoice];

        component['resetStateForNewQuestion']();

        expect(answerSpy.showFeedback).toBeFalse();
        expect(component.selectedAnswers).toEqual([]);
        expect(answerSpy.resetStateForNewQuestion).toHaveBeenCalled();
    });
});
