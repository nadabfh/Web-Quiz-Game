/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LongAnswerAreaComponent } from './long-answer-area.component';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { AnswerService } from '@app/services/answer/answer.service';
import { getMockQuestion } from '@app/constants/question-mocks';
import { Question } from '@app/interfaces/question';
import spyObj = jasmine.SpyObj;
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LongAnswerComponent', () => {
    let component: LongAnswerAreaComponent;
    let fixture: ComponentFixture<LongAnswerAreaComponent>;
    let answerSpy: spyObj<AnswerService>;
    let matchRoomSpy: spyObj<MatchRoomService>;
    let questionContextSpy: spyObj<MatchContextService>;
    let mockQuestion: Question;

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

        TestBed.configureTestingModule({
            imports: [MatIconModule, MatFormFieldModule, MatInputModule, NoopAnimationsModule],
            declarations: [LongAnswerAreaComponent, MatHint, MatLabel],

            providers: [
                { provide: AnswerService, useValue: answerSpy },
                { provide: MatchRoomService, useValue: matchRoomSpy },
                { provide: MatchContextService, useValue: questionContextSpy },
            ],
        });
        fixture = TestBed.createComponent(LongAnswerAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return an array of strings and AnswerCorrectness enum values', () => {
        const answerOptions = component.answerOptions;
        expect(answerOptions).toEqual([0, 50, 100]);
    });
});
