import { Injectable } from '@angular/core';
import { MatchContext } from '@app/constants/states';
import { MatchRoomService } from '@app/services/match-room/match-room.service';
import { MatchContextService } from '@app/services/question-context/question-context.service';
import { SocketHandlerService } from '@app/services/socket-handler/socket-handler.service';
import { TimeService } from '@app/services/time/time.service';
import { AnswerCorrectness } from '@common/constants/answer-correctness';
import { AnswerEvents } from '@common/events/answer.events';
import { MatchEvents } from '@common/events/match.events';
import { ChoiceInfo } from '@common/interfaces/choice-info';
import { Feedback } from '@common/interfaces/feedback';
import { GradesInfo } from '@common/interfaces/grades-info';
import { LongAnswerInfo } from '@common/interfaces/long-answer-info';
import { UserInfo } from '@common/interfaces/user-info';

@Injectable({
    providedIn: 'root',
})
export class AnswerService {
    playersAnswers: LongAnswerInfo[];
    feedback: Feedback;
    gradeAnswers: boolean;
    isGradingComplete: boolean;
    showFeedback: boolean;
    isNextQuestionButtonEnabled: boolean;
    isSelectionEnabled: boolean;
    correctAnswer: string[];
    answerCorrectness: AnswerCorrectness;
    playerScore: number;
    bonusPoints: number;
    isTimesUp: boolean;
    isEndGame: boolean;
    currentLongAnswer: string;

    // Allow more constructor parameters to decouple services
    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketHandlerService,
        public matchRoomService: MatchRoomService,
        private readonly matchContextService: MatchContextService,
        private readonly timeService: TimeService,
    ) {
        this.listenToAnswerEvents();
    }

    listenToAnswerEvents() {
        this.onFeedback();
        this.onBonusPoints();
        this.onEndGame();
        this.onTimesUp();
        this.onGradeAnswers();
        this.onNextQuestion();
    }

    resetStateForNewQuestion() {
        this.feedback = {} as Feedback;
        this.correctAnswer = [];
        this.gradeAnswers = false;
        this.isGradingComplete = false;
        this.showFeedback = false;
        this.isSelectionEnabled = true;
        this.answerCorrectness = AnswerCorrectness.WRONG;
        this.bonusPoints = 0;
        this.isNextQuestionButtonEnabled = false;
        this.isTimesUp = false;
        this.isEndGame = false;
        this.currentLongAnswer = '';
        this.timeService.isPanicModeDisabled = false;
        this.timeService.isTimerPaused = false;
    }

    selectChoice(choice: string, userInfo: UserInfo) {
        const choiceInfo: ChoiceInfo = { choice, userInfo };
        this.socketService.send(AnswerEvents.SelectChoice, choiceInfo);
    }

    deselectChoice(choice: string, userInfo: UserInfo) {
        const choiceInfo: ChoiceInfo = { choice, userInfo };
        this.socketService.send(AnswerEvents.DeselectChoice, choiceInfo);
    }

    submitAnswer(userInfo: UserInfo) {
        this.isSelectionEnabled = false;
        this.socketService.send(AnswerEvents.SubmitAnswer, userInfo);
    }

    updateLongAnswer() {
        if (!this.isSelectionEnabled) return;
        const userInfo = { username: this.matchRoomService.getUsername(), roomCode: this.matchRoomService.getRoomCode() };
        const choiceInfo: ChoiceInfo = { choice: this.currentLongAnswer, userInfo };
        this.socketService.send(AnswerEvents.UpdateLongAnswer, choiceInfo);
    }

    onFeedback() {
        this.socketService.on(AnswerEvents.Feedback, (feedback: Feedback) => {
            this.feedback = feedback;
            this.showFeedback = true;
            this.isNextQuestionButtonEnabled = true;

            if (feedback) this.processFeedback(feedback);
        });
    }

    onBonusPoints() {
        this.socketService.on(AnswerEvents.Bonus, (bonus: number) => {
            this.bonusPoints = bonus;
        });
    }

    onEndGame() {
        this.socketService.on(AnswerEvents.EndGame, () => {
            this.isEndGame = true;
        });
    }

    onGradeAnswers() {
        this.socketService.on(AnswerEvents.GradeAnswers, (answers: LongAnswerInfo[]) => {
            this.playersAnswers = answers;
            this.gradeAnswers = true;
        });
    }

    onNextQuestion() {
        this.socketService.on(MatchEvents.GoToNextQuestion, () => {
            this.resetStateForNewQuestion();
        });
    }

    onTimesUp() {
        this.socketService.on(AnswerEvents.TimesUp, () => {
            this.isTimesUp = true;
            this.isSelectionEnabled = false;
        });
    }

    sendGrades() {
        this.gradeAnswers = false;
        const gradesInfo: GradesInfo = { matchRoomCode: this.matchRoomService.getRoomCode(), grades: this.playersAnswers };
        this.socketService.send(AnswerEvents.Grades, gradesInfo);
    }

    handleGrading(): void {
        this.isGradingComplete = this.playersAnswers.every((answer: LongAnswerInfo) => answer.score !== null);
    }

    private processFeedback(feedback: Feedback) {
        if (this.feedback.correctAnswer) this.correctAnswer = this.feedback.correctAnswer;
        this.isSelectionEnabled = false;
        this.answerCorrectness = feedback.answerCorrectness;
        this.playerScore = feedback.score;
        this.matchRoomService.sendPlayersData(this.matchRoomService.getRoomCode());
        this.finaliseRound();
    }

    private finaliseRound() {
        const context = this.matchContextService.getContext();
        if (context === MatchContext.TestPage || context === MatchContext.RandomMode) {
            this.matchRoomService.goToNextQuestion();
            this.isNextQuestionButtonEnabled = false;
        }
    }
}
